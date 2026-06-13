// ─── api.js ──────────────────────────────────────────────────────────────────
// All calls to the F.A.S.T. backend — auth always includes the Bearer token.

import { getToken, setToken, clearToken } from "./storage";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({ error: "Unexpected server response." }));
  if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
  return data;
}

// ── Login ────────────────────────────────────────────────────────────────────

export async function login(password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await handleResponse(res);
  setToken(data.token);
  return data.token;
}

export function logout() {
  clearToken();
}

// ── Analysis ─────────────────────────────────────────────────────────────────

export async function analyze({ pdfBase64, brain, notes }) {
  const modelsText = brain.models
    .filter((m) => m.name.trim())
    .map(
      (m) =>
        `MODEL ${m.letter} — "${m.name}"\nRisk profile: ${m.riskProfile}\nTarget allocation: ${m.allocation}\nWhen to use: ${m.whenToUse}`
    )
    .join("\n\n");

  const prompt = `You are F.A.S.T. (Financial Advisory Steward Technology) — the personal recommendation engine for ${
    brain.advisorName || "the advisor"
  }${brain.firm ? " of " + brain.firm : ""}. You think exactly like this advisor. You only use HIS logic, HIS preferences, and HIS model portfolios. You are not a generic financial AI.

THE ADVISOR'S PREFERENCES AND BIASES:
${brain.preferences}

THE ADVISOR'S MODEL PORTFOLIOS:
${modelsText}

${notes.trim() ? "ADVISOR'S NOTES ON THIS CLIENT:\n" + notes.trim() + "\n\n" : ""}TASK: Read the attached client financial document. Extract the client's situation, then recommend which ONE model portfolio (by letter) best fits, applying the advisor's preferences strictly.

Respond ONLY with valid JSON, no markdown fences, no preamble, in exactly this structure:
{
  "clientSnapshot": {
    "name": "client name or 'Not stated'",
    "estimatedAssets": "dollar figure or range from document",
    "riskIndicators": "what the document suggests about risk tolerance/horizon",
    "keyHoldings": "summary of current holdings/accounts found"
  },
  "modelMatch": "A single letter A-E",
  "modelName": "name of that model",
  "confidence": "High, Medium, or Low",
  "rationale": "2-4 sentences explaining why this model fits THIS client using the advisor's own logic and preferences",
  "adjustments": ["1-3 specific allocation tweaks or considerations for this particular client"],
  "talkingPoints": ["3-4 conversation points the advisor can use in the client meeting, in the advisor's voice"],
  "flags": ["any protection gaps, cash flow concerns, or items the advisor's preferences say to address first — empty array if none"]
}`;

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ pdfBase64, prompt }),
  });

  return handleResponse(res);
}
