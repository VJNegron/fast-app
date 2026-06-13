import { useState } from "react";
import { loadBrain } from "../lib/storage";
import { exportRecommendationPDF } from "../lib/pdfExport";

// ── Wall Street brand tokens ──────────────────────────────────────────────────
const DARK   = "#06101D";
const NAVY   = "#0D1825";
const GOLD   = "#C4992A";
const STEEL  = "#5C6E7E";
const CREAM  = "#F5F1E8";
const BORDER = "#DDD5C5";
const TEXT   = "#1A2438";
const MUTED  = "#6B7A8A";

const S = {
  sectionHead: {
    fontFamily: "'Playfair Display', serif",
    color: TEXT,
    fontSize: 13,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 14,
  },
  rule: {
    height: 1,
    background: BORDER,
    border: "none",
    margin: "24px 0",
  },
  goldRule: {
    height: 1,
    background: GOLD,
    border: "none",
    width: 40,
    margin: "10px 0 20px",
    opacity: 0.6,
  },
};

export default function OutputView({ result, onNewAnalysis }) {
  const [copied, setCopied]           = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  if (!result) {
    return (
      <div>
        <PageHeader title="Recommendation" />
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
          No analysis on record. Run a client document through{" "}
          <strong style={{ color: TEXT }}>New Client Analysis</strong> and the
          recommendation will appear here.
        </p>
      </div>
    );
  }

  const r = result;

  function handleCopy() {
    const out = [
      "F.A.S.T. — FINANCIAL ADVISORY STEWARD TECHNOLOGY",
      `Generated: ${new Date().toLocaleString()}`,
      "─".repeat(60),
      `MODEL MATCH: ${r.modelMatch} — ${r.modelName}`,
      `CONFIDENCE:  ${r.confidence}`,
      "",
      "CLIENT PROFILE",
      `Client:           ${r.clientSnapshot?.name}`,
      `Estimated Assets: ${r.clientSnapshot?.estimatedAssets}`,
      `Risk Indicators:  ${r.clientSnapshot?.riskIndicators}`,
      `Holdings:         ${r.clientSnapshot?.keyHoldings}`,
      "",
      "RATIONALE",
      r.rationale,
      "",
      "ADJUSTMENTS",
      ...(r.adjustments || []).map((a) => `  · ${a}`),
      "",
      "MEETING TALKING POINTS",
      ...(r.talkingPoints || []).map((t, i) => `  ${i + 1}. ${t}`),
      "",
      "FLAGS — ADDRESS FIRST",
      ...(r.flags?.length ? r.flags.map((f) => `  ! ${f}`) : ["  None"]),
      "",
      "─".repeat(60),
      "Decision-support draft. Advisor review required before client use.",
      "Built by Vicron A.I. Consulting — Bridging the Gap",
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
      <PageHeader title="Recommendation" />

      {/* ── THE SEAL ─────────────────────────────────────────────────────── */}
      <div style={{
        background: DARK,
        border: `1px solid #1A2B3C`,
        padding: "40px 32px",
        marginBottom: 32,
        display: "flex",
        alignItems: "center",
        gap: 40,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background watermark */}
        <div style={{
          position: "absolute",
          right: 24,
          top: "50%",
          transform: "translateY(-50%)",
          fontFamily: "'Playfair Display', serif",
          fontSize: 120,
          fontWeight: 700,
          color: "rgba(196,153,42,0.04)",
          letterSpacing: -4,
          userSelect: "none",
          lineHeight: 1,
        }}>
          {r.modelMatch}
        </div>

        {/* Seal */}
        <div style={{
          width: 88,
          height: 88,
          flexShrink: 0,
          border: `2px solid ${GOLD}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
          {/* Inner border */}
          <div style={{
            position: "absolute",
            inset: 4,
            border: `1px solid rgba(196,153,42,0.3)`,
          }} />
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 44,
            fontWeight: 700,
            color: GOLD,
            lineHeight: 1,
            position: "relative",
          }}>
            {r.modelMatch}
          </span>
        </div>

        {/* Model info */}
        <div style={{ position: "relative" }}>
          <div style={{
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: STEEL,
            marginBottom: 8,
            fontWeight: 500,
          }}>
            Model Match
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            color: "#E8E2D9",
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 6,
          }}>
            {r.modelName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: STEEL,
            }}>
              Confidence
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1,
              color: r.confidence === "High" ? "#4A8C6A" : r.confidence === "Low" ? "#8B3A3A" : GOLD,
            }}>
              {r.confidence}
            </span>
          </div>
        </div>
      </div>

      {/* ── CLIENT PROFILE ────────────────────────────────────────────────── */}
      <Section title="Client Profile">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 32px" }}>
          {[
            ["Client",           r.clientSnapshot?.name],
            ["Estimated Assets", r.clientSnapshot?.estimatedAssets],
            ["Risk Indicators",  r.clientSnapshot?.riskIndicators],
            ["Holdings Summary", r.clientSnapshot?.keyHoldings],
          ].map(([label, val]) => (
            <div key={label} style={label.length > 12 ? { gridColumn: "1 / -1" } : {}}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: STEEL, marginBottom: 3, fontWeight: 500 }}>
                {label}
              </div>
              <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6 }}>{val || "—"}</div>
            </div>
          ))}
        </div>
      </Section>

      <hr style={S.rule} />

      {/* ── RATIONALE ─────────────────────────────────────────────────────── */}
      <Section title="Rationale">
        <div style={{
          borderLeft: `2px solid ${GOLD}`,
          paddingLeft: 20,
          paddingTop: 4,
          paddingBottom: 4,
        }}>
          <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>
            {r.rationale}
          </p>
        </div>
      </Section>

      <hr style={S.rule} />

      {/* ── ADJUSTMENTS ───────────────────────────────────────────────────── */}
      {r.adjustments?.length > 0 && (
        <>
          <Section title="Client-Specific Adjustments">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {r.adjustments.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{
                    color: GOLD,
                    fontSize: 10,
                    marginTop: 4,
                    flexShrink: 0,
                    letterSpacing: 1,
                  }}>◆</span>
                  <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.7 }}>{a}</span>
                </div>
              ))}
            </div>
          </Section>
          <hr style={S.rule} />
        </>
      )}

      {/* ── TALKING POINTS ────────────────────────────────────────────────── */}
      {r.talkingPoints?.length > 0 && (
        <>
          <Section title="Meeting Talking Points">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {r.talkingPoints.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: STEEL,
                    flexShrink: 0,
                    width: 18,
                    fontVariantNumeric: "tabular-nums",
                    marginTop: 2,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.7 }}>{t}</span>
                </div>
              ))}
            </div>
          </Section>
          <hr style={S.rule} />
        </>
      )}

      {/* ── FLAGS ─────────────────────────────────────────────────────────── */}
      {r.flags?.length > 0 && (
        <>
          <div style={{
            background: "#FFF8F0",
            border: `1px solid rgba(196,153,42,0.3)`,
            borderLeft: `3px solid ${GOLD}`,
            padding: "20px 24px",
            marginBottom: 8,
          }}>
            <div style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "#8B6914",
              fontWeight: 600,
              marginBottom: 14,
            }}>
              ⚑ Address First — Advisor Rules
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {r.flags.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#8B4513", fontSize: 10, flexShrink: 0, marginTop: 3 }}>●</span>
                  <span style={{ fontSize: 13, color: "#4A3020", lineHeight: 1.7 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <hr style={S.rule} />
        </>
      )}

      {/* ── ACTIONS ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
        <ActionBtn onClick={handleCopy} primary>
          {copied ? "✓ Copied" : "Copy to Clipboard"}
        </ActionBtn>
        <ActionBtn onClick={handleExportPdf} disabled={exportingPdf}>
          {exportingPdf ? "Generating…" : "Export PDF"}
        </ActionBtn>
        <ActionBtn onClick={onNewAnalysis}>
          New Analysis
        </ActionBtn>
      </div>

      {/* Disclaimer */}
      <p style={{
        fontSize: 10,
        color: "#B0A898",
        lineHeight: 1.8,
        borderTop: `1px solid ${BORDER}`,
        paddingTop: 16,
        letterSpacing: 0.3,
      }}>
        F.A.S.T. output is a decision-support draft generated from stored advisor preferences.
        Verify all extracted data and apply professional judgment before any client use.
        Not a substitute for licensed advisor analysis or regulatory compliance review.
      </p>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PageHeader({ title }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: 3,
        color: STEEL,
        marginBottom: 8,
        fontWeight: 500,
      }}>
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

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: 2.5,
        color: STEEL,
        fontWeight: 600,
        marginBottom: 14,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, children, primary, disabled }) {
  const [hover, setHover] = useState(false);
  const base = {
    padding: "10px 22px",
    border: `1px solid ${primary ? "#C4992A" : "#C5BDB0"}`,
    background: primary && hover ? "#C4992A" : "transparent",
    color: primary ? (hover ? "#06101D" : "#C4992A") : "#4A5A6A",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    cursor: disabled ? "wait" : "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
    opacity: disabled ? 0.5 : 1,
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={base}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
}
