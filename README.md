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

## Local setup (Postgres)

This project uses a local Postgres database via Docker. Start it and apply the schema:

```bash
docker compose up -d
npx drizzle-kit push
```

Set `DATABASE_URL` in `.env` (see `env.example`).

## Job data

Get access to a dataset of thousands of jobs at https://map.stapply.ai/ai.csv or https://github/kalil0321/ats-scrapers.

## Why Stapply?
---

I built Stapply for a [browser-use hackathon](https://github.com/browser-use/nicehack69) and finished 2nd place :)

## How to run

```bash
npm i
npm run dev

# In another terminal
cd server
source .venv/bin/activate
pip install -r requirements.txt
python bu.py
```

## How to use

- Load the /jobs page
- Save jobs you're intersterd by (click the bookmark icon)
- Go to profile and fill profile & upload resume
- Go to saved jobs page
- Apply to the jobs
- Go to applications and click applications to see the agent applying live
