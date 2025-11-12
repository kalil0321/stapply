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
