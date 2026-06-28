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

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const FAST_USERNAME = process.env.FAST_USERNAME;
const FAST_PASSWORD = process.env.FAST_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
const IS_PROD = process.env.NODE_ENV === "production";
const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB

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
  const { pdfBase64, prompt } = req.body || {};

  if (!pdfBase64 || !prompt) {
    return res.status(400).json({ error: "Missing PDF or prompt." });
  }

  const estimatedBytes = Math.floor((pdfBase64.length * 3) / 4);
  if (estimatedBytes > MAX_PDF_BYTES) {
    return res.status(400).json({
      error: `This PDF is too large (${(estimatedBytes / 1024 / 1024).toFixed(1)} MB). Max is 25 MB. Try a shorter statement or split the document.`,
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
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
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
