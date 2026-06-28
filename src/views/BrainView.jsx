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

const ANNUITY_STRATEGY_NAMES = [
  "S&P 500 Cap",
  "S&P 500 Flat",
  "Russell 2000 Cap",
  "Russell 2000 Flat",
  "Fixed Account",
];

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
  annuityRates: {
    product: "NYL IndexFlex",
    lastUpdated: "June 2026",
    suitabilityNotes: "Appropriate for clients within 10 years of retirement seeking guaranteed income layer. Minimum $100k. 5-year surrender. IRA rollover eligible.",
    defaultAllocation: "30% American Funds IS Growth (variable) / 20% S&P 500 Index (variable) / remainder across index-linked strategies",
    strategies: [
      { name: "S&P 500 Cap",       standard: "8.50%",  enhanced: "10.50%" },
      { name: "S&P 500 Flat",      standard: "7.50%",  enhanced: "9.00%"  },
      { name: "Russell 2000 Cap",  standard: "9.25%",  enhanced: "11.25%" },
      { name: "Russell 2000 Flat", standard: "8.25%",  enhanced: "9.75%"  },
      { name: "Fixed Account",     standard: "2.90%",  enhanced: ""       },
    ],
  },
};

const EMPTY_BRAIN = {
  advisorName: "",
  firm: "",
  preferences: "",
  models: MODEL_LETTERS.map(emptyModel),
  annuityRates: {
    product: "NYL IndexFlex",
    lastUpdated: "",
    suitabilityNotes: "",
    defaultAllocation: "",
    strategies: ANNUITY_STRATEGY_NAMES.map((name) => ({ name, standard: "", enhanced: "" })),
  },
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
  const [brain, setBrain]         = useState(EMPTY_BRAIN);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [focusField, setFocusField] = useState(null);

  useEffect(() => {
    const stored = loadBrain();
    if (stored) {
      // Backwards-compat: add annuityRates if stored brain predates v2
      if (!stored.annuityRates) {
        stored.annuityRates = EMPTY_BRAIN.annuityRates;
      }
      setBrain(stored);
    }
  }, []);

  function updateModel(i, field, value) {
    const models = brain.models.map((m, idx) => (idx === i ? { ...m, [field]: value } : m));
    setBrain((b) => ({ ...b, models }));
  }

  function updateAnnuityField(field, value) {
    setBrain((b) => ({
      ...b,
      annuityRates: { ...b.annuityRates, [field]: value },
    }));
  }

  function updateAnnuityRate(i, field, value) {
    const strategies = (brain.annuityRates?.strategies || []).map((s, idx) =>
      idx === i ? { ...s, [field]: value } : s
    );
    setBrain((b) => ({
      ...b,
      annuityRates: { ...b.annuityRates, strategies },
    }));
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
        <Field label="Advisor Name">
          <input
            style={{ ...inputStyle, borderColor: focusField === "name" ? GOLD : BORDER }}
            value={brain.advisorName}
            onChange={(e) => setBrain((b) => ({ ...b, advisorName: e.target.value }))}
            onFocus={() => setFocusField("name")}
            onBlur={() => setFocusField(null)}
            placeholder="Mathew Steward"
          />
        </Field>
        <Field label="Firm">
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

      {/* ── NYL IndexFlex Rate Management ────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
          <SectionLabel>Annuity Strategy — NYL IndexFlex Rates</SectionLabel>
          <span style={{
            fontSize: 8,
            textTransform: "uppercase",
            letterSpacing: 2,
            color: GOLD,
            fontWeight: 600,
            border: `1px solid rgba(196,153,42,0.3)`,
            padding: "2px 8px",
            marginBottom: 12,
            display: "inline-block",
          }}>
            Update Weekly
          </span>
        </div>

        <p style={{ fontSize: 12, color: MUTED, marginBottom: 18, lineHeight: 1.7 }}>
          NYL updates cap and flat rates weekly. Update this table each time you receive the PDF.
          These rates are injected into the AI when a client requests guarantees.
        </p>

        <div style={{
          border: `1px solid ${BORDER}`,
          background: "#FDFAF5",
        }}>
          {/* Rate table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 130px 130px",
            gap: 0,
            borderBottom: `1px solid ${BORDER}`,
            background: DARK,
            padding: "10px 20px",
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#8A9BAD" }}>
              Strategy
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#8A9BAD" }}>
              Standard Rate
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: GOLD }}>
              Enhanced Rate
            </div>
          </div>

          {/* Rate rows */}
          {(brain.annuityRates?.strategies || []).map((s, i) => (
            <div
              key={s.name}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 130px 130px",
                gap: 0,
                borderBottom: i < (brain.annuityRates.strategies.length - 1) ? `1px solid ${BORDER}` : "none",
                alignItems: "center",
              }}
            >
              <div style={{
                padding: "12px 20px",
                fontSize: 12,
                fontWeight: 600,
                color: TEXT,
                letterSpacing: 0.3,
              }}>
                {s.name}
              </div>
              <div style={{ padding: "8px 12px 8px 0" }}>
                <input
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: `1px solid ${BORDER}`,
                    padding: "6px 10px",
                    fontSize: 13,
                    color: TEXT,
                    outline: "none",
                    fontFamily: "inherit",
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                  value={s.standard}
                  onChange={(e) => updateAnnuityRate(i, "standard", e.target.value)}
                  placeholder="0.00%"
                />
              </div>
              <div style={{ padding: "8px 20px 8px 0" }}>
                <input
                  style={{
                    width: "100%",
                    background: s.name === "Fixed Account" ? "transparent" : "rgba(196,153,42,0.04)",
                    border: `1px solid ${s.name === "Fixed Account" ? "#E0DDD8" : "rgba(196,153,42,0.25)"}`,
                    padding: "6px 10px",
                    fontSize: 13,
                    color: GOLD,
                    outline: "none",
                    fontFamily: "inherit",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                  value={s.enhanced}
                  onChange={(e) => updateAnnuityRate(i, "enhanced", e.target.value)}
                  placeholder={s.name === "Fixed Account" ? "N/A" : "0.00%"}
                  disabled={s.name === "Fixed Account"}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Metadata row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <Field label="Last Updated (e.g. June 27, 2026)">
            <input
              style={{ ...inputStyle, fontSize: 12 }}
              value={brain.annuityRates?.lastUpdated || ""}
              onChange={(e) => updateAnnuityField("lastUpdated", e.target.value)}
              placeholder="June 2026"
            />
          </Field>
          <Field label="Product Name">
            <input
              style={{ ...inputStyle, fontSize: 12 }}
              value={brain.annuityRates?.product || ""}
              onChange={(e) => updateAnnuityField("product", e.target.value)}
              placeholder="NYL IndexFlex"
            />
          </Field>
        </div>

        <div style={{ marginTop: 16 }}>
          <Field label="Suitability Notes (injected into AI when annuity gate is triggered)">
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: "vertical", fontSize: 12 }}
              value={brain.annuityRates?.suitabilityNotes || ""}
              onChange={(e) => updateAnnuityField("suitabilityNotes", e.target.value)}
              placeholder="Appropriate for clients within 10 years of retirement…"
            />
          </Field>
        </div>

        <div style={{ marginTop: 16 }}>
          <Field label="Default Allocation Approach">
            <input
              style={{ ...inputStyle, fontSize: 12 }}
              value={brain.annuityRates?.defaultAllocation || ""}
              onChange={(e) => updateAnnuityField("defaultAllocation", e.target.value)}
              placeholder="30% American Funds IS Growth / 20% S&P 500 Index / split index strategies…"
            />
          </Field>
        </div>
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
              ["Risk Profile",      "riskProfile", "Moderate, 7+ yr horizon"],
              ["Target Allocation", "allocation",  "50% equity, 30% bonds…"],
              ["When to Use",       "whenToUse",   "Mid-career accumulators…"],
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
