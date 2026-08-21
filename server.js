// ─── F.A.S.T. Server ──────────────────────────────────────────────────────────
// Express backend: serves the built React app + provides secure API proxy
// so the Anthropic API key never touches the client.

import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const FAST_USERNAME = process.env.FAST_USERNAME;
const FAST_PASSWORD = process.env.FAST_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = (process.env.CLAUDE_MODEL || "claude-sonnet-4-6").trim();
const IS_PROD = process.env.NODE_ENV === "production";
const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB

// Brain persistence — JSON file store. On Railway, attach a volume and set
// DATA_DIR to its mount path so the brain survives redeploys.
const DATA_DIR = process.env.DATA_DIR || join(__dirname, "data");
const BRAIN_FILE = join(DATA_DIR, "brain.json");

// Startup validation
if (!FAST_PASSWORD) throw new Error("FAST_PASSWORD is not set in .env");
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");
if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set in .env");

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ── Express setup ────────────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: IS_PROD
      ? (process.env.CLIENT_ORIGIN || true) // allow same-origin in prod
      : "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));

// ── Auth middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Session expired — please log in again." });
  }
}

// ── Rate limiting ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});

// ── Routes ───────────────────────────────────────────────────────────────────

// Login
app.post("/api/auth/login", loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const usernameMatch = !FAST_USERNAME || username === FAST_USERNAME;
  if (!password || password !== FAST_PASSWORD || !usernameMatch) {
    return setTimeout(() => res.status(401).json({ error: "Incorrect username or password." }), 300);
  }
  const token = jwt.sign({ role: "advisor" }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// Analyze — the core engine
app.post("/api/analyze", requireAuth, async (req, res) => {
  const { pdfBase64, pdfs, prompt } = req.body || {};
  const documents = Array.isArray(pdfs) && pdfs.length
    ? pdfs
    : pdfBase64
    ? [{ name: "Client document", pdfBase64 }]
    : [];

  if (!documents.length || !prompt) {
    return res.status(400).json({ error: "Missing PDF or prompt." });
  }

  const totalBytes = documents.reduce((sum, doc) => sum + Math.floor(((doc.pdfBase64 || "").length * 3) / 4), 0);
  if (totalBytes > MAX_PDF_BYTES) {
    return res.status(400).json({
      error: `These PDFs total ${(totalBytes / 1024 / 1024).toFixed(1)} MB — over the 25 MB limit. Try fewer/smaller documents.`,
    });
  }

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2500, // v2: increased from 1500 to support annuityRecommendation block
      messages: [
        {
          role: "user",
          content: [
            ...documents.flatMap((doc, i) => [
              { type: "text", text: `Document ${i + 1}: ${doc.name || "Uploaded PDF"}` },
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: doc.pdfBase64,
                },
              },
            ]),
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const rawText = (message.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    // Strip markdown fences defensively
    const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed. Raw response:\n", rawText);
      return res.status(422).json({
        error:
          "The AI returned an unexpected response format. This sometimes happens with complex or scanned PDFs. Try again, or add notes to help the engine understand the document.",
      });
    }

    res.json(parsed);
  } catch (err) {
    const status = err?.status;
    console.error("Anthropic API error:", status, err?.message);

    if (status === 401) {
      return res.status(500).json({
        error: "API key rejected — check that ANTHROPIC_API_KEY is set correctly in Railway environment variables.",
      });
    }

    if (status === 429) {
      return res.status(429).json({
        error: "Rate limit hit — too many requests in a short window. Wait a moment and try again.",
      });
    }

    if (status === 413 || err?.message?.includes("too large")) {
      return res.status(400).json({
        error: "The PDF is too large for the AI to process. Try a smaller document.",
      });
    }

    if (status === 408 || err?.message?.toLowerCase().includes("timeout")) {
      return res.status(408).json({
        error: "Analysis timed out — the document may be very large or complex. Try again or upload a shorter version.",
      });
    }

    if (status === 529 || err?.message?.includes("overloaded")) {
      return res.status(503).json({
        error: "The AI service is momentarily busy. Wait 30 seconds and try again.",
      });
    }

    // Fallback — log status so Railway logs show the real cause
    res.status(500).json({
      error: `Analysis failed (${status || "unknown error"}). Check Railway logs for details.`,
    });
  }
});

// Follow-up chat — asks questions about an existing recommendation without new PDFs
app.post("/api/ask", requireAuth, async (req, res) => {
  const { question, result, brain } = req.body || {};
  if (!question?.trim() || !result) {
    return res.status(400).json({ error: "Missing question or recommendation context." });
  }

  const prompt = `You are F.A.S.T., a concise follow-up assistant for ${brain?.advisorName || "the advisor"}${brain?.firm ? " of " + brain.firm : ""}.
Answer the advisor's question using ONLY this recommendation context and the stored Advisor Brain preferences. Be practical, plain-English, and meeting-ready. If the answer depends on current rates, compliance, suitability, or missing client facts, say so.

ADVISOR BRAIN SUMMARY:
${brain?.preferences || "No preferences provided."}

CURRENT RECOMMENDATION JSON:
${JSON.stringify(result, null, 2)}

ADVISOR QUESTION:
${question.trim()}`;

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    });
    const answer = (message.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    res.json({ answer });
  } catch (err) {
    console.error("Anthropic API error (ask):", err?.status, err?.message);
    res.status(500).json({ error: "Follow-up failed. Try again in a moment." });
  }
});

// ── Advisor Brain persistence ────────────────────────────────────────────────
// Server-side store so the brain follows the advisor across browsers/devices.
// Client keeps a localStorage cache; server is the source of truth.

app.get("/api/brain", requireAuth, (_req, res) => {
  if (!existsSync(BRAIN_FILE)) return res.json({ brain: null });
  try {
    const brain = JSON.parse(readFileSync(BRAIN_FILE, "utf8"));
    res.json({ brain });
  } catch (err) {
    console.error("Brain read failed:", err?.message);
    res.status(500).json({ error: "Could not read the stored Advisor Brain." });
  }
});

app.put("/api/brain", requireAuth, (req, res) => {
  const { brain } = req.body || {};
  if (!brain || typeof brain !== "object" || Array.isArray(brain)) {
    return res.status(400).json({ error: "Missing brain payload." });
  }
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    // Atomic write: temp file + rename so a crash can't corrupt the brain
    const tmp = join(DATA_DIR, `.brain-${Date.now()}.tmp`);
    writeFileSync(tmp, JSON.stringify(brain));
    renameSync(tmp, BRAIN_FILE);
    res.json({ status: "saved" });
  } catch (err) {
    console.error("Brain save failed:", err?.message);
    res.status(500).json({ error: "Could not save the Advisor Brain on the server." });
  }
});

// ── Weekly rate sheet parser ─────────────────────────────────────────────────
// Matt uploads the NYL rate PDF; Claude extracts the strategy table as JSON.
app.post("/api/parse-rates", requireAuth, async (req, res) => {
  const { pdfBase64 } = req.body || {};
  if (!pdfBase64) {
    return res.status(400).json({ error: "Missing PDF." });
  }

  const estimatedBytes = Math.floor((pdfBase64.length * 3) / 4);
  if (estimatedBytes > MAX_PDF_BYTES) {
    return res.status(400).json({ error: "That rate sheet is over 25 MB — send a smaller export." });
  }

  const prompt = `You are a data extraction engine for a financial advisory tool. The attached PDF is a weekly annuity rate sheet (e.g., NYL IndexFlex cap/flat rates, standard and enhanced).

Extract every crediting strategy and its current rates. Respond ONLY with valid JSON, no markdown fences, no preamble, in exactly this structure:
{
  "product": "product name from the document, or null",
  "lastUpdated": "the effective/as-of date shown on the document, e.g. 'August 2026' — or null if not shown",
  "strategies": [
    { "name": "strategy name, e.g. 'S&P 500 Cap'", "standard": "standard rate with % sign, e.g. '8.50%'", "enhanced": "enhanced rate with % sign, or empty string if the strategy has none" }
  ]
}
Rules:
- Include every indexed strategy AND any fixed account.
- Keep rates exactly as printed, including the % sign.
- If a strategy shows only one rate, put it in "standard" and leave "enhanced" as an empty string.
- If you cannot find any rate table in the document, respond with {"error": "no rate table found"} instead.`;

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const rawText = (message.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Rate parse failed. Raw response:\n", rawText);
      return res.status(422).json({
        error: "Couldn't read a rate table from that PDF. You can still update the rates manually below.",
      });
    }

    if (parsed.error || !Array.isArray(parsed.strategies) || parsed.strategies.length === 0) {
      return res.status(422).json({
        error: "No rate table found in that PDF. Check it's the weekly rate sheet — or update the rates manually below.",
      });
    }

    res.json(parsed);
  } catch (err) {
    const status = err?.status;
    console.error("Anthropic API error (parse-rates):", status, err?.message);
    if (status === 429) {
      return res.status(429).json({ error: "Rate limit hit — wait a moment and try again." });
    }
    if (status === 529 || err?.message?.includes("overloaded")) {
      return res.status(503).json({ error: "The AI service is momentarily busy. Wait 30 seconds and try again." });
    }
    res.status(500).json({ error: "Rate sheet parsing failed. You can still update the rates manually." });
  }
});

// ── Static files (production) ────────────────────────────────────────────────
if (IS_PROD) {
  const distPath = join(__dirname, "dist");
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  F.A.S.T. server running on http://localhost:${PORT}`);
  console.log(`  Model: ${CLAUDE_MODEL}`);
  console.log(`  Mode: ${IS_PROD ? "production" : "development"}\n`);
});
