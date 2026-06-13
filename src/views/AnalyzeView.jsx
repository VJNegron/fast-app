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

export default function AnalyzeView({ onResult }) {
  const [pdfFile, setPdfFile]   = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [notes, setNotes]       = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError]       = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [notesFocus, setNotesFocus] = useState(false);
  const fileRef = useRef(null);

  const brain = loadBrain();
  const brainComplete =
    brain &&
    brain.preferences?.trim().length > 0 &&
    brain.models?.some((m) => m.name?.trim().length > 0);

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
      const result = await analyze({ pdfBase64, brain, notes });
      onResult(result);
      setPdfFile(null);
      setPdfBase64(null);
      setNotes("");
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
          borderLeft: `3px solid ${GOLD}`,
          background: "#FEFBF3",
          border: `1px solid rgba(196,153,42,0.3)`,
          padding: "16px 20px",
          marginBottom: 28,
          fontSize: 13,
          color: TEXT,
          lineHeight: 1.7,
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
            {/* File icon */}
            <div style={{
              width: 44,
              height: 44,
              border: `1px solid ${GOLD}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              color: GOLD,
              fontSize: 18,
            }}>
              ⬜
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 15,
              fontWeight: 600,
              color: TEXT,
              marginBottom: 4,
            }}>
              {pdfFile.name}
            </div>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 0.5 }}>
              {(pdfFile.size / 1024).toFixed(0)} KB · click to replace
            </div>
          </div>
        ) : (
          <div>
            {/* Upload icon */}
            <div style={{
              width: 44,
              height: 44,
              border: `1px dashed #C0B8AC`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: STEEL,
              fontSize: 20,
            }}>
              ↑
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 16,
              fontWeight: 600,
              color: TEXT,
              marginBottom: 6,
              letterSpacing: 0.3,
            }}>
              Drop the client's PDF here
            </div>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 0.5, lineHeight: 1.8 }}>
              Statements · account summaries · planning documents<br />
              Max 25 MB · PDF only
            </div>
          </div>
        )}
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
          borderLeft: `3px solid #8B3A3A`,
          border: `1px solid rgba(139,58,58,0.3)`,
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
          Reading the document and thinking like you — typically 10–30 seconds.
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
