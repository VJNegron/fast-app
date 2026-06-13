# F.A.S.T. — Setup & Deployment Guide

**Built by Vicron A.I. Consulting — Bridging the Gap**

---

## What This Is

F.A.S.T. (Financial Advisory Steward Technology) is a private web app that lives on a server only Matt can access. It reads client PDFs and returns model portfolio recommendations in Matt's voice, using Matt's logic. The Anthropic API key stays on the server — clients never see it.

---

## Local Setup (Dev / Testing)

### 1. Prerequisites
- Node.js 18 or later ([nodejs.org](https://nodejs.org))
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### 2. Clone and install
```bash
git clone <your-repo-url> fast-app
cd fast-app
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```

Edit `.env` and fill in:
```
ANTHROPIC_API_KEY=sk-ant-...
FAST_PASSWORD=choose-a-strong-password
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

### 4. Run in development
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the React dev server proxies API calls to Express on port 3001.

---

## Production Deployment (Recommended: Railway)

Railway is the easiest one-click deploy. Free tier works for Matt's usage level.

### Steps

1. Push the repo to GitHub (make sure `.env` is in `.gitignore` — it already is)
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the repo
4. In Railway's **Variables** tab, add all values from your `.env`:
   - `ANTHROPIC_API_KEY`
   - `FAST_PASSWORD`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `CLAUDE_MODEL=claude-sonnet-4-6`
5. Railway auto-detects the start command (`npm start`) and builds with `npm run build`
6. Done — Railway gives you a URL like `fast-app-production.up.railway.app`

**Custom domain:** In Railway → Settings → Domains, add Matt's domain (e.g., `fast.stewardshipfinancial.com`) and point DNS there.

### Alternative: Render

Same process — Render.com → New Web Service → connect GitHub repo → add env vars → deploy.

---

## How Matt Uses It

1. Go to the app URL, enter the password
2. **First-time only:** Go to "The Advisor Brain" → fill in preferences and models A–E → Save
3. Go to "New Client Analysis" → drop in a client PDF → (optional) add notes → Generate
4. Review the recommendation on the output screen
5. Copy to clipboard or Export PDF for notes

---

## Updating the AI Model

When Anthropic releases a newer Claude model:
1. Update the `CLAUDE_MODEL` environment variable in Railway/Render
2. No code changes needed

---

## File Structure

```
fast-app/
├── server.js               Express backend (API proxy + auth)
├── vite.config.js          Vite build config (proxies /api in dev)
├── index.html              HTML shell (loads Google Fonts)
├── src/
│   ├── main.jsx            React entry point
│   ├── App.jsx             Auth gate (Login vs. Shell)
│   ├── components/
│   │   ├── Login.jsx       Password screen
│   │   └── Shell.jsx       Nav + layout (mobile-responsive)
│   ├── views/
│   │   ├── BrainView.jsx   Advisor Brain setup screen
│   │   ├── AnalyzeView.jsx PDF upload + generate screen
│   │   └── OutputView.jsx  Recommendation display + export
│   └── lib/
│       ├── storage.js      localStorage (brain + auth token)
│       ├── api.js          Backend API calls (prompt assembly)
│       └── pdfExport.js    Branded jsPDF export (navy/gold)
└── dist/                   Built output (npm run build)
```

---

## Security Notes

- The Anthropic API key lives only in the server environment — never in the browser
- Login tokens expire after 7 days (JWT); Matt re-enters password after that
- Client PDFs are processed in memory and never stored anywhere
- The Advisor Brain (preferences + models) is saved to Matt's browser's localStorage — it persists on his machine

---

## v2 Notes (Licensing Layer)

The architecture is single-user for Matt today. To license F.A.S.T. to other advisors in a future v2:
- Add a users table (Supabase works well) with `{ advisor_id, license_type: "series6|7|6566" }`
- Add license-type to the JWT payload
- Constrain the AI prompt server-side based on license type (e.g., Series 6 → mutual funds only, no individual securities)
- Add per-advisor brain storage keyed by `advisor_id`

This is the v2 product play — the current architecture doesn't block it.

---

*Built by Vicron A.I. Consulting | victorj0777@gmail.com | Bridging the Gap*
