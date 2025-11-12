<p align="center">
  <picture>
    <source srcset="assets/stapply.svg" media="(prefers-color-scheme: light)">
    <source srcset="assets/stapply_black.svg" media="(prefers-color-scheme: dark)">
    <img src="assets/stapply.svg" alt="Stapply logo">
  </picture>
</p>

# Stapply, a job search engine that goes beyond search

Stapply is not another job board. It helps find the best jobs and applies on your behalf.

[Demo video](https://drive.google.com/file/d/1xxb7QsQi35GL3bK3BJhIsxCJNash39K5/view?usp=sharing)

![Stapply Demo](assets/demo.gif)
---

## Features:

- Job search with validation
- Auto-apply to job using agent

## Job data

Get access to a dataset of thousands of jobs [here](https://storage.stapply.ai/jobs.csv)(https://storage.stapply.ai/jobs.csv).

## Cloud version

I plan to have a cloud version, [join the waitlist](https://stapply.ai/waitlist)

## Why Stapply?
---

I built Stapply for a [browser-use hackathon](https://github.com/browser-use/nicehack69)

## 🔎 Search Pipeline

The idea came from the fact that LinkedIn job search is often poor and many listings don’t match. I built an AI-first search pipeline. We crawl and index jobs, store them alongside their embeddings in a database, then when the user queries we create both a SQL request and an embedding request. Results are reranked and finally validated by AI to make sure they fully match the user’s criteria.  

Currently, the pipeline is not as accurate as I would like it to be, it depends on the amount of available data. If you have any insights on how to improve it, please feel free to contribute or teach me!

---

## 📄 Job Application

The job application part is fully powered by an AI agent. It autofills forms, attaches your résumé, and guides you through extra steps. I decided to make sure the agent is very reliable. You should use the agent at https://github.com/stapply-ai/agent. 

---

## Roadmap

- Interview prep
- ATS checker
- Curated list of european internships
- "For me" jobs (receive personalized jobs, as good as TT for you's)
