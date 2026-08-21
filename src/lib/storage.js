// ─── storage.js ──────────────────────────────────────────────────────────────
// Brain persistence: server is the source of truth (follows the advisor across
// browsers/devices); localStorage is the fast local cache + offline fallback.

const BRAIN_KEY = "fast-advisor-brain-v1";
const BRAIN_HISTORY_KEY = "fast-advisor-brain-history-v1";
const ANALYSIS_HISTORY_KEY = "fast-analysis-history-v1";
const AUTH_KEY = "fast-auth-token";
const MAX_HISTORY_ITEMS = 25;

// ── Brain persistence ────────────────────────────────────────────────────────

export function loadBrain() {
  try {
    const raw = localStorage.getItem(BRAIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveBrain(brain) {
  try {
    localStorage.setItem(BRAIN_KEY, JSON.stringify(brain));
    return true;
  } catch {
    return false;
  }
}

function loadList(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveList(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
    return true;
  } catch {
    return false;
  }
}

export function loadBrainHistory() {
  return loadList(BRAIN_HISTORY_KEY);
}

export function snapshotBrain(brain, reason = "Manual save") {
  if (!brain) return false;
  const versions = loadBrainHistory();
  const item = {
    id: `brain-${Date.now()}`,
    savedAt: new Date().toISOString(),
    reason,
    advisorName: brain.advisorName || "Advisor",
    firm: brain.firm || "",
    modelCount: (brain.models || []).filter((m) => m.name?.trim()).length,
    rateDate: brain.annuityRates?.lastUpdated || "",
    brain,
  };
  return saveList(BRAIN_HISTORY_KEY, [item, ...versions]);
}

export function loadAnalysisHistory() {
  return loadList(ANALYSIS_HISTORY_KEY);
}

export function saveAnalysisResult(result, meta = {}) {
  if (!result) return false;
  const existing = loadAnalysisHistory();
  const item = {
    id: `analysis-${Date.now()}`,
    savedAt: new Date().toISOString(),
    clientName: result.clientSnapshot?.name || "Unknown client",
    modelMatch: result.modelMatch || "—",
    modelName: result.modelName || "",
    confidence: result.confidence || "",
    hasAnnuity: result.annuityRecommendation?.suitable === true,
    documentNames: meta.documentNames || [],
    notes: meta.notes || "",
    result,
  };
  saveList(ANALYSIS_HISTORY_KEY, [item, ...existing]);
  return item;
}

// Pull the brain from the server into the local cache. Returns it, or null.
export async function fetchServerBrain() {
  try {
    const token = getToken();
    if (!token) return null;
    const res = await fetch("/api/brain", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.brain) {
      saveBrain(data.brain);
      return data.brain;
    }
    return null;
  } catch {
    return null;
  }
}

// Push the brain to the server. Returns true on success.
export async function pushServerBrain(brain) {
  try {
    const token = getToken();
    if (!token) return false;
    const res = await fetch("/api/brain", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ brain }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Called once after login: server brain wins; if the server has none but this
// device does, migrate the device brain up (one-time move to server storage).
export async function syncBrain() {
  const server = await fetchServerBrain();
  if (server) return server;
  const local = loadBrain();
  if (local) await pushServerBrain(local);
  return local;
}

// ── Auth token ───────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(AUTH_KEY) || null;
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(AUTH_KEY, token);
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function clearToken() {
  localStorage.removeItem(AUTH_KEY);
}
