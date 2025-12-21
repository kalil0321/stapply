import asyncio
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, send_file
import logging
import os
import subprocess
import sys
import tempfile
import threading
import requests
import uuid
import json
import base64
import io
import time
from urllib.parse import urlparse, urljoin
from PIL import Image
from pydantic import BaseModel, Field
# Using local browser automation only - no external services

load_dotenv()

# Check for required dependencies first - before other imports
try:
    import aiohttp  # type: ignore
    from playwright.async_api import Browser, Page, async_playwright  # type: ignore
    from playwright_stealth import Stealth
except ImportError as e:
    print(f"❌ Missing dependencies for this example: {e}")
    print("This example requires: playwright aiohttp")
    print("Install with: uv add playwright aiohttp")
    print("Also run: playwright install chromium")
    sys.exit(1)

from browser_use import Agent, BrowserSession, ChatOpenAI, Tools
from browser_use.agent.views import ActionResult

# Global Playwright browser instance - shared between custom actions
playwright_browser: Browser | None = None
playwright_page: Page | None = None


# Custom action parameter models
class PlaywrightFileUploadAction(BaseModel):
    """Parameters for Playwright file upload action."""

    file_path: str = Field(..., description="File path to upload")
    selector: str = Field(..., description="CSS selector for the file input field")


async def kill_existing_chrome_instances():
    """
    Kill any existing Chrome instances with remote debugging to avoid conflicts.
    """
    try:
        import subprocess

        # Find and kill existing Chrome processes with remote debugging
        result = subprocess.run(["ps", "aux"], capture_output=True, text=True)
        for line in result.stdout.split("\n"):
            if "remote-debugging-port" in line and "Google Chrome" in line:
                # Extract PID (second column)
                parts = line.split()
                if len(parts) > 1:
                    try:
                        pid = int(parts[1])
                        subprocess.run(["kill", str(pid)], capture_output=True)
                        print(f"✅ Killed existing Chrome instance (PID: {pid})")
                    except (ValueError, subprocess.SubprocessError):
                        continue
        # Wait a moment for processes to terminate
        await asyncio.sleep(2)
    except Exception as e:
        print(f"⚠️  Error killing existing Chrome instances: {e}")


def find_available_port(start_port: int = 9222) -> int:
    """
    Find an available port starting from start_port.
    """
    import socket

    for port in range(start_port, start_port + 100):  # Try 100 ports
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("localhost", port))
                return port
        except OSError:
            continue
    raise RuntimeError("❌ No available ports found for Chrome debugging")


async def start_chrome_with_debug_port(task_id: str = None, port: int = None):
    """
    Start Chrome with remote debugging enabled.
    Returns tuple of (Chrome process, port used).
    """
    # Kill any existing Chrome instances first
    await kill_existing_chrome_instances()

    # Find an available port if not specified
    if port is None:
        port = find_available_port()

    # Track the port for this task
    if task_id:
        task_chrome_instances[task_id] = {"port": port, "status": "starting"}

    # Create temporary directory for Chrome user data
    user_data_dir = tempfile.mkdtemp(prefix="chrome_cdp_")

    # Chrome launch command
    chrome_paths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",  # macOS
        "/usr/bin/google-chrome",  # Linux
        "/usr/bin/chromium-browser",  # Linux Chromium
        "chrome",  # Windows/PATH
        "chromium",  # Generic
    ]

    chrome_exe = None
    for path in chrome_paths:
        if os.path.exists(path) or path in ["chrome", "chromium"]:
            try:
                # Test if executable works
                test_proc = await asyncio.create_subprocess_exec(
                    path,
                    "--version",
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
                await test_proc.wait()
                chrome_exe = path
                break
            except Exception:
                continue

    if not chrome_exe:
        raise RuntimeError("❌ Chrome not found. Please install Chrome or Chromium.")

    # Chrome command arguments
    cmd = [
        chrome_exe,
        f"--remote-debugging-port={port}",
        f"--user-data-dir={user_data_dir}",
        "--remote-allow-origins=*",  # Allow WebSocket connections from any origin
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--window-size=1920,1080",  # Set viewport dimensions to match screencast
        "--force-device-scale-factor=1",  # Ensure consistent scaling
        "--disable-dev-shm-usage",  # Prevent shared memory issues
        "--no-sandbox",  # Required for headless mode in some environments
        "about:blank",  # Start with blank page
        "--headless=new",  # Use new headless mode
    ]

    # Start Chrome process
    process = await asyncio.create_subprocess_exec(
        *cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )

    # Wait for Chrome to start and CDP to be ready
    cdp_ready = False
    for _ in range(20):  # 20 second timeout
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"http://localhost:{port}/json/version",
                    timeout=aiohttp.ClientTimeout(total=1),
                ) as response:
                    if response.status == 200:
                        cdp_ready = True
                        break
        except Exception:
            pass
        await asyncio.sleep(1)

    if not cdp_ready:
        process.terminate()
        if task_id and task_id in task_chrome_instances:
            del task_chrome_instances[task_id]
        raise RuntimeError("❌ Chrome failed to start with CDP")

    # Update task status
    if task_id:
        task_chrome_instances[task_id]["status"] = "running"
        task_chrome_instances[task_id]["process"] = process

    return process, port


async def connect_playwright_to_cdp(cdp_url: str):
    """
    Connect Playwright to the same Chrome instance Browser-Use is using.
    This enables custom actions to use Playwright functions.
    Apply stealth to all contexts to avoid detection.
    """
    global playwright_browser, playwright_page

    playwright = await async_playwright().start()
    playwright_browser = await playwright.chromium.connect_over_cdp(cdp_url)

    # Apply stealth to all existing contexts
    stealth = Stealth()
    if playwright_browser and playwright_browser.contexts:
        for context in playwright_browser.contexts:
            try:
                await stealth.apply_stealth_async(context)
                print(f"✅ Applied stealth to existing context")
            except Exception as e:
                print(f"⚠️  Failed to apply stealth to context: {e}")

    # Get or create a page
    if (
        playwright_browser
        and playwright_browser.contexts
        and playwright_browser.contexts[0].pages
    ):
        playwright_page = playwright_browser.contexts[0].pages[0]
    elif playwright_browser:
        context = await playwright_browser.new_context()
        await stealth.apply_stealth_async(context)
        playwright_page = await context.new_page()


# Create custom tools that use Playwright functions
tools = Tools()


@tools.registry.action(
    "Upload a file using Playwright's file upload capabilities. Use this when you need to upload a file to a file input field.",
    param_model=PlaywrightFileUploadAction,
)
async def playwright_file_upload(
    params: PlaywrightFileUploadAction, browser_session: BrowserSession
):
    """
    Custom action that uses Playwright to upload a file to file input elements.
    """

    print(f"Uploading file: {params.file_path}")
    print(f"Selector: {params.selector}")

    try:
        print("🔍 Starting file upload process...")

        if not playwright_page:
            print("❌ Playwright not connected. Run setup first.")
            return ActionResult(error="Playwright not connected. Run setup first.")

        print("✅ Playwright page is connected")

        # Check if the file exists
        if not os.path.exists(params.file_path):
            print(f"❌ File not found: {params.file_path}")
            return ActionResult(error=f"File not found: {params.file_path}")

        print(f"✅ File exists: {params.file_path}")
        print(f"📁 File size: {os.path.getsize(params.file_path)} bytes")

        # Wait for the page to be ready and try multiple strategies
        print("⏳ Waiting for page to be ready and dynamic content to load...")
        try:
            await playwright_page.wait_for_load_state(
                "networkidle", timeout=15000
            )  # Increased timeout
            print("✅ Page is ready (networkidle)")
        except Exception as networkidle_error:
            print(
                f"⚠️  NetworkIdle timeout, trying 'domcontentloaded' instead: {networkidle_error}"
            )
            try:
                await playwright_page.wait_for_load_state(
                    "domcontentloaded", timeout=5000
                )
                print("✅ Page is ready (domcontentloaded)")
            except Exception as dom_error:
                print(f"⚠️  DOM load also failed, continuing anyway: {dom_error}")
                print("🔄 Proceeding without waiting for page load state...")

        # Additional wait for dynamic content to load
        print("⏳ Waiting additional time for dynamic content...")
        await asyncio.sleep(3)  # Give more time for JavaScript to render components

        # Try to trigger dynamic content loading with JavaScript
        print("🔄 Triggering dynamic content with JavaScript...")
        try:
            # Trigger any click events that might load content
            await playwright_page.evaluate("""
				// Try to trigger any lazy loading
				window.dispatchEvent(new Event('scroll'));
				window.dispatchEvent(new Event('resize'));
				
				// Look for elements that might trigger file upload UI
				const uploadButtons = document.querySelectorAll('button, div, span');
				uploadButtons.forEach(btn => {
					const text = btn.textContent?.toLowerCase() || '';
					if (text.includes('upload') || text.includes('file') || text.includes('resume')) {
						console.log('Found potential upload trigger:', btn);
						// Hover to trigger any hover effects
						btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
					}
				});
				
				// Wait a bit for any async operations
				return new Promise(resolve => setTimeout(resolve, 1000));
			""")
            print("✅ JavaScript triggers executed")
        except Exception as js_error:
            print(f"⚠️  JavaScript execution failed: {js_error}")

        # Try to trigger any lazy-loaded content by scrolling
        print("🔄 Scrolling to trigger lazy-loaded content...")
        try:
            await playwright_page.evaluate(
                "window.scrollTo(0, document.body.scrollHeight)"
            )
            await asyncio.sleep(1)
            await playwright_page.evaluate("window.scrollTo(0, 0)")
            await asyncio.sleep(1)
        except Exception as scroll_error:
            print(f"⚠️  Scrolling failed: {scroll_error}")

        # Check for iframes that might contain the file input
        print("🔍 Checking for iframes...")
        try:
            iframes = await playwright_page.query_selector_all("iframe")
            print(f"📋 Found {len(iframes)} iframes")
            for i, iframe in enumerate(iframes):
                try:
                    src = await iframe.get_attribute("src")
                    name = await iframe.get_attribute("name")
                    iframe_id = await iframe.get_attribute("id")
                    print(
                        f"  iframe {i + 1}: src='{src}', name='{name}', id='{iframe_id}'"
                    )
                except Exception as iframe_attr_error:
                    print(
                        f"  iframe {i + 1}: Could not get attributes - {iframe_attr_error}"
                    )
        except Exception as iframe_error:
            print(f"⚠️  Error checking iframes: {iframe_error}")

        # Take a screenshot and save HTML after all loading attempts
        print("✅ Completed dynamic content loading attempts")

        print(f"🔍 Looking for file input with selector: {params.selector}")

        # First, let's debug what file-related elements are available on the page
        print("🔍 Debugging: Looking for all file-related elements on the page...")
        try:
            print("🔍 Step 1: Querying for input[type='file'] elements...")
            all_file_inputs = await playwright_page.query_selector_all(
                'input[type="file"]'
            )
            print(f"📋 Found {len(all_file_inputs)} file input elements")

            print("🔍 Step 2: Getting attributes for each file input...")
            for i, input_elem in enumerate(all_file_inputs):
                try:
                    # Get various attributes to help identify the correct input
                    input_id = await input_elem.get_attribute("id")
                    input_name = await input_elem.get_attribute("name")
                    input_class = await input_elem.get_attribute("class")
                    input_accept = await input_elem.get_attribute("accept")
                    is_hidden = await input_elem.is_hidden()

                    print(
                        f"  Input {i + 1}: id='{input_id}', name='{input_name}', class='{input_class}', accept='{input_accept}', hidden={is_hidden}"
                    )
                except Exception as attr_error:
                    print(
                        f"  ⚠️  Error getting attributes for input {i + 1}: {attr_error}"
                    )

            # Also look for buttons and divs that might trigger file uploads
            print("🔍 Step 3: Looking for upload-related buttons and elements...")
            upload_buttons = await playwright_page.query_selector_all(
                "button, div, span, a"
            )
            upload_related = []

            for button in upload_buttons:
                try:
                    text_content = await button.text_content()
                    if text_content and any(
                        keyword in text_content.lower()
                        for keyword in [
                            "upload",
                            "file",
                            "resume",
                            "attach",
                            "browse",
                            "choose",
                        ]
                    ):
                        button_tag = await button.evaluate("el => el.tagName")
                        button_id = await button.get_attribute("id")
                        button_class = await button.get_attribute("class")
                        upload_related.append(
                            {
                                "tag": button_tag,
                                "text": text_content.strip(),
                                "id": button_id,
                                "class": button_class,
                            }
                        )
                except Exception as button_error:
                    print(f"    ⚠️  Error processing upload button: {button_error}")
                    continue

            print(f"📋 Found {len(upload_related)} upload-related buttons/elements:")
            for i, elem in enumerate(upload_related[:10]):  # Limit to first 10
                print(
                    f"  Element {i + 1}: <{elem['tag']}> text='{elem['text']}', id='{elem['id']}', class='{elem['class']}'"
                )

            # Specifically look for the hidden resume input pattern
            print("🔍 Step 4: Looking for specific hidden resume input pattern...")
            try:
                hidden_resume_input = await playwright_page.query_selector(
                    'input[id*="systemfield"][id*="resume"][type="file"]'
                )
                if hidden_resume_input:
                    input_id = await hidden_resume_input.get_attribute("id")
                    is_hidden = await hidden_resume_input.is_hidden()
                    print(
                        f"  ✅ Found hidden resume input: id='{input_id}', hidden={is_hidden}"
                    )
                else:
                    print("  ❌ No hidden resume input found with expected pattern")
            except Exception as hidden_error:
                print(f"  ⚠️  Error looking for hidden resume input: {hidden_error}")

        except Exception as debug_e:
            print(f"⚠️  Debug error during file element discovery: {debug_e}")
            print(f"🔍 Error type: {type(debug_e).__name__}")
            if "Timeout" in str(debug_e):
                print(
                    "💡 This looks like a timeout - the page might still be loading or have network issues"
                )

        # Try the provided selector first - check for multiple matches
        print("🔍 Step 4: Attempting to find element with provided selector...")
        file_input = None
        selected_element = None

        try:
            print(f"  🔍 Checking for all matches of selector: {params.selector}")
            all_matches = await playwright_page.query_selector_all(params.selector)
            print(f"  📋 Found {len(all_matches)} elements matching the selector")

            if len(all_matches) > 0:
                # If multiple matches, log details about each
                for i, match in enumerate(all_matches):
                    try:
                        tag_name = await match.evaluate("el => el.tagName")
                        text_content = await match.text_content()
                        element_id = await match.get_attribute("id")
                        element_class = await match.get_attribute("class")
                        is_visible = await match.is_visible()

                        print(
                            f"    Match {i + 1}: <{tag_name}> text='{text_content}', id='{element_id}', class='{element_class}', visible={is_visible}"
                        )
                    except Exception as match_error:
                        print(
                            f"    Match {i + 1}: Error getting details - {match_error}"
                        )

                # Use the first visible match, or first match if none are visible
                for match in all_matches:
                    try:
                        is_visible = await match.is_visible()
                        if is_visible:
                            selected_element = match
                            print("  ✅ Using first visible match")
                            break
                    except Exception as visibility_error:
                        print(f"    ⚠️  Error checking visibility: {visibility_error}")
                        continue

                if not selected_element:
                    selected_element = all_matches[0]
                    print("  ⚠️  No visible matches, using first match")

                # Check if it's a file input or a button/element that might trigger file input
                tag_name = await selected_element.evaluate("el => el.tagName")
                input_type = await selected_element.get_attribute("type")

                if tag_name.lower() == "input" and input_type == "file":
                    file_input = selected_element
                    print("  ✅ Found direct file input element!")
                else:
                    print(
                        f"  🔍 Found <{tag_name}> element, checking if it triggers file input..."
                    )
                    # This might be a button that triggers a hidden file input
                    # We'll try to click it and see if a file input becomes available
                    selected_element = (
                        selected_element  # Keep reference for potential clicking
                    )
            else:
                print("  ❌ No elements found matching the selector")

        except Exception as selector_error:
            print(f"  ⚠️  Selector query failed: {selector_error}")
            print(f"  🔍 Error type: {type(selector_error).__name__}")

        # If we found a button/element but no direct file input, try clicking it first
        if not file_input and selected_element:
            print("🔍 Step 5: Trying to click element to reveal file input...")
            try:
                print("  🖱️  Clicking the selected element...")
                await selected_element.click()
                print("  ✅ Element clicked successfully")

                # Wait a moment for any file input to appear
                await asyncio.sleep(1)

                # Now try to find file inputs again
                print("  🔍 Looking for file inputs after click...")
                new_file_inputs = await playwright_page.query_selector_all(
                    'input[type="file"]'
                )
                print(f"  📋 Found {len(new_file_inputs)} file inputs after click")

                # Try to find a visible file input
                for input_elem in new_file_inputs:
                    try:
                        is_visible = await input_elem.is_visible()
                        is_hidden = await input_elem.is_hidden()
                        print(
                            f"  🔍 File input: visible={is_visible}, hidden={is_hidden}"
                        )
                        if not is_hidden:  # Use not hidden instead of is_visible for better compatibility
                            file_input = input_elem
                            print("  ✅ Found file input after click!")
                            break
                    except Exception as input_check_error:
                        print(f"    ⚠️  Error checking file input: {input_check_error}")
                        continue

            except Exception as click_error:
                print(f"  ⚠️  Failed to click element: {click_error}")

        # If still no file input, try common file input selectors
        if not file_input:
            print("🔄 Step 6: Trying fallback selectors...")
            fallback_selectors = [
                'input[type="file"]',
                "#_systemfield_resume",  # Specific to the job application form
                'input[id*="systemfield"]',
                'input[id*="resume"]',
                'input[name*="file"]',
                'input[name*="resume"]',
                'input[name*="upload"]',
                'input[accept*="pdf"]',
                'input[accept*="application"]',
                ".file-input input",
                '[data-testid*="file"] input',
                '[data-testid*="upload"] input',
            ]

            for i, selector in enumerate(fallback_selectors):
                try:
                    print(
                        f"  🔍 Trying fallback {i + 1}/{len(fallback_selectors)}: {selector}"
                    )
                    potential_inputs = await playwright_page.query_selector_all(
                        selector
                    )
                    print(f"    📋 Found {len(potential_inputs)} matches")

                    # Try each match to find a usable one
                    for j, potential_input in enumerate(potential_inputs):
                        try:
                            # For file inputs, we accept hidden ones too (they're often intentionally hidden)
                            input_type = await potential_input.get_attribute("type")
                            if input_type == "file":
                                file_input = potential_input
                                is_hidden = await potential_input.is_hidden()
                                print(
                                    f"  ✅ Found file input with fallback selector: {selector} (match {j + 1}, hidden={is_hidden})"
                                )
                                break
                            else:
                                # For non-file inputs, check visibility
                                is_hidden = await potential_input.is_hidden()
                                if not is_hidden:
                                    file_input = potential_input
                                    print(
                                        f"  ✅ Found usable element with fallback selector: {selector} (match {j + 1})"
                                    )
                                    break
                        except Exception as match_error:
                            print(f"    ⚠️  Error checking match {j + 1}: {match_error}")
                            continue

                    if file_input:
                        break

                except Exception as fallback_error:
                    print(f"    ❌ Failed: {type(fallback_error).__name__}")
                    continue

        if not file_input:
            print(
                "❌ No file input element found on the page. Make sure you are on a page with a file upload form."
            )

            # Take a screenshot and save HTML when file input is not found - only if page has meaningful content
            print(
                "📸 Taking screenshot and saving HTML after file input search failed..."
            )
            try:
                # Check if page has meaningful content before taking screenshot
                html_content = await playwright_page.content()
                body_content = await playwright_page.evaluate(
                    "() => document.body.innerText.trim()"
                )

                if (
                    body_content and len(body_content) > 50
                ):  # Only screenshot if page has substantial content
                    screenshot_path = os.path.join(os.getcwd(), "screenshots")
                    os.makedirs(screenshot_path, exist_ok=True)

                    failed_screenshot = os.path.join(
                        screenshot_path, "file_input_not_found.png"
                    )
                    await playwright_page.screenshot(
                        path=failed_screenshot, full_page=True
                    )
                    print(f"✅ Failed search screenshot saved: {failed_screenshot}")

                    # Save HTML when search fails
                    failed_html = os.path.join(
                        screenshot_path, "file_input_not_found.html"
                    )
                    with open(failed_html, "w", encoding="utf-8") as f:
                        f.write(html_content)
                    print(f"✅ Failed search HTML saved: {failed_html}")
                else:
                    print(
                        "⚠️  Skipping screenshot - page appears to be blank or have minimal content"
                    )

            except Exception as screenshot_error:
                print(
                    f"⚠️  Failed to take failed search screenshot/HTML: {screenshot_error}"
                )

            return ActionResult(
                error="No file input element found on the page. Make sure you are on a page with a file upload form."
            )

        print("✅ File input element found")

        # Take a screenshot after successfully finding the file input
        print("📸 Taking screenshot after finding file input...")
        try:
            screenshot_path = os.path.join(os.getcwd(), "screenshots")
            found_screenshot = os.path.join(screenshot_path, "file_input_found.png")
            await playwright_page.screenshot(path=found_screenshot, full_page=True)
            print(f"✅ File input found screenshot saved: {found_screenshot}")
        except Exception as screenshot_error:
            print(f"⚠️  Failed to take file input found screenshot: {screenshot_error}")

        # Set the file on the input element
        print("🔍 Step 5: Uploading file to input element...")
        try:
            print(f"  📤 Setting file: {params.file_path}")
            await file_input.set_input_files(params.file_path)
            print("  ✅ File set on input element successfully")
        except Exception as upload_error:
            print(f"  ❌ File upload failed: {upload_error}")
            print(f"  🔍 Error type: {type(upload_error).__name__}")
            raise upload_error

        # Wait a moment for the file to be processed
        print("🔍 Step 6: Waiting for file processing...")
        print("⏳ Waiting 1 second for file to be processed...")
        await asyncio.sleep(1)

        # Verify the file was set by checking the input value
        print("🔍 Verifying file upload...")
        try:
            files = await file_input.evaluate(
                "el => el.files ? Array.from(el.files).map(f => f.name) : []"
            )
            print(f"📋 Files detected in input: {files}")
            if files:
                file_names = ", ".join(files)
                print(f"✅ File upload successful! Files: {file_names}")
                return ActionResult(
                    extracted_content=f"File(s) uploaded successfully using Playwright: {file_names}"
                )
            else:
                print("❌ No files detected in input after upload attempt")
                return ActionResult(
                    error="File upload may have failed - no files detected in input after upload attempt"
                )
        except Exception as e:
            print(f"⚠️  Verification failed with error: {str(e)}")
            # If verification fails, still report success as the upload command was executed
            return ActionResult(
                extracted_content=f"File upload command executed for: {params.file_path}. Verification failed but upload likely succeeded."
            )

    except Exception as e:
        error_msg = f"❌ Playwright file upload failed: {str(e)}"
        print(error_msg)
        print(f"🔍 Error details: {type(e).__name__}: {str(e)}")
        return ActionResult(error=error_msg)


def download_resume(resume_url: str) -> str:
    """
    Download resume from URL and save it to uploads directory with a unique ID.
    Returns the local file path.
    Raises an exception if download fails.
    Handles both absolute URLs and relative paths (e.g., /api/storage/resumes/...)
    """
    if not resume_url or not resume_url.strip():
        raise ValueError("Resume URL is required and cannot be empty")

    # Handle relative URLs (e.g., /api/storage/resumes/...)
    # Convert to full URL using Next.js server URL
    parsed = urlparse(resume_url)

    # If it's a relative URL (no scheme), construct full URL
    if not parsed.scheme or not parsed.netloc:
        # Get Next.js server URL from environment or default to localhost:3000
        nextjs_server_url = os.getenv("NEXTJS_SERVER_URL", "http://localhost:3000")
        # Remove trailing slash if present
        nextjs_server_url = nextjs_server_url.rstrip("/")
        # Construct full URL
        resume_url = urljoin(nextjs_server_url, resume_url)
        print(f"📝 Converted relative URL to full URL: {resume_url}")
        # Re-parse the full URL
        parsed = urlparse(resume_url)

    # Validate URL format after conversion
    if not parsed.scheme or not parsed.netloc:
        raise ValueError(f"Invalid resume URL format: {resume_url}")

    # Create uploads directory if it doesn't exist
    uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
    try:
        os.makedirs(uploads_dir, exist_ok=True)
    except Exception as e:
        raise RuntimeError(f"Failed to create uploads directory: {str(e)}")

    # Generate unique ID for the file
    file_id = str(uuid.uuid4())

    # Get file extension from URL or default to .pdf
    if resume_url.lower().endswith(".pdf"):
        file_ext = ".pdf"
    elif resume_url.lower().endswith(".doc"):
        file_ext = ".doc"
    elif resume_url.lower().endswith(".docx"):
        file_ext = ".docx"
    else:
        file_ext = ".pdf"  # Default to PDF

    # Create local file path
    local_filename = f"{file_id}{file_ext}"
    local_path = os.path.join(uploads_dir, local_filename)

    # Download the file with proper error handling
    try:
        print(f"📥 Downloading resume from: {resume_url}")
        response = requests.get(resume_url, timeout=30, stream=True)
        response.raise_for_status()

        # Check content type if available
        content_type = response.headers.get("content-type", "").lower()
        if (
            content_type
            and "application/pdf" not in content_type
            and "application/msword" not in content_type
            and "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            not in content_type
        ):
            print(f"⚠️  Warning: Unexpected content type: {content_type}")

        # Save the file
        total_size = 0
        max_size = 10 * 1024 * 1024  # 10MB limit
        with open(local_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    total_size += len(chunk)
                    if total_size > max_size:
                        os.remove(local_path)
                        raise ValueError(
                            f"Resume file too large (max {max_size / 1024 / 1024}MB)"
                        )

        # Verify file was saved and has content
        if not os.path.exists(local_path):
            raise RuntimeError("Resume file was not saved successfully")

        file_size = os.path.getsize(local_path)
        if file_size == 0:
            os.remove(local_path)
            raise ValueError("Downloaded resume file is empty")

        if file_size < 1024:  # Less than 1KB is suspicious
            print(f"⚠️  Warning: Resume file is very small ({file_size} bytes)")

        print(
            f"✅ Resume downloaded successfully: {local_path} ({file_size / 1024:.2f} KB)"
        )
        return local_path

    except requests.exceptions.Timeout:
        raise RuntimeError(f"Timeout while downloading resume from {resume_url}")
    except requests.exceptions.HTTPError as e:
        raise RuntimeError(
            f"HTTP error while downloading resume: {e.response.status_code} - {e.response.reason}"
        )
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Network error while downloading resume: {str(e)}")
    except Exception as e:
        # Clean up partial file if it exists
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except:
                pass
        raise RuntimeError(f"Failed to download resume: {str(e)}")


def cleanup_resume(file_path: str):
    """
    Delete the resume file after processing.
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"🗑️  Resume file cleaned up: {file_path}")
    except Exception as e:
        print(f"⚠️  Failed to cleanup resume file: {str(e)}")


app = Flask(__name__, template_folder="templates")
logging.basicConfig(level=logging.INFO)

# Enable CORS for all routes to allow Next.js frontend to connect
try:
    from flask_cors import CORS

    CORS(app, resources={r"/*": {"origins": "*"}})
except ImportError:
    print("⚠️  flask-cors not installed. Install with: pip install flask-cors")

    # Add manual CORS headers as fallback
    @app.after_request
    def after_request(response):
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add(
            "Access-Control-Allow-Headers", "Content-Type,Authorization"
        )
        response.headers.add(
            "Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS"
        )
        return response


# Global dictionary to store active Chrome sessions
active_sessions = {}

# Global dictionary to track task Chrome instances and their ports
task_chrome_instances = {}


@app.route("/screencast/<session_id>")
def screencast_viewer(session_id):
    """
    Serve the minimal screenshot-based viewer HTML page for a specific session.
    """
    return render_template("minimal-screenshots.html", session_id=session_id)


@app.route("/live-stream/<session_id>")
def live_stream_viewer(session_id):
    """
    Serve the minimal live streaming viewer HTML page for a specific session.
    """
    return render_template("minimal-live.html", session_id=session_id)


@app.route("/debug-screencast/<session_id>")
def debug_screencast_viewer(session_id):
    """
    Serve the full debug screenshot-based viewer HTML page for a specific session.
    """
    return render_template("screencast.html", session_id=session_id)


@app.route("/debug-live/<session_id>")
def debug_live_stream_viewer(session_id):
    """
    Serve the full debug live streaming viewer HTML page for a specific session.
    """
    return render_template("live-screencast.html", session_id=session_id)


@app.route("/replay/<session_id>")
def replay_viewer(session_id):
    """
    Serve the replay viewer HTML page for a specific session.
    """
    return render_template("replay.html", session_id=session_id)


@app.route("/test-screenshot")
def test_screenshot():
    """
    Test endpoint to verify screenshot functionality works.
    """
    try:
        # Check if Chrome is running
        tabs_response = requests.get("http://localhost:9222/json/list", timeout=5)
        if not tabs_response.ok:
            return f"❌ Chrome DevTools not accessible on port 9222<br>Status: {tabs_response.status_code}"

        tabs = tabs_response.json()
        if not tabs:
            return "❌ No browser tabs found"

        tab_info = f"✅ Chrome DevTools accessible<br>Found {len(tabs)} tabs:<br>"
        for i, tab in enumerate(tabs):
            url = tab.get("url", "No URL")
            title = tab.get("title", "No title")
            tab_info += f"  Tab {i + 1}: {title} - {url}<br>"

        return tab_info

    except Exception as e:
        return f"❌ Error: {str(e)}"


@app.route("/test-live-stream")
def test_live_stream():
    """
    Test endpoint to verify live streaming setup.
    """
    return f"""
    <html>
    <body style="font-family: monospace; background: #1a1a1a; color: #fff; padding: 20px;">
        <h2>🎥 Browser Automation Viewers</h2>
        
        <h3>📺 Live Viewers (Minimal UI):</h3>
        <ul>
            <li><a href="/live-stream/test-session" target="_blank" style="color: #4CAF50;">🔴 Live Stream (Real-time)</a></li>
            <li><a href="/screencast/test-session" target="_blank" style="color: #2196F3;">📸 Screenshots (Fallback)</a></li>
            <li><a href="/replay/test-session" target="_blank" style="color: #ff9800;">📹 Replay (Saved Screenshots)</a></li>
        </ul>
        
        <h3>🛠️ Debug Viewers (Full UI):</h3>
        <ul>
            <li><a href="/debug-live/test-session" target="_blank" style="color: #4CAF50;">Live Stream Debug</a></li>
            <li><a href="/debug-screencast/test-session" target="_blank" style="color: #2196F3;">Screenshots Debug</a></li>
        </ul>
        
        <h3>🔌 APIs:</h3>
        <ul>
            <li><a href="/api/live-stream/test-session" target="_blank" style="color: #ff9800;">Raw Live Stream API</a></li>
            <li><a href="/api/task-instances" target="_blank" style="color: #9c27b0;">All Task Instances</a></li>
            <li><a href="/api/task-ready/test-session" target="_blank" style="color: #e91e63;">Task Readiness Check</a></li>
            <li><a href="/api/task-screenshots/test-session" target="_blank" style="color: #795548;">Task Screenshots List</a></li>
        </ul>
        
        <h3>✨ Features:</h3>
        <ul style="color: #ccc; line-height: 1.6;">
            <li>🔄 <strong>Smart Loading:</strong> Detects when browser is ready</li>
            <li>📱 <strong>Minimal UI:</strong> Full-screen browser content only</li>
            <li>🎯 <strong>Auto-Fallback:</strong> Live stream → Screenshots if needed</li>
            <li>💾 <strong>Auto-Save:</strong> All frames saved for replay</li>
            <li>🎮 <strong>Replay Controls:</strong> Play, pause, seek, speed control</li>
            <li>🔌 <strong>Dynamic Ports:</strong> Each task gets unique Chrome port</li>
        </ul>
        
        <p style="color: #666; font-style: italic; margin-top: 30px;">
            Note: These are test URLs. Real URLs are generated when you start a job application.
        </p>
    </body>
    </html>
    """


@app.route("/api/task-instances")
def get_task_instances():
    """
    Get information about all active Chrome task instances.
    """
    return jsonify(
        {
            "active_tasks": task_chrome_instances,
            "total_tasks": len(task_chrome_instances),
        }
    )


@app.route("/api/task-instances/<task_id>")
def get_task_instance(task_id):
    """
    Get information about a specific Chrome task instance.
    """
    if task_id in task_chrome_instances:
        instance_info = task_chrome_instances[task_id].copy()
        # Don't return the process object in JSON
        if "process" in instance_info:
            del instance_info["process"]
        return jsonify(instance_info)
    else:
        return jsonify({"error": "Task not found"}), 404


@app.route("/api/task-ready/<task_id>")
def check_task_ready(task_id):
    """
    Check if a Chrome browser is ready for the given task.
    """
    # Check if task exists in our instances
    if task_id not in task_chrome_instances:
        return jsonify(
            {
                "ready": False,
                "status": "not_started",
                "message": "Browser is starting up...",
            }
        )

    instance = task_chrome_instances[task_id]
    port = instance.get("port")
    status = instance.get("status", "unknown")

    if status != "running":
        return jsonify(
            {"ready": False, "status": status, "message": "Browser is starting up..."}
        )

    # Check if Chrome DevTools is actually accessible
    try:
        tabs_response = requests.get(f"http://localhost:{port}/json/list", timeout=2)
        if tabs_response.ok:
            tabs = tabs_response.json()
            if tabs:
                return jsonify(
                    {
                        "ready": True,
                        "status": "ready",
                        "message": "Browser is ready",
                        "tabs_count": len(tabs),
                    }
                )
            else:
                return jsonify(
                    {
                        "ready": False,
                        "status": "no_tabs",
                        "message": "Browser starting, no tabs yet...",
                    }
                )
        else:
            return jsonify(
                {
                    "ready": False,
                    "status": "not_accessible",
                    "message": "Browser starting up...",
                }
            )
    except Exception:
        return jsonify(
            {
                "ready": False,
                "status": "connecting",
                "message": "Browser starting up...",
            }
        )


@app.route("/api/task-screenshots/<task_id>")
def get_task_screenshots(task_id):
    """
    Get list of saved screenshots for a task.
    """
    screenshots_dir = os.path.join(os.getcwd(), task_id)

    if not os.path.exists(screenshots_dir):
        return jsonify(
            {
                "screenshots": [],
                "total": 0,
                "message": "No screenshots found for this task",
            }
        )

    try:
        # Get all screenshot files
        screenshot_files = []
        for filename in os.listdir(screenshots_dir):
            if filename.startswith("screenshot_") and filename.endswith(".png"):
                file_path = os.path.join(screenshots_dir, filename)
                file_stat = os.stat(file_path)

                # Extract number from filename
                try:
                    number = int(
                        filename.replace("screenshot_", "").replace(".png", "")
                    )
                except ValueError:
                    number = 0

                screenshot_files.append(
                    {
                        "filename": filename,
                        "number": number,
                        "size": file_stat.st_size,
                        "created": file_stat.st_mtime,
                        "url": f"/api/task-screenshots/{task_id}/{filename}",
                    }
                )

        # Sort by number
        screenshot_files.sort(key=lambda x: x["number"])

        return jsonify(
            {
                "screenshots": screenshot_files,
                "total": len(screenshot_files),
                "task_id": task_id,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e), "screenshots": [], "total": 0}), 500


@app.route("/api/task-screenshots/<task_id>/<filename>")
def get_task_screenshot_file(task_id, filename):
    """
    Serve a specific screenshot file for a task.
    """
    screenshots_dir = os.path.join(os.getcwd(), task_id)
    file_path = os.path.join(screenshots_dir, filename)

    if not os.path.exists(file_path) or not filename.endswith(".png"):
        return jsonify({"error": "Screenshot not found"}), 404

    try:
        return send_file(file_path, mimetype="image/png", as_attachment=False)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/live-stream/<session_id>")
def start_live_stream(session_id):
    """
    Start a live WebSocket stream of browser frames using Chrome DevTools screencast.
    """
    from flask import Response
    import json
    import threading
    import queue
    import websocket

    def generate_frames():
        try:
            # Check if task exists and get port
            if session_id not in task_chrome_instances:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Browser not started yet. Please wait...'})}\n\n"
                return

            instance = task_chrome_instances[session_id]
            cdp_port = instance.get("port")
            status = instance.get("status")

            if status != "running":
                yield f"data: {json.dumps({'type': 'error', 'message': 'Browser is still starting up...'})}\n\n"
                return

            # Get list of tabs
            tabs_response = requests.get(
                f"http://localhost:{cdp_port}/json/list", timeout=5
            )
            if not tabs_response.ok:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Cannot connect to browser on port {cdp_port}'})}\n\n"
                return

            tabs = tabs_response.json()
            if not tabs:
                yield f"data: {json.dumps({'error': 'No browser tabs found'})}\n\n"
                return

            # Find the best tab (job application pages preferred)
            target_tab = None
            for tab in tabs:
                url = tab.get("url", "")
                if any(
                    keyword in url.lower()
                    for keyword in ["job", "application", "career", "apply", "ashby"]
                ):
                    target_tab = tab
                    break

            if not target_tab:
                # Fallback to first non-blank tab
                for tab in tabs:
                    url = tab.get("url", "")
                    if url and not url.startswith("chrome://") and url != "about:blank":
                        target_tab = tab
                        break

            if not target_tab:
                target_tab = tabs[0]

            ws_url = target_tab.get("webSocketDebuggerUrl")
            if not ws_url:
                yield f"data: {json.dumps({'error': 'No WebSocket URL available for browser tab'})}\n\n"
                return

            # Frame counter for saving
            frame_count = 0
            frame_queue = queue.Queue()

            def on_message(ws, message):
                nonlocal frame_count
                try:
                    data = json.loads(message)

                    # Handle response to Page.startScreencast
                    if data.get("id") == 2 and "error" in data:
                        frame_queue.put(
                            {
                                "type": "error",
                                "message": f"Screencast start failed: {data['error']['message']}",
                            }
                        )

                    # Handle screencast frames
                    elif data.get("method") == "Page.screencastFrame":
                        params = data.get("params", {})
                        frame_data = params.get("data")
                        session_id_cdp = params.get("sessionId")

                        if frame_data:
                            frame_count += 1

                            # Save frame to disk for replay
                            screenshots_dir = os.path.join(os.getcwd(), session_id)
                            os.makedirs(screenshots_dir, exist_ok=True)
                            frame_path = os.path.join(
                                screenshots_dir, f"screenshot_{frame_count}.png"
                            )
                            try:
                                image_data = base64.b64decode(frame_data)
                                with open(frame_path, "wb") as f:
                                    f.write(image_data)
                            except Exception:
                                pass  # Ignore save errors, continue streaming

                            # Send frame to client
                            frame_info = {
                                "type": "frame",
                                "data": frame_data,
                                "frame_number": frame_count,
                                "timestamp": time.time(),
                                "metadata": {
                                    "width": params.get("metadata", {}).get(
                                        "screenWidth"
                                    ),
                                    "height": params.get("metadata", {}).get(
                                        "screenHeight"
                                    ),
                                },
                            }
                            frame_queue.put(frame_info)

                            # Acknowledge the frame
                            if session_id_cdp:
                                ack_payload = {
                                    "id": frame_count + 1000,
                                    "method": "Page.screencastFrameAck",
                                    "params": {"sessionId": session_id_cdp},
                                }
                                ws.send(json.dumps(ack_payload))

                except Exception as e:
                    frame_queue.put({"type": "error", "message": str(e)})

            def on_error(ws, error):
                frame_queue.put({"type": "error", "message": str(error)})

            def on_open(ws):
                # Enable Page domain first
                enable_page_payload = {"id": 1, "method": "Page.enable"}
                ws.send(json.dumps(enable_page_payload))

                # Start screencast
                start_screencast_payload = {
                    "id": 2,
                    "method": "Page.startScreencast",
                    "params": {
                        "format": "png",
                        "quality": 80,
                        "maxWidth": 1920,
                        "maxHeight": 1080,
                        "everyNthFrame": 1,  # Send every frame
                    },
                }
                ws.send(json.dumps(start_screencast_payload))

                # Send initial status
                frame_queue.put(
                    {
                        "type": "status",
                        "message": "Live stream started",
                        "tab_url": target_tab.get("url", ""),
                        "tab_title": target_tab.get("title", ""),
                    }
                )

            # Start WebSocket in a separate thread
            ws = websocket.WebSocketApp(
                ws_url, on_message=on_message, on_error=on_error, on_open=on_open
            )

            ws_thread = threading.Thread(target=ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()

            # Stream frames to client
            while True:
                try:
                    # Get frame from queue (blocking with timeout)
                    frame_data = frame_queue.get(timeout=30)  # 30 second timeout
                    yield f"data: {json.dumps(frame_data)}\n\n"

                    if frame_data.get("type") == "error":
                        break

                except queue.Empty:
                    # Send keepalive
                    yield f"data: {json.dumps({'type': 'keepalive', 'timestamp': time.time()})}\n\n"
                except Exception as e:
                    print(f"❌ Error in frame streaming: {e}")
                    break

            # Cleanup
            try:
                # Stop screencast
                stop_payload = {"id": 999, "method": "Page.stopScreencast"}
                ws.send(json.dumps(stop_payload))
                ws.close()
            except:
                pass

        except Exception as e:
            print(f"❌ Live stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return Response(
        generate_frames(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
        },
    )


@app.route("/api/screenshot/<session_id>")
def get_screenshot(session_id):
    """
    Take a single screenshot of the Chrome browser (fallback method).
    """
    try:
        # Get the port for this specific task
        cdp_port = None
        if session_id in task_chrome_instances:
            cdp_port = task_chrome_instances[session_id]["port"]
        else:
            # Fallback to standard port
            cdp_port = 9222

        # Get list of tabs/pages
        tabs_response = requests.get(
            f"http://localhost:{cdp_port}/json/list", timeout=5
        )
        if not tabs_response.ok:
            return jsonify(
                {
                    "error": f"Failed to connect to Chrome DevTools on port {cdp_port}. Make sure Chrome is running with --remote-debugging-port=9222"
                }
            ), 500

        tabs = tabs_response.json()
        if not tabs:
            return jsonify(
                {
                    "error": "No browser tabs found. The browser session may not have started yet."
                }
            ), 404

        # Find the most relevant tab (prefer job application pages)
        target_tab = None
        for tab in tabs:
            url = tab.get("url", "")
            title = tab.get("title", "")
            # Prefer job application pages
            if url and (
                "job" in url.lower()
                or "application" in url.lower()
                or "ashby" in url.lower()
            ):
                target_tab = tab
                break

        # If no job pages found, skip chrome:// and about: pages
        if not target_tab:
            for tab in tabs:
                url = tab.get("url", "")
                if (
                    url
                    and not url.startswith("about:")
                    and not url.startswith("chrome://")
                ):
                    target_tab = tab
                    break

        # If still no suitable tab, use the first available tab
        if not target_tab and tabs:
            target_tab = tabs[0]

        if not target_tab:
            return jsonify({"error": "No suitable browser tab found"}), 404

        # Use Chrome DevTools REST API to take screenshot
        tab_id = target_tab["id"]
        screenshot_url = f"http://localhost:{cdp_port}/json/runtime/evaluate"

        # JavaScript to take screenshot via DevTools
        js_code = """
        new Promise((resolve) => {
            chrome.debugger.sendCommand({tabId: arguments[0]}, "Page.captureScreenshot", {
                format: "png",
                quality: 80,
                fromSurface: true
            }, (result) => {
                resolve(result ? result.data : null);
            });
        })
        """

        # Alternative: Direct CDP call
        screenshot_response = requests.post(
            screenshot_url,
            json={
                "expression": f"""
                (async () => {{
                    const response = await fetch('http://localhost:{cdp_port}/json/runtime/evaluate', {{
                        method: 'POST',
                        headers: {{'Content-Type': 'application/json'}},
                        body: JSON.stringify({{
                            expression: "document.documentElement.scrollHeight",
                            contextId: 1
                        }})
                    }});
                    return 'ready';
                }})()
                """
            },
            timeout=10,
        )

        # Simple approach: Use WebSocket for screenshot
        try:
            import websocket
            import threading

            ws_url = target_tab.get("webSocketDebuggerUrl")
            if not ws_url:
                return jsonify(
                    {"error": "WebSocket URL not available for the selected tab"}
                ), 500

            screenshot_data = None
            screenshot_error = None
            screenshot_done = threading.Event()

            def on_message(ws, message):
                nonlocal screenshot_data, screenshot_error
                try:
                    data = json.loads(message)
                    if data.get("id") == 123 and "result" in data:
                        if "data" in data["result"]:
                            screenshot_data = data["result"]["data"]
                            screenshot_done.set()
                        else:
                            screenshot_error = "No screenshot data in response"
                            screenshot_done.set()
                    elif data.get("id") == 123 and "error" in data:
                        screenshot_error = data["error"]["message"]
                        screenshot_done.set()
                except Exception as e:
                    screenshot_error = str(e)
                    screenshot_done.set()

            def on_error(ws, error):
                nonlocal screenshot_error
                screenshot_error = str(error)
                screenshot_done.set()

            def on_open(ws):
                # Send screenshot command with unique ID
                screenshot_cmd = {
                    "id": 123,
                    "method": "Page.captureScreenshot",
                    "params": {"format": "png", "quality": 80},
                }
                ws.send(json.dumps(screenshot_cmd))

            # Create WebSocket connection
            ws = websocket.WebSocketApp(
                ws_url, on_message=on_message, on_error=on_error, on_open=on_open
            )

            # Run WebSocket in a thread
            ws_thread = threading.Thread(target=ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()

            # Wait for screenshot (with timeout)
            if screenshot_done.wait(timeout=10):
                ws.close()
                if screenshot_error:
                    logging.error(f"Screenshot WebSocket error: {screenshot_error}")
                    return jsonify(
                        {"error": f"Screenshot failed: {screenshot_error}"}
                    ), 500
                if not screenshot_data:
                    return jsonify({"error": "No screenshot data received"}), 500

                # Decode base64 image data
                image_data = base64.b64decode(screenshot_data)

                # Create image response
                return send_file(
                    io.BytesIO(image_data), mimetype="image/png", as_attachment=False
                )
            else:
                ws.close()
                return jsonify(
                    {"error": "Screenshot timeout - browser may not be responding"}
                ), 500

        except ImportError:
            return jsonify(
                {
                    "error": "WebSocket library not available. Install websocket-client: pip install websocket-client"
                }
            ), 500
        except Exception as e:
            logging.error(f"Screenshot WebSocket exception: {str(e)}")
            return jsonify({"error": f"Screenshot error: {str(e)}"}), 500

    except requests.RequestException as e:
        logging.error(f"Screenshot endpoint - Request error: {str(e)}")
        return jsonify({"error": f"Failed to connect to Chrome: {str(e)}"}), 500
    except Exception as e:
        logging.error(f"Screenshot endpoint - Unexpected error: {str(e)}")
        import traceback

        logging.error(f"Screenshot endpoint - Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


@app.route("/apply-job", methods=["POST"])
def apply_job():
    try:
        # Get data from POST request
        data = request.get_json()

        # Validate required fields
        required_fields = ["job_url", "resume_url", "instructions", "profile"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        link = data["job_url"]
        additional_information = data.get("instructions", "")
        headless = data.get("headless", False)
        max_steps = data.get("max_steps", 100)
        resume_url = data.get("resume_url", "")
        profile = data.get("profile", "")

        # Using local browser automation - no external services required

        # Create task ID for tracking
        task_id = str(uuid.uuid4())
        cdp_url = "http://localhost:9222"

        # Store session info for tracking
        active_sessions[task_id] = {
            "cdp_url": cdp_url,
            "status": "starting",
            "created_at": threading.current_thread().ident,
        }

        # Start the agent task in the background using thread executor
        def run_async_task():
            try:
                asyncio.run(
                    run_agent_background(
                        task_id,
                        cdp_url,
                        link,
                        additional_information,
                        headless,
                        max_steps,
                        resume_url,
                        profile,
                    )
                )
            except Exception as e:
                logging.error(f"Background task {task_id} failed: {str(e)}")
                task_results[task_id] = {
                    "status": "failed",
                    "message": "Job application failed",
                    "result": None,
                    "error": str(e),
                }
                # Update session status
                if task_id in active_sessions:
                    active_sessions[task_id]["status"] = "failed"

        thread = threading.Thread(target=run_async_task, daemon=True)
        thread.start()

        # Create the local screencast URL
        # Generate live stream and screencast URLs
        live_stream_url = f"http://localhost:3001/live-stream/{task_id}"
        screencast_url = f"http://localhost:3001/screencast/{task_id}"
        replay_url = f"http://localhost:3001/replay/{task_id}"

        # Return task ID and live stream URL immediately for client to track progress
        return jsonify(
            {
                "task_id": task_id,
                "live_url": live_stream_url,  # Primary: Real-time live stream
                "fallback_url": screencast_url,  # Fallback: Screenshot-based
                "replay_url": replay_url,  # Replay: View saved screenshots
                "status": "started",
                "message": "Job application process started in background. Use the live_url for real-time streaming, fallback_url for screenshots, or replay_url to view saved screenshots.",
            }
        )

    except Exception as e:
        logging.error(f"Error processing job application: {str(e)}")
        return jsonify({"error": str(e)}), 500


# Global dictionary to store task results
task_results = {}


async def run_agent_background(
    task_id: str,
    cdp_url: str,
    link: str,
    additional_information: str,
    headless: bool,
    max_steps: int,
    resume_url: str,
    profile: str,
):
    """
    Run the agent in the background and store results.
    """
    try:
        # Update task status
        task_results[task_id] = {
            "status": "running",
            "message": "Agent is processing the job application...",
            "result": None,
            "error": None,
        }

        # Run the agent
        result = await run_agent(
            task_id,
            cdp_url,
            link,
            additional_information,
            headless,
            max_steps,
            resume_url,
            profile,
        )

        # Update task status with result
        task_results[task_id] = {
            "status": "completed",
            "message": "Job application completed successfully",
            "result": result,
            "error": None,
        }

    except Exception as e:
        # Update task status with error
        task_results[task_id] = {
            "status": "failed",
            "message": "Job application failed",
            "result": None,
            "error": str(e),
        }
        logging.error(f"Background task {task_id} failed: {str(e)}")


async def run_agent(
    task_id,
    cdp_url,
    link,
    additional_information,
    headless,
    max_steps,
    resume_url,
    profile,
):
    print(
        f"Running agent with task_id: {task_id}, link: {link}, additional_information: {additional_information}, headless: {headless}, max_steps: {max_steps}"
    )

    try:
        # Start Chrome with task-specific tracking
        process, port = await start_chrome_with_debug_port(task_id=task_id)
        actual_cdp_url = f"http://localhost:{port}"

        # Step 2: Connect Playwright to the same Chrome instance
        await connect_playwright_to_cdp(actual_cdp_url)

        # Step 3: Create Browser-Use session connected to same Chrome
        # Note: BrowserSession will use the same Chrome instance via CDP
        browser_session = BrowserSession(cdp_url=actual_cdp_url, headless=False)

        # Apply stealth to all contexts after BrowserSession is created
        # This ensures browser-use's contexts also have stealth applied
        if playwright_browser:
            stealth = Stealth()
            # Wait a moment for BrowserSession to create its context
            await asyncio.sleep(0.5)

            # Apply stealth to all contexts (including any BrowserSession created)
            if playwright_browser.contexts:
                for context in playwright_browser.contexts:
                    try:
                        await stealth.apply_stealth_async(context)
                        print(f"✅ Applied stealth to context for browser-use")
                    except Exception as e:
                        print(f"⚠️  Failed to apply stealth to context: {e}")

        # Download resume file if URL is provided - REQUIRED, fail if can't download
        local_resume_path = None
        if resume_url and resume_url.strip():
            try:
                local_resume_path = download_resume(resume_url)
                print(f"✅ Resume downloaded successfully to: {local_resume_path}")
            except Exception as e:
                error_msg = f"❌ Failed to download resume from {resume_url}: {str(e)}"
                print(error_msg)
                logging.error(error_msg)
                # Update task status with error
                task_results[task_id] = {
                    "status": "failed",
                    "message": "Resume download failed",
                    "result": None,
                    "error": str(e),
                }
                # Clean up Chrome instance
                if task_id in task_chrome_instances:
                    instance = task_chrome_instances[task_id]
                    process = instance.get("process")
                    if process:
                        try:
                            process.terminate()
                            import time

                            time.sleep(1)
                            if process.poll() is None:
                                process.kill()
                        except Exception:
                            pass
                    del task_chrome_instances[task_id]
                # Re-raise to stop execution
                raise RuntimeError(f"Resume download failed: {str(e)}")
        else:
            error_msg = "❌ Resume URL is required but not provided"
            print(error_msg)
            logging.error(error_msg)
            task_results[task_id] = {
                "status": "failed",
                "message": "Resume URL not provided",
                "result": None,
                "error": "Resume URL is required",
            }
            raise ValueError("Resume URL is required")

        # Create the agent task with resume path if available
        task_text = f"Please go to {link} and complete the application process using this information. Here are the infos about the user: \n{profile} \nAdditional information: {additional_information}"
        if local_resume_path:
            task_text += f" If you need to upload a resume file, use the file at: {local_resume_path}. Only upload the resume file when it is a required field. Use the 'playwright_file_upload' action to upload the resume file."
        else:
            task_text += " Note: No resume file is available for upload."
        task_text += " Don't use the autofill resume feature."

        task_text += " If an answer is not available, please infer it if it is a required field otherwise skip it."

        agent = Agent(
            task=task_text,
            llm=ChatOpenAI(model="gpt-5-mini"),
            browser_session=browser_session,
            tools=tools,
        )

        result = await agent.run()

        # Clean up downloaded resume file
        if local_resume_path:
            cleanup_resume(local_resume_path)

        return {"result": str(result)}

    except Exception as e:
        logging.error(f"Error in run_agent: {str(e)}")
        # Clean up downloaded resume file in case of error
        if "local_resume_path" in locals() and local_resume_path:
            cleanup_resume(local_resume_path)
        return {"error": str(e)}


@app.route("/task-status/<task_id>", methods=["GET"])
def get_task_status(task_id):
    """
    Get the status of a background task.
    """
    try:
        if task_id not in task_results:
            return jsonify({"error": "Task not found"}), 404

        return jsonify(task_results[task_id])

    except Exception as e:
        logging.error(f"Error getting task status: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/stop-task/<task_id>", methods=["POST"])
def stop_task(task_id):
    """
    Stop a running browser automation task.
    """
    try:
        # Check if task exists
        if task_id not in task_results:
            return jsonify({"error": "Task not found"}), 404

        # Update task status to stopped
        if task_id in task_results:
            task_results[task_id]["status"] = "stopped"
            task_results[task_id]["message"] = "Task stopped by user"

        # Stop Chrome instance if running
        if task_id in task_chrome_instances:
            instance = task_chrome_instances[task_id]
            process = instance.get("process")

            if process:
                try:
                    # Terminate the Chrome process
                    process.terminate()
                    # Wait a bit for graceful shutdown
                    import time

                    time.sleep(2)
                    # Force kill if still running
                    if process.poll() is None:
                        process.kill()
                    print(f"✅ Stopped Chrome process for task {task_id}")
                except Exception as e:
                    print(f"⚠️  Error stopping Chrome process: {e}")

            # Clean up the instance
            del task_chrome_instances[task_id]
            print(f"✅ Cleaned up Chrome instance for task {task_id}")

        return jsonify(
            {
                "success": True,
                "message": "Task stopped successfully",
                "task_id": task_id,
            }
        )

    except Exception as e:
        logging.error(f"Error stopping task: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=3001)
