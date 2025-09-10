# 🚀 Stapply - AI job search engine

kalil0321: on discord, x and github
my website: kalil0321.com

Stapply is an AI job search engine. It helps you find jobs matching all your criteria and then using Browser Use allows you to apply to it.

## Search Pipeline

The idea was that sometimes linkedin job search is quite poor many listing don't suit. I built an AI first search pipeline. We crawl and index jobs and store them alongsite thsir embedding in a DB. Then when user queries we create a classic SQL request, and another embedding request and rerank then we use AI to validate all queries to make sure it fully matches user critierias. 
YOu can also search for live job using Browser Use, it goes and find fresh job listings.
You also improt an url and we get the job data to then allow you to apply to it.

## Job application

The job application part fully relies on AI agent. Currently, it is not fully performant due to file upload issues but i believe it will get better soon. 
#TODO: tell more about the AI search.

## Issues

You can find a few current issues / bugs at ISSUES.md

As this was a project for a hackathon i think it is not yet production ready, there is a list of todos.

To run locally, just add all the env keys and don't forget to run the local BU server in server folder.

## Setup:

Create .env file with env.example
`cd server & python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && ython3 bu.py`
In a new terminal, `npm i && npm run dev`, then access the app at localhost:3000.