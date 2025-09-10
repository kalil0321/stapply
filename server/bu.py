import asyncio
from flask import Flask, request, jsonify
from browser_use import Agent, ChatOpenAI, Browser
import logging
from pathlib import Path

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route('/apply-job', methods=['POST'])
def apply_job():
    try:
        # Get data from POST request
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['link', 'resume_url']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        link = data['link']
        additional_information = data.get('additional_information', '')
        headless = data.get('headless', False)
        max_steps = data.get('max_steps', 100)
        resume_url = data.get('resume_url', '')
        # Run the agent asynchronously
        result = asyncio.run(run_agent(link, additional_information, headless, max_steps, resume_url))
        
        # Extract parsed history
        return jsonify(result)




        
    except Exception as e:
        logging.error(f"Error processing job application: {str(e)}")
        return jsonify({'error': str(e)}), 500

async def run_agent(link, additional_information, headless, max_steps, resume_url):
    print(f"Running agent with link: {link}, additional_information: {additional_information}, headless: {headless}, max_steps: {max_steps}")           
    # Connect to your existing Chrome browser
    browser = Browser(
        headless=False,
        highlight_elements=True,
        keep_alive=True,
    )

    from browser_use import Tools

    tools = Tools()
    @tools.action(description='Upload the resume file, use this tool when the application prompts you to upload the resume file')
    def upload_resume(file_system, available_file_paths: list[str]) -> str:
        user_input = input("Did you upload the resume file? (y/n)")
        if user_input == "y":
            return "Resume uploaded"
        elif user_input == "n":
            return "Resume not uploaded"
    
    agent = Agent(
        task=f"Please go to {link} and complete the application process using this information. Here are the infos about the user: "
        f"Name: Kalil Sama Bouzigues "
        f"Email: kalil.bouzigues@gmail.com "
        f"Phone: +410782300494 Location: Lausanne, Switzerland "
        f"Nationality: Switzerland"
        f"Gender: male "
        f"GitHub: https://github.com/kalil0321 "
        f"Summary: Experienced software engineer and technical maintainer with expertise in Python, Jupyter Notebooks, automation, and collaborative tools. Currently pursuing a dual Master's degree in Computer Science and Cybersecurity at ETH Zürich and EPFL. Winner of multiple hackathons focused on AI, VR, and software innovation. Skills: Python, Jupyter Notebooks, Automation, Version Control, Software Development, Leadership, Innovation, Hackathons, AI, VR, Code Interpreter, LoRa, MoE "
        f"Additional information: {additional_information}"
        f"Please navigate to the job posting and complete the application process using this information."
        # f"The resume file is at {resume_url}, download it and upload it when prompted."
        f"Also, don't use the autofill resume feature. Only upload the resume file when it is a required field.",
        llm=ChatOpenAI(model="gpt-4.1-mini"),
        browser=browser,
        tools=tools,
    )
    
    history = await agent.run(max_steps=max_steps)

    return {
        'history': str(history)
    }

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=3001)