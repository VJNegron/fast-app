import { useState, useRef } from "react";
import { loadBrain } from "../lib/storage";
import { analyze } from "../lib/api";

const NAVY = "#0D1B2A";
const GOLD = "#C9A84C";
const ACCENT = "#1A3A5C";
const CREAM = "#FFF8E7";

const MAX_PDF_DISPLAY_MB = 25;

const inputCls = {
  width: "100%",
  border: "1px solid #D8DCE2",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 13,
  color: NAVY,
  outline: "none",
  fontFamily: "inherit",
};

const labelCls = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: ACCENT,
  marginBottom: 5,
};

export default function AnalyzeView({ onResult }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
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
        `This PDF is ${sizeMB.toFixed(1)} MB — over the 25 MB limit. Try a shorter statement or split the document into smaller files.`
      );
      return;
    }

    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = () => setPdfBase64(reader.result.split(",")[1]);
    reader.onerror = () =>
      setError("Could not read that file. Make sure it's a valid, non-encrypted PDF and try again.");
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!pdfBase64) {
      setError("Upload the client's PDF first.");
      return;
    }
    if (!brainComplete) {
      setError("The Advisor Brain is empty. Set up your preferences and at least one model in The Advisor Brain tab first.");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyze({ pdfBase64, brain, notes });
      onResult(result);
      // Reset after successful analysis
      setPdfFile(null);
      setPdfBase64(null);
      setNotes("");
    } catch (err) {
      // Surface the server's error message directly — they're already user-friendly
      setError(err.message || "Analysis failed. Try again.");

      // If it's a 401, the session expired
      if (err.message?.toLowerCase().includes("session expired") || err.message?.toLowerCase().includes("unauthorized")) {
        setError("Your session has expired. Refresh the page and sign in again.");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      {/* Section heading */}
      <div style={{ marginBottom: 20 }}>
        <h2 className="font-serif" style={{ color: NAVY, fontSize: 26 }}>
          New Client Analysis
        </h2>
        <div style={{ height: 2, width: 56, background: GOLD, marginTop: 8 }} />
      </div>

      <p style={{ fontSize: 13, color: "#4A5568", marginBottom: 28, maxWidth: 600 }}>
        Upload the client's statement or financial document. F.A.S.T. reads it, matches it against
        your models, and returns your recommendation.
      </p>

      {/* Brain warning */}
      {!brainComplete && (
        <div
          style={{
            border: `1px solid ${GOLD}`,
            borderRadius: 8,
            padding: "14px 16px",
            marginBottom: 24,
            background: CREAM,
            fontSize: 13,
            color: NAVY,
          }}
        >
          <strong>The Advisor Brain is empty.</strong> Set up your preferences and models first —
          that's what makes the recommendation yours.{" "}
          <span style={{ color: ACCENT, fontWeight: 600 }}>(Go to "The Advisor Brain" tab)</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          border: `2px dashed ${pdfFile ? GOLD : "#C5CBD3"}`,
          borderRadius: 12,
          padding: "40px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: pdfFile ? CREAM : "white",
          marginBottom: 24,
          transition: "all 0.15s",
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
            <div className="font-serif" style={{ fontSize: 17, color: NAVY }}>
              📄 {pdfFile.name}
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: "#6B7686" }}>
              {(pdfFile.size / 1024).toFixed(0)} KB — click to replace
            </div>
          </div>
        ) : (
          <div>
            <div className="font-serif" style={{ fontSize: 17, color: NAVY, marginBottom: 4 }}>
              Drop the client's PDF here
            </div>
            <div style={{ fontSize: 12, color: "#6B7686" }}>
              Statements · account summaries · planning documents · max 25 MB
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelCls}>Notes on this client (optional)</label>
        <textarea
          style={{ ...inputCls, minHeight: 80, resize: "vertical" }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the document won't show — recently widowed, planning to retire at 62, mentioned college funding…"
        />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            border: "1px solid #FFCDD2",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 20,
            background: "#FFF5F5",
            color: "#C0392B",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={analyzing}
        style={{
          padding: "12px 32px",
          borderRadius: 6,
          border: "none",
          background: analyzing ? "#9AA3AF" : NAVY,
          color: GOLD,
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: 0.4,
          cursor: analyzing ? "wait" : "pointer",
          fontFamily: "inherit",
          transition: "background 0.15s",
        }}
      >
        {analyzing
          ? "Reading the document and thinking like you…"
          : "Generate Recommendation"}
      </button>

      {analyzing && (
        <p style={{ fontSize: 12, color: "#6B7686", marginTop: 12 }}>
          This usually takes 10–30 seconds depending on document length.
        </p>
      )}
    </div>
  );
}
