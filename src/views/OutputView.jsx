import { useState } from "react";
import { loadBrain } from "../lib/storage";
import { exportRecommendationPDF } from "../lib/pdfExport";

const NAVY = "#0D1B2A";
const GOLD = "#C9A84C";
const ACCENT = "#1A3A5C";
const CREAM = "#FFF8E7";
const GRAY = "#F5F5F5";

export default function OutputView({ result, onNewAnalysis }) {
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  if (!result) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 className="font-serif" style={{ color: NAVY, fontSize: 26 }}>
            Recommendation
          </h2>
          <div style={{ height: 2, width: 56, background: GOLD, marginTop: 8 }} />
        </div>
        <p style={{ fontSize: 13, color: "#6B7686" }}>
          No analysis yet. Run a client document through{" "}
          <strong>New Client Analysis</strong> and the recommendation appears here.
        </p>
      </div>
    );
  }

  const r = result;

  function handleCopy() {
    const out = [
      "F.A.S.T. RECOMMENDATION",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `MODEL MATCH: ${r.modelMatch} — ${r.modelName}  (Confidence: ${r.confidence})`,
      "",
      `CLIENT: ${r.clientSnapshot?.name}`,
      `ESTIMATED ASSETS: ${r.clientSnapshot?.estimatedAssets}`,
      `RISK INDICATORS: ${r.clientSnapshot?.riskIndicators}`,
      `CURRENT HOLDINGS: ${r.clientSnapshot?.keyHoldings}`,
      "",
      "WHY THIS MODEL — YOUR LOGIC:",
      r.rationale,
      "",
      "ADJUSTMENTS FOR THIS CLIENT:",
      ...(r.adjustments || []).map((a) => `- ${a}`),
      "",
      "MEETING TALKING POINTS:",
      ...(r.talkingPoints || []).map((t, i) => `${i + 1}. ${t}`),
      "",
      "FLAGS — ADDRESS FIRST:",
      ...(r.flags?.length ? r.flags.map((f) => `! ${f}`) : ["None"]),
      "",
      "─────────────────────────────────────────────────────────────────",
      "F.A.S.T. — Financial Advisory Steward Technology",
      "Built by Vicron A.I. Consulting — Bridging the Gap",
      "Decision-support draft. Advisor review required before any client use.",
    ].join("\n");

    navigator.clipboard.writeText(out).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleExportPdf() {
    setExportingPdf(true);
    try {
      const brain = loadBrain() || { advisorName: "", firm: "" };
      exportRecommendationPDF(r, brain);
    } catch (e) {
      console.error("PDF export error:", e);
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div>
      {/* Section heading */}
      <div style={{ marginBottom: 20 }}>
        <h2 className="font-serif" style={{ color: NAVY, fontSize: 26 }}>
          Recommendation
        </h2>
        <div style={{ height: 2, width: 56, background: GOLD, marginTop: 8 }} />
      </div>

      {/* ── THE SEAL ── */}
      <div
        style={{
          background: NAVY,
          borderRadius: 12,
          padding: "36px 24px",
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "#8A93A3",
            marginBottom: 16,
          }}
        >
          Model Match
        </div>
        <div
          style={{
            width: 96,
            height: 96,
            margin: "0 auto",
            borderRadius: "50%",
            border: `3px solid ${GOLD}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Playfair Display', serif",
            fontSize: 48,
            fontWeight: 700,
            color: GOLD,
          }}
        >
          {r.modelMatch}
        </div>
        <div
          className="font-serif"
          style={{ color: "white", fontSize: 22, marginTop: 16 }}
        >
          {r.modelName}
        </div>
        <div
          style={{
            fontSize: 11,
            marginTop: 8,
            textTransform: "uppercase",
            letterSpacing: 2,
            color: GOLD,
          }}
        >
          Confidence: {r.confidence}
        </div>
      </div>

      {/* ── CLIENT SNAPSHOT ── */}
      <div
        style={{
          border: "1px solid #E2E6EB",
          borderRadius: 8,
          padding: "20px",
          marginBottom: 20,
        }}
      >
        <h3 className="font-serif" style={{ color: NAVY, fontSize: 17, marginBottom: 14 }}>
          Client Snapshot
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px 24px",
            fontSize: 13,
            color: "#374151",
          }}
        >
          <div>
            <strong>Client:</strong> {r.clientSnapshot?.name}
          </div>
          <div>
            <strong>Estimated assets:</strong> {r.clientSnapshot?.estimatedAssets}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <strong>Risk indicators:</strong> {r.clientSnapshot?.riskIndicators}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <strong>Current holdings:</strong> {r.clientSnapshot?.keyHoldings}
          </div>
        </div>
      </div>

      {/* ── RATIONALE ── */}
      <div
        style={{
          borderLeft: `4px solid ${GOLD}`,
          paddingLeft: 16,
          paddingTop: 4,
          paddingBottom: 4,
          marginBottom: 20,
        }}
      >
        <h3 className="font-serif" style={{ color: NAVY, fontSize: 17, marginBottom: 8 }}>
          Why this model — your logic
        </h3>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{r.rationale}</p>
      </div>

      {/* ── ADJUSTMENTS ── */}
      {r.adjustments?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 className="font-serif" style={{ color: NAVY, fontSize: 17, marginBottom: 10 }}>
            Adjustments for this client
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {r.adjustments.map((a, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 13,
                  color: "#374151",
                  marginBottom: 8,
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: GOLD, flexShrink: 0, marginTop: 2 }}>◆</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── TALKING POINTS ── */}
      {r.talkingPoints?.length > 0 && (
        <div
          style={{
            background: GRAY,
            borderRadius: 8,
            padding: "20px",
            marginBottom: 20,
          }}
        >
          <h3 className="font-serif" style={{ color: NAVY, fontSize: 17, marginBottom: 10 }}>
            Meeting talking points
          </h3>
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {r.talkingPoints.map((t, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 13,
                  color: "#374151",
                  marginBottom: 8,
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: ACCENT, fontWeight: 600, flexShrink: 0, width: 18 }}>
                  {i + 1}.
                </span>
                {t}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── FLAGS ── */}
      {r.flags?.length > 0 && (
        <div
          style={{
            border: `1px solid ${GOLD}`,
            borderRadius: 8,
            padding: "20px",
            marginBottom: 24,
            background: CREAM,
          }}
        >
          <h3 className="font-serif" style={{ color: NAVY, fontSize: 17, marginBottom: 10 }}>
            ⚑ Address first — your rules
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {r.flags.map((f, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 13,
                  color: "#374151",
                  marginBottom: 8,
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: "#C0392B", flexShrink: 0, marginTop: 2 }}>●</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <button
          onClick={handleCopy}
          style={{
            padding: "10px 22px",
            borderRadius: 6,
            border: "none",
            background: NAVY,
            color: GOLD,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {copied ? "✓ Copied!" : "Copy to clipboard"}
        </button>

        <button
          onClick={handleExportPdf}
          disabled={exportingPdf}
          style={{
            padding: "10px 22px",
            borderRadius: 6,
            border: `1px solid ${NAVY}`,
            background: "white",
            color: NAVY,
            fontWeight: 600,
            fontSize: 13,
            cursor: exportingPdf ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {exportingPdf ? "Generating PDF…" : "Export PDF"}
        </button>

        <button
          onClick={onNewAnalysis}
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            border: `1px solid ${ACCENT}`,
            background: "transparent",
            color: ACCENT,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          New analysis
        </button>
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: 11, color: "#9AA3AF", lineHeight: 1.6 }}>
        F.A.S.T. output is a decision-support draft built from your stored preferences. Review,
        verify extracted data, and apply professional judgment before any client use. Not a
        substitute for advisor analysis or regulatory compliance.
      </p>
    </div>
  );
}
