import { useMemo, useState } from "react";
import { loadAnalysisHistory } from "../lib/storage";

const GOLD   = "#C6B159";
const STEEL  = "#5F6285";
const BORDER = "#DDD5C5";
const TEXT   = "#1A2438";
const MUTED  = "#6B7A8A";
const DARK   = "#1B1A33";

export default function HistoryView({ onOpenAnalysis, onNewAnalysis }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const analyses = useMemo(() => loadAnalysisHistory(), [refreshKey]);

  return (
    <div>
      <PageHeader title="Client Analysis History" />
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 28, lineHeight: 1.8, maxWidth: 620 }}>
        Recently generated F.A.S.T. recommendations are saved here on this device so Mathew can reopen prior client work instead of starting from scratch.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <ActionBtn onClick={onNewAnalysis} primary>New Analysis</ActionBtn>
        <ActionBtn onClick={() => setRefreshKey((n) => n + 1)}>Refresh</ActionBtn>
      </div>

      {!analyses.length ? (
        <div style={{ border: `1px solid ${BORDER}`, background: "#FAF8F4", padding: "28px 24px", color: MUTED, fontSize: 13, lineHeight: 1.8 }}>
          No saved client analyses yet. Run a client document through <strong style={{ color: TEXT }}>New Client Analysis</strong> and it will appear here automatically.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {analyses.map((item) => (
            <div key={item.id} style={{ border: `1px solid ${BORDER}`, background: "#FDFAF5", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", color: TEXT, fontSize: 18, fontWeight: 700 }}>
                    {item.clientName}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 4, lineHeight: 1.7 }}>
                    {new Date(item.savedAt).toLocaleString()} · Model {item.modelMatch} {item.modelName ? `— ${item.modelName}` : ""} · {item.confidence || "Confidence not stated"}
                    {item.hasAnnuity ? " · Annuity layer" : ""}
                  </div>
                  {!!item.documentNames?.length && (
                    <div style={{ fontSize: 10, color: STEEL, marginTop: 8, lineHeight: 1.6 }}>
                      Docs: {item.documentNames.join(" · ")}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onOpenAnalysis(item.result)}
                  style={{
                    border: `1px solid ${GOLD}`,
                    background: "transparent",
                    color: GOLD,
                    padding: "9px 14px",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageHeader({ title }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 3, color: STEEL, marginBottom: 8, fontWeight: 500 }}>
        F.A.S.T. · Financial Advisory Stewardship Technology
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: TEXT, fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: 0.3 }}>
        {title}
      </h2>
      <div style={{ height: 2, width: 40, background: GOLD, marginTop: 12, opacity: 0.7 }} />
    </div>
  );
}

function ActionBtn({ onClick, children, primary }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "10px 22px",
        border: `1px solid ${primary ? GOLD : "#C5BDB0"}`,
        background: primary && hover ? GOLD : "transparent",
        color: primary ? (hover ? DARK : GOLD) : "#6E6F92",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}
