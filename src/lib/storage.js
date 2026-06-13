// ─── storage.js ──────────────────────────────────────────────────────────────
// localStorage wrapper — replaces window.storage used in the v1 artifact.

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
