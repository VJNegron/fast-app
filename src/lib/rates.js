// ─── rates.js ────────────────────────────────────────────────────────────────
// Helpers for NYL weekly rate sheet freshness and formatting.

export const STALE_RATE_DAYS = 14;

export function normalizeRateValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "—" || raw.toLowerCase() === "n/a") return "";
  if (raw.endsWith("%")) return raw;

  const numeric = Number(raw.replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(numeric)) return raw;
  return `${numeric.toFixed(2)}%`;
}

export function parseRateDate(value) {
  if (!value) return null;
  const cleaned = String(value)
    .replace(/\b(effective|as of|updated|rates as of)\b/gi, "")
    .replace(/[·|]/g, " ")
    .trim();

  const parsed = Date.parse(cleaned);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function getRateFreshness(lastUpdated, now = new Date()) {
  if (!lastUpdated?.trim()) {
    return {
      status: "missing",
      stale: true,
      label: "Rates need update",
      message: "No rate date is saved. Upload the latest NYL rate sheet before using annuity recommendations.",
    };
  }

  const parsed = parseRateDate(lastUpdated);
  if (!parsed) {
    return {
      status: "unknown",
      stale: true,
      label: "Verify rate date",
      message: `Could not verify the saved rate date (${lastUpdated}). Confirm the weekly NYL sheet is current before use.`,
    };
  }

  const ageDays = Math.floor((now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24));
  if (ageDays > STALE_RATE_DAYS) {
    return {
      status: "stale",
      stale: true,
      ageDays,
      label: "Rates may be stale",
      message: `Saved rates are ${ageDays} days old (${lastUpdated}). Upload the latest NYL weekly rate sheet before relying on annuity recommendations.`,
    };
  }

  return {
    status: "fresh",
    stale: false,
    ageDays: Math.max(ageDays, 0),
    label: "Rates current",
    message: `Rates are current (${lastUpdated}).`,
  };
}
