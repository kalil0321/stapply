- Cloud SDK docs would be nice
- Cloud platform request a feature / issues repo
- Cloud platform custom tools & custom playwright tools (agent struggle with select + dropwdown and file inputs)
- Workflow-use available on the cloud platform
- Cloud platform when we click refresh it doesnt seem to work we need to fully refresh the page 
- Broken API reference link at https://docs.cloud.browser-use.com/get-started/quickstart is broken in docs (localhost:3001)
- Views count? It would be better if we use fingerprinting to count views?
- Attached files in response, error: "are available in the attached file" but the agent didnt provide the file
- Locally too we cannot upload file: 
```
INFO     [Agent]   🦾 [ACTION 1/2] upload_file_to_element: index: 18, path: /Users/kalilbouzigues/Projects/bu-n69h/server/resume.pdf
ERROR    [cdp_use.client] CDP Error for request 161: {'code': -32001, 'message': 'Session with given id not found.'}
ERROR    [BrowserSession] 🚌 [DefaultActionWatchdog.on_UploadFileEvent(#ddf2)]      ❌ Failed (0.00s): RuntimeError: {'code': -32001, 'message': 'Session with given id not found.'}
ERROR    [bubus] ❌ EventBus_b020182f🟢(⏳ 0 | ▶️ 0 | ✅ 50 ➡️ 30 👂) Error in event handler browser_use.browser.watchdog_base.DefaultActionWatchdog.on_UploadFileEvent(?▶ UploadFileEvent#ddf2 ✅) -> 
RuntimeError({'code': -32001, 'message': 'Session with given id not found.'})
RuntimeError: {'code': -32001, 'message': 'Session with given id not found.'}
```
- (CLOUD) Schema: structured output led to many pydantic errors
- highlight elements doesnt work locally
- inside iframes it doesnt always work
- issues with select+dropdown --> use Playwright
