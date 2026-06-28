import { useState, useRef } from "react";
import { loadBrain } from "../lib/storage";
import { analyze } from "../lib/api";

// ── Wall Street brand tokens ──────────────────────────────────────────────────
const DARK   = "#06101D";
const NAVY   = "#0D1825";
const GOLD   = "#C4992A";
const STEEL  = "#5C6E7E";
const CREAM  = "#F5F1E8";
const BORDER = "#DDD5C5";
const TEXT   = "#1A2438";
const MUTED  = "#6B7A8A";

const MAX_PDF_DISPLAY_MB = 25;

const PREF_QUESTIONS = [
  {
    key: "managementStyle",
    label: "Management Style",
    options: [
      { value: "active",  label: "Active" },
      { value: "passive", label: "Passive / Index" },
      { value: "none",    label: "No Preference" },
    ],
  },
  {
    key: "strategyApproach",
    label: "Strategy Approach",
    options: [
      { value: "tactical", label: "Tactical / Momentum" },
      { value: "market",   label: "Follow the Market" },
    ],
  },
  {
    key: "involvementLevel",
    label: "Client Involvement",
    options: [
      { value: "handson",  label: "Hands-On Collaboration" },
      { value: "handsoff", label: "Let Managers Handle It" },
    ],
  },
  {
    key: "feeSensitive",
    label: "Fee Sensitivity",
    options: [
      { value: "yes", label: "Fee-Sensitive" },
      { value: "no",  label: "Return-Focused" },
    ],
  },
  {
    key: "volatilityComfort",
    label: "Volatility Comfort",
    options: [
      { value: "steady",   label: "Steady & Consistent" },
      { value: "volatile", label: "Accepts Volatility" },
    ],
  },
  {
    key: "wantsGuarantees",
    label: "Desires Guarantees on Assets?",
    options: [
      { value: "yes", label: "Yes — Explore Annuity Layer" },
      { value: "no",  label: "No — Market Strategies Only" },
    ],
  },
];

export default function AnalyzeView({ onResult }) {
  const [pdfFile, setPdfFile]     = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [notes, setNotes]         = useState("");
  const [prefs, setPrefs]         = useState({
    managementStyle:  null,
    strategyApproach: null,
    involvementLevel: null,
    feeSensitive:     null,
    volatilityComfort: null,
    wantsGuarantees:  null,
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError]         = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [notesFocus, setNotesFocus] = useState(false);
  const fileRef = useRef(null);

  const brain = loadBrain();
  const brainComplete =
    brain &&
    brain.preferences?.trim().length > 0 &&
    brain.models?.some((m) => m.name?.trim().length > 0);

  const annuityGateActive = prefs.wantsGuarantees === "yes";

  function setPref(key, val) {
    setPrefs((p) => ({ ...p, [key]: val }));
  }

  function handleFile(file) {
    if (!file) return;
    setError(null);

    if (file.type !== "application/pdf") {
      setError("Upload a PDF — statements, account summaries, or planning documents.");
      return;
    }

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > MAX_PDF_DISPLAY_MB) {
      setError(
        `This PDF is ${sizeMB.toFixed(1)} MB — over the 25 MB limit. Try a shorter statement or split the document.`
      );
      return;
    }

    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = () => setPdfBase64(reader.result.split(",")[1]);
    reader.onerror = () =>
      setError("Could not read that file. Make sure it's a valid, non-encrypted PDF.");
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!pdfBase64) {
      setError("Upload the client's PDF first.");
      return;
    }
    if (!brainComplete) {
      setError("The Advisor Brain is empty — set up your preferences and at least one model first.");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyze({ pdfBase64, brain, notes, prefs });
      onResult(result);
      setPdfFile(null);
      setPdfBase64(null);
      setNotes("");
      setPrefs({
        managementStyle: null, strategyApproach: null, involvementLevel: null,
        feeSensitive: null, volatilityComfort: null, wantsGuarantees: null,
      });
    } catch (err) {
      if (
        err.message?.toLowerCase().includes("session expired") ||
        err.message?.toLowerCase().includes("unauthorized")
      ) {
        setError("Your session has expired. Refresh the page and sign in again.");
      } else {
        setError(err.message || "Analysis failed. Try again.");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      <PageHeader title="New Client Analysis" />

      <p style={{ fontSize: 13, color: MUTED, marginBottom: 32, lineHeight: 1.8, maxWidth: 580 }}>
        Upload the client's statement or financial document. F.A.S.T. reads it, matches it against
        your models, and returns your recommendation.
      </p>

      {/* Brain warning */}
      {!brainComplete && (
        <div style={{
          border: `1px solid rgba(196,153,42,0.3)`,
          borderLeft: `3px solid ${GOLD}`,
          padding: "16px 20px",
          marginBottom: 28,
          fontSize: 13,
          color: TEXT,
          lineHeight: 1.7,
          background: "#FEFBF3",
        }}>
          <strong style={{ color: "#8B6914", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, display: "block", marginBottom: 6 }}>
            ⚑ Advisor Brain Required
          </strong>
          The Advisor Brain is empty. Set up your preferences and models first —
          that's what makes the recommendation yours.{" "}
          <span style={{ color: GOLD, fontWeight: 600 }}>(Go to "The Advisor Brain" tab)</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => !analyzing && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          border: `1px dashed ${pdfFile ? GOLD : dragOver ? GOLD : "#C0B8AC"}`,
          background: dragOver ? "#FEFBF3" : pdfFile ? "#FDFAF5" : "#FAF8F4",
          padding: "48px 24px",
          textAlign: "center",
          cursor: analyzing ? "wait" : "pointer",
          marginBottom: 28,
          transition: "all 0.15s",
          position: "relative",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {pdfFile ? (
          <div>
            <div style={{
              width: 44, height: 44,
              border: `1px solid ${GOLD}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
              color: GOLD, fontSize: 18,
            }}>⬜</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 4 }}>
              {pdfFile.name}
            </div>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 0.5 }}>
              {(pdfFile.size / 1024).toFixed(0)} KB · click to replace
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              width: 44, height: 44,
              border: `1px dashed #C0B8AC`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              color: STEEL, fontSize: 20,
            }}>↑</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: TEXT, marginBottom: 6, letterSpacing: 0.3 }}>
              Drop the client's PDF here
            </div>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 0.5, lineHeight: 1.8 }}>
              Statements · account summaries · planning documents<br />
              Max 25 MB · PDF only
            </div>
          </div>
        )}
      </div>

      {/* ── Client Investment Preferences ─────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: 2.5,
          color: STEEL,
          fontWeight: 600,
          marginBottom: 4,
        }}>
          Client Investment Preferences
        </div>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 20, lineHeight: 1.7, marginTop: 6 }}>
          Select what applies — these shape the recommendation and are injected into the analysis.
        </p>

        <div style={{
          border: `1px solid ${BORDER}`,
          background: "#FDFAF5",
          padding: "20px 24px",
        }}>
          {PREF_QUESTIONS.map((q, i) => (
            <div
              key={q.key}
              style={{
                paddingBottom: i < PREF_QUESTIONS.length - 1 ? 18 : 0,
                marginBottom: i < PREF_QUESTIONS.length - 1 ? 18 : 0,
                borderBottom: i < PREF_QUESTIONS.length - 1 ? `1px solid ${BORDER}` : "none",
              }}
            >
              {/* Guarantee gate gets highlighted treatment */}
              {q.key === "wantsGuarantees" && (
                <div style={{
                  fontSize: 8,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: GOLD,
                  fontWeight: 600,
                  marginBottom: 6,
                }}>
                  ◆ Annuity Suitability Gate
                </div>
              )}
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: q.key === "wantsGuarantees" ? TEXT : STEEL,
                marginBottom: 10,
              }}>
                {q.label}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {q.options.map((opt) => {
                  const selected = prefs[q.key] === opt.value;
                  const isAnnuityYes = q.key === "wantsGuarantees" && opt.value === "yes" && selected;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setPref(q.key, selected ? null : opt.value)}
                      style={{
                        padding: "8px 16px",
                        border: `1px solid ${selected ? GOLD : "#C8C0B4"}`,
                        background: isAnnuityYes
                          ? "rgba(196,153,42,0.12)"
                          : selected
                          ? "rgba(196,153,42,0.06)"
                          : "transparent",
                        color: selected ? GOLD : MUTED,
                        fontSize: 11,
                        fontWeight: selected ? 600 : 400,
                        letterSpacing: 0.5,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Annuity gate — show activation notice */}
              {annuityGateActive && q.key === "wantsGuarantees" && (
                <div style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  background: "rgba(196,153,42,0.05)",
                  border: `1px solid rgba(196,153,42,0.2)`,
                  fontSize: 11,
                  color: "#8B6914",
                  lineHeight: 1.7,
                }}>
                  <strong>Annuity layer activated.</strong> F.A.S.T. will evaluate NYL IndexFlex suitability
                  and return a strategy recommendation alongside the model match.
                  {brain?.annuityRates ? ` Rates loaded (${brain.annuityRates.lastUpdated}).` : " Update NYL rates in The Advisor Brain first."}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: 2.5,
          color: STEEL,
          fontWeight: 600,
          marginBottom: 6,
        }}>
          Notes on this client (optional)
        </div>
        <textarea
          style={{
            width: "100%",
            background: "#FDFAF5",
            border: `1px solid ${notesFocus ? GOLD : BORDER}`,
            padding: "12px 14px",
            fontSize: 13,
            color: TEXT,
            outline: "none",
            fontFamily: "inherit",
            letterSpacing: 0.2,
            minHeight: 88,
            resize: "vertical",
            transition: "border-color 0.15s",
            lineHeight: 1.7,
          }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onFocus={() => setNotesFocus(true)}
          onBlur={() => setNotesFocus(false)}
          placeholder="Anything the document won't show — recently widowed, planning to retire at 62, mentioned college funding…"
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          border: `1px solid rgba(139,58,58,0.3)`,
          borderLeft: `3px solid #8B3A3A`,
          padding: "12px 16px",
          marginBottom: 20,
          background: "#FFF8F8",
          color: "#8B3A3A",
          fontSize: 13,
          lineHeight: 1.7,
        }}>
          {error}
        </div>
      )}

      {/* Generate button */}
      <GenerateBtn analyzing={analyzing} onClick={handleGenerate} />

      {analyzing && (
        <p style={{
          fontSize: 11,
          color: MUTED,
          marginTop: 14,
          letterSpacing: 0.3,
          lineHeight: 1.8,
        }}>
          Reading the document and thinking like you{annuityGateActive ? ", evaluating annuity suitability" : ""} — typically 10–30 seconds.
        </p>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PageHeader({ title }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 3, color: STEEL, marginBottom: 8, fontWeight: 500 }}>
        F.A.S.T. · Financial Advisory Steward Technology
      </div>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        color: "#1A2438",
        fontSize: 28,
        fontWeight: 700,
        margin: 0,
        letterSpacing: 0.3,
      }}>
        {title}
      </h2>
      <div style={{ height: 2, width: 40, background: GOLD, marginTop: 12, opacity: 0.7 }} />
    </div>
  );
}

function GenerateBtn({ analyzing, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={analyzing}
      style={{
        padding: "13px 32px",
        border: analyzing ? `1px solid #C0B8AC` : `1px solid ${GOLD}`,
        background: analyzing ? "transparent" : hover ? GOLD : "transparent",
        color: analyzing ? MUTED : hover ? DARK : GOLD,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 2,
        textTransform: "uppercase",
        cursor: analyzing ? "wait" : "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {analyzing ? (
        <>
          <span style={{
            display: "inline-block",
            width: 12,
            height: 12,
            border: `1px solid ${MUTED}`,
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "fast-spin 0.8s linear infinite",
          }} />
          Analyzing…
          <style>{`@keyframes fast-spin { to { transform: rotate(360deg); } }`}</style>
        </>
      ) : (
        "Generate Recommendation"
      )}
    </button>
  );
}
