import { useState, useEffect } from "react";
import { loadBrain, saveBrain } from "../lib/storage";

// ── Wall Street brand tokens ──────────────────────────────────────────────────
const DARK   = "#06101D";
const NAVY   = "#0D1825";
const GOLD   = "#C4992A";
const STEEL  = "#5C6E7E";
const CREAM  = "#F5F1E8";
const BORDER = "#DDD5C5";
const TEXT   = "#1A2438";
const MUTED  = "#6B7A8A";

const MODEL_LETTERS = ["A", "B", "C", "D", "E"];

const emptyModel = (letter) => ({ letter, name: "", riskProfile: "", allocation: "", whenToUse: "" });

const SAMPLE_BRAIN = {
  advisorName: "Mathew Steward",
  firm: "Stewardship Financial Group",
  preferences:
    "I lead with protection before accumulation — disability and life insurance gaps get addressed before investment recommendations. For retirement accounts I favor managed portfolios over self-directed. I prefer American Funds and Fidelity fund families for mutual fund recommendations. Annuities are appropriate for clients within 10 years of retirement seeking guaranteed income. I avoid recommending individual securities to clients under $250k in investable assets. Cash flow drives everything — if the client's cash flow picture is unclear, flag it before making any recommendation.",
  models: [
    { letter: "A", name: "Capital Preservation", riskProfile: "Conservative — low volatility tolerance, capital protection first", allocation: "40% bonds, 25% money market, 20% conservative allocation funds, 15% fixed annuity", whenToUse: "Clients within 5 years of retirement, low risk tolerance, or primary goal is preserving what they have" },
    { letter: "B", name: "Income Focus", riskProfile: "Moderately conservative — steady income with modest growth", allocation: "35% bond funds, 30% dividend equity funds, 20% balanced funds, 15% income annuity", whenToUse: "Retirees or near-retirees needing reliable income streams from their portfolio" },
    { letter: "C", name: "Balanced Growth", riskProfile: "Moderate — comfortable with market cycles, 7+ year horizon", allocation: "50% equity funds (American Funds Growth/Income mix), 30% bond funds, 15% international, 5% cash", whenToUse: "Mid-career accumulators with stable income and balanced goals — my default for most 40-55 year olds" },
    { letter: "D", name: "Growth", riskProfile: "Moderately aggressive — growth-first, 10+ year horizon", allocation: "70% equity funds, 15% international equity, 10% bond funds, 5% cash", whenToUse: "Younger clients or high earners maximizing long-term accumulation, comfortable with volatility" },
    { letter: "E", name: "Maximum Accumulation", riskProfile: "Aggressive — maximum growth, volatility accepted", allocation: "85% equity funds (growth tilt), 15% international/emerging markets", whenToUse: "Clients under 40 with long horizons, strong cash flow, fully funded protection, and high risk tolerance" },
  ],
};

const EMPTY_BRAIN = {
  advisorName: "",
  firm: "",
  preferences: "",
  models: MODEL_LETTERS.map(emptyModel),
};

// Shared input style
const inputStyle = {
  width: "100%",
  background: "#FDFAF5",
  border: `1px solid ${BORDER}`,
  padding: "10px 14px",
  fontSize: 13,
  color: TEXT,
  outline: "none",
  fontFamily: "inherit",
  letterSpacing: 0.2,
  transition: "border-color 0.15s",
};

const labelStyle = {
  display: "block",
  fontSize: 9,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: STEEL,
  marginBottom: 6,
};

export default function BrainView() {
  const [brain, setBrain]       = useState(EMPTY_BRAIN);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [focusField, setFocusField] = useState(null);

  useEffect(() => {
    const stored = loadBrain();
    if (stored) setBrain(stored);
  }, []);

  function updateModel(i, field, value) {
    const models = brain.models.map((m, idx) => (idx === i ? { ...m, [field]: value } : m));
    setBrain((b) => ({ ...b, models }));
  }

  function handleSave() {
    setSaveState("saving");
    const ok = saveBrain(brain);
    if (ok) {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } else {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  function handleLoadSample() {
    setBrain(SAMPLE_BRAIN);
    saveBrain(SAMPLE_BRAIN);
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }

  const brainComplete =
    brain.preferences.trim().length > 0 && brain.models.some((m) => m.name.trim().length > 0);

  const saveLabel =
    saveState === "saving"  ? "Saving…" :
    saveState === "saved"   ? "✓ Preferences Saved" :
    saveState === "error"   ? "Save failed — try again" :
    "Save Advisor Brain";

  return (
    <div>
      <PageHeader title="The Advisor Brain" />

      <p style={{ fontSize: 13, color: MUTED, marginBottom: 32, lineHeight: 1.8, maxWidth: 580 }}>
        This is the engine. Everything entered here becomes the logic behind every recommendation.
        Set it up once — refine it as your thinking evolves.
      </p>

      {/* ── Advisor Identity ───────────────────────────────────────────────── */}
      <SectionLabel>Advisor Identity</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        <Field label="Advisor Name" focusKey="name" focusField={focusField} setFocusField={setFocusField}>
          <input
            style={{ ...inputStyle, borderColor: focusField === "name" ? GOLD : BORDER }}
            value={brain.advisorName}
            onChange={(e) => setBrain((b) => ({ ...b, advisorName: e.target.value }))}
            onFocus={() => setFocusField("name")}
            onBlur={() => setFocusField(null)}
            placeholder="Mathew Steward"
          />
        </Field>
        <Field label="Firm" focusKey="firm" focusField={focusField} setFocusField={setFocusField}>
          <input
            style={{ ...inputStyle, borderColor: focusField === "firm" ? GOLD : BORDER }}
            value={brain.firm}
            onChange={(e) => setBrain((b) => ({ ...b, firm: e.target.value }))}
            onFocus={() => setFocusField("firm")}
            onBlur={() => setFocusField(null)}
            placeholder="Stewardship Financial Group"
          />
        </Field>
      </div>

      {/* ── Preferences ───────────────────────────────────────────────────── */}
      <SectionLabel>Preferences, Biases & Default Plays</SectionLabel>
      <p style={{ fontSize: 12, color: MUTED, marginBottom: 10, lineHeight: 1.7 }}>
        Your "pool of likies" — fund families you favor, protection-first rules, when annuities
        make sense, what you avoid, what drives your thinking.
      </p>
      <textarea
        style={{
          ...inputStyle,
          minHeight: 140,
          resize: "vertical",
          borderColor: focusField === "prefs" ? GOLD : BORDER,
        }}
        value={brain.preferences}
        onChange={(e) => setBrain((b) => ({ ...b, preferences: e.target.value }))}
        onFocus={() => setFocusField("prefs")}
        onBlur={() => setFocusField(null)}
        placeholder="I lead with protection before accumulation…"
      />

      {/* ── Model Portfolios ───────────────────────────────────────────────── */}
      <div style={{ marginTop: 36, marginBottom: 12 }}>
        <SectionLabel>Model Portfolios A–E</SectionLabel>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 36 }}>
        {brain.models.map((m, i) => (
          <ModelCard key={m.letter} m={m} i={i} onUpdate={updateModel} />
        ))}
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, borderTop: `1px solid ${BORDER}`, paddingTop: 24 }}>
        <ActionBtn onClick={handleSave} primary error={saveState === "error"}>
          {saveLabel}
        </ActionBtn>

        <ActionBtn onClick={handleLoadSample}>
          Load sample (demo)
        </ActionBtn>

        {brainComplete && (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "#3A7A5A",
          }}>
            ● Engine active
          </span>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ModelCard({ m, i, onUpdate }) {
  const [expanded, setExpanded] = useState(true);
  const hasContent = m.name.trim().length > 0;

  return (
    <div style={{
      border: `1px solid ${hasContent ? BORDER : "#E8E4DC"}`,
      borderLeft: `3px solid ${hasContent ? GOLD : "#D5CFCA"}`,
      background: hasContent ? "#FDFAF5" : "#FAF8F4",
      transition: "all 0.15s",
    }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 20px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Letter badge */}
        <div style={{
          width: 36,
          height: 36,
          background: hasContent ? DARK : "#E8E4DC",
          border: hasContent ? `1px solid #1A2B3C` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            fontWeight: 700,
            color: hasContent ? GOLD : STEEL,
            lineHeight: 1,
          }}>
            {m.letter}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: hasContent ? TEXT : MUTED,
            fontFamily: hasContent ? "'Playfair Display', serif" : "inherit",
          }}>
            {m.name || `Model ${m.letter} — not configured`}
          </div>
          {hasContent && m.riskProfile && (
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{m.riskProfile}</div>
          )}
        </div>

        <div style={{ fontSize: 14, color: STEEL, flexShrink: 0 }}>
          {expanded ? "▴" : "▾"}
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Name */}
          <div>
            <div style={labelStyle}>Portfolio Name</div>
            <input
              style={{
                ...inputStyleNoRadius,
                borderBottom: "1px solid #D8D4CC",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                background: "transparent",
                padding: "6px 4px",
                fontWeight: 600,
                color: TEXT,
              }}
              value={m.name}
              onChange={(e) => onUpdate(i, "name", e.target.value)}
              placeholder={`Model ${m.letter} name (e.g., Balanced Growth)`}
            />
          </div>

          {/* Three fields */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
            {[
              ["Risk Profile",        "riskProfile", "Moderate, 7+ yr horizon"],
              ["Target Allocation",   "allocation",  "50% equity, 30% bonds…"],
              ["When to Use",        "whenToUse",   "Mid-career accumulators…"],
            ].map(([label, field, ph]) => (
              <div key={field}>
                <div style={labelStyle}>{label}</div>
                <input
                  style={{ ...inputStyleNoRadius, border: `1px solid ${BORDER}`, background: "#FAF8F4" }}
                  value={m[field]}
                  onChange={(e) => onUpdate(i, field, e.target.value)}
                  placeholder={ph}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyleNoRadius = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 12,
  color: TEXT,
  outline: "none",
  fontFamily: "inherit",
  letterSpacing: 0.2,
};

function PageHeader({ title }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 3, color: STEEL, marginBottom: 8, fontWeight: 500 }}>
        F.A.S.T. · Financial Advisory Steward Technology
      </div>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        color: TEXT,
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

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: 2.5,
      color: STEEL,
      fontWeight: 600,
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, children, primary, error, disabled }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 22px",
        border: `1px solid ${error ? "#8B3A3A" : primary ? GOLD : "#C5BDB0"}`,
        background: primary && hover ? GOLD : "transparent",
        color: error ? "#8B3A3A" : primary ? (hover ? DARK : GOLD) : "#4A5A6A",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        cursor: disabled ? "wait" : "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
}
