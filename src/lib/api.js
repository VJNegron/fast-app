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

export async function login(username, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse(res);
  setToken(data.token);
  return data.token;
}

export function logout() {
  clearToken();
}

// ── Analysis ─────────────────────────────────────────────────────────────────

export async function analyze({ pdfBase64, brain, notes, prefs = {} }) {
  const modelsText = brain.models
    .filter((m) => m.name.trim())
    .map(
      (m) =>
        `MODEL ${m.letter} — "${m.name}"\nRisk profile: ${m.riskProfile}\nTarget allocation: ${m.allocation}\nWhen to use: ${m.whenToUse}`
    )
    .join("\n\n");

  // ── Build client preferences block ────────────────────────────────────────
  const prefLabels = {
    managementStyle: {
      active:  "Active management — wants a manager making tactical calls",
      passive: "Passive management — prefers low-cost index exposure",
      none:    "No preference on active vs. passive",
    },
    strategyApproach: {
      tactical: "Tactical / momentum-based — wants to follow market shifts",
      market:   "Market-following — prefers to track the overall market",
    },
    involvementLevel: {
      handson:  "Hands-on — wants to collaborate on decisions with the advisor",
      handsoff: "Hands-off — prefers to let money managers handle it",
    },
    feeSensitive: {
      yes: "Fee-sensitive — lower cost is a priority",
      no:  "Return-focused — comfortable with fees if returns justify them",
    },
    volatilityComfort: {
      steady:   "Prefers steady, consistent returns — low volatility tolerance",
      volatile: "Accepts volatility in pursuit of higher return potential",
    },
    wantsGuarantees: {
      yes: "DESIRES GUARANTEES on principal or income — annuity layer is appropriate to explore",
      no:  "Does not require guarantees — market-based strategies preferred",
    },
  };

  const prefsText = Object.entries(prefLabels)
    .map(([key, opts]) => {
      const val = prefs[key];
      return val && opts[val] ? `• ${opts[val]}` : null;
    })
    .filter(Boolean)
    .join("\n");

  // ── Build annuity rates block ──────────────────────────────────────────────
  const wantsGuarantees = prefs.wantsGuarantees === "yes";
  const annuityRates = brain.annuityRates;

  let annuityContext = "";
  if (wantsGuarantees && annuityRates && annuityRates.strategies?.length) {
    const rateLines = annuityRates.strategies
      .map((s) =>
        s.enhanced
          ? `  ${s.name}: Standard ${s.standard} / Enhanced ${s.enhanced}`
          : `  ${s.name}: ${s.standard}`
      )
      .join("\n");

    annuityContext = `
ANNUITY STRATEGY — ${annuityRates.product || "NYL IndexFlex"} (rates as of ${annuityRates.lastUpdated || "current"}):
${rateLines}
Suitability notes: ${annuityRates.suitabilityNotes || ""}
Default allocation approach: ${annuityRates.defaultAllocation || ""}

Because this client desires guarantees, evaluate whether a fixed-indexed annuity layer is appropriate alongside the model portfolio. If suitable, recommend a specific index strategy (S&P vs Russell, Cap vs Flat, Standard vs Enhanced) and suggest how the annuity should be sized relative to the overall portfolio.`;
  }

  // ── Assemble full prompt ───────────────────────────────────────────────────
  const prompt = `You are F.A.S.T. (Financial Advisory Steward Technology) — the personal recommendation engine for ${
    brain.advisorName || "the advisor"
  }${brain.firm ? " of " + brain.firm : ""}. You think exactly like this advisor. You only use HIS logic, HIS preferences, and HIS model portfolios. You are not a generic financial AI.

THE ADVISOR'S PREFERENCES AND BIASES:
${brain.preferences}

THE ADVISOR'S MODEL PORTFOLIOS:
${modelsText}

${prefsText ? `CLIENT INVESTMENT STYLE PREFERENCES (from advisor intake):\n${prefsText}\n\nApply these preferences when selecting the model and making adjustments. A passive, fee-sensitive client with steady preference should lean toward lower-cost index funds within the recommended model.` : ""}
${annuityContext}
${notes.trim() ? "\nADVISOR'S NOTES ON THIS CLIENT:\n" + notes.trim() : ""}

TASK: Read the attached client financial document. Extract the client's situation, then recommend which ONE model portfolio (by letter) best fits, applying the advisor's preferences strictly.

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
  "adjustments": ["1-3 specific allocation tweaks or considerations for this particular client, reflecting their stated investment style preferences"],
  "talkingPoints": ["3-4 conversation points the advisor can use in the client meeting, in the advisor's voice"],
  "flags": ["any protection gaps, cash flow concerns, or items the advisor's preferences say to address first — empty array if none"],
  "annuityRecommendation": {
    "suitable": ${wantsGuarantees ? "evaluate based on client situation — true or false" : "false"},
    "product": "NYL IndexFlex or null if not suitable",
    "rationale": "1-2 sentences on why annuity is or is not appropriate for this specific client",
    "recommendedStrategy": "e.g. S&P 500 Cap Enhanced — or null if not suitable",
    "currentRate": "the rate for that strategy from the table above — or null",
    "suggestedAllocation": "how to size the annuity vs. the market portfolio, e.g. '50% NYL IndexFlex / 50% Model B Fidelity 70-30' — or null",
    "talkingPoints": ["1-2 annuity-specific talking points in the advisor's voice — empty array if not suitable"]
  }
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
