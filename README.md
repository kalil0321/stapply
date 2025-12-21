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

Get access to a dataset of thousands of jobs [here](https://storage.stapply.ai/jobs.csv)(https://storage.stapply.ai/jobs.csv).

## Cloud version

I plan to have a cloud version, [join the waitlist](https://stapply.ai/waitlist)

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