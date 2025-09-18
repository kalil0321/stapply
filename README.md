# 🚀 Stapply – AI Job Search Engine

---

Stapply is an **AI-powered job search engine**.  
It helps you find roles that truly match your criteria, and with **Browser Use** it can even apply to them automatically.

---

## 🔎 Search Pipeline

The idea came from the fact that LinkedIn job search is often poor and many listings don’t match. I built an AI-first search pipeline. We crawl and index jobs, store them alongside their embeddings in a database, then when the user queries we create both a SQL request and an embedding request. Results are reranked and finally validated by AI to make sure they fully match the user’s criteria.  

You can also search for live jobs using Browser Use, which finds fresh listings in real time. Another option is to import a job URL, in which case we extract the job details and allow you to apply directly.

---

## 📄 Job Application

The job application part is fully powered by an AI agent. It autofills forms, attaches your résumé, and guides you through extra steps. Currently, file upload support is not fully reliable, but I believe this will improve soon. There is the cloud and local versions. For the cloud you need to have a BROWSER_USE_API_KEY. For the local version, you just need to run the server that handles the browser locally.

---

## 🐛 Issues & TODOs

Current issues and bugs are listed in **ISSUES.md**.  
Since this was a hackathon project, it is not production ready yet. I plan to improve the project and deploy it.

---

## ⚙️ Setup

Create a `.env` file using `env.example` as a template.  

Run the local Browser Use server:

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
python3 bu.py
```

In a new terminal, start the frontend:
```bash
npm install
npm run dev
```
The app will be available at http://localhost:3000.

Ready to hunt!