// ─── storage.js ──────────────────────────────────────────────────────────────
// Brain persistence: server is the source of truth (follows the advisor across
// browsers/devices); localStorage is the fast local cache + offline fallback.

const BRAIN_KEY = "fast-advisor-brain-v1";
const AUTH_KEY = "fast-auth-token";

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
