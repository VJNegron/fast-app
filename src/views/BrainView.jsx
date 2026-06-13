import { useState, useEffect } from "react";
import { loadBrain, saveBrain } from "../lib/storage";

const NAVY = "#0D1B2A";
const GOLD = "#C9A84C";
const ACCENT = "#1A3A5C";
const CREAM = "#FFF8E7";

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

export default function BrainView() {
  const [brain, setBrain] = useState(EMPTY_BRAIN);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

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
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : saveState === "error" ? "Save failed — try again" : "Save Advisor Brain";

  return (
    <div>
      {/* Section heading */}
      <div style={{ marginBottom: 20 }}>
        <h2 className="font-serif" style={{ color: NAVY, fontSize: 26 }}>
          The Advisor Brain
        </h2>
        <div style={{ height: 2, width: 56, background: GOLD, marginTop: 8 }} />
      </div>

      <p style={{ fontSize: 13, color: "#4A5568", marginBottom: 28, maxWidth: 600 }}>
        This is the engine. Everything entered here becomes the logic behind every recommendation.
        Set it up once, refine it as your thinking evolves.
      </p>

      {/* Advisor info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={labelCls}>Advisor name</label>
          <input
            style={inputCls}
            value={brain.advisorName}
            onChange={(e) => setBrain((b) => ({ ...b, advisorName: e.target.value }))}
            placeholder="Mathew Steward"
          />
        </div>
        <div>
          <label style={labelCls}>Firm</label>
          <input
            style={inputCls}
            value={brain.firm}
            onChange={(e) => setBrain((b) => ({ ...b, firm: e.target.value }))}
            placeholder="Stewardship Financial Group"
          />
        </div>
      </div>

      {/* Preferences */}
      <div style={{ marginBottom: 32 }}>
        <label style={labelCls}>Preferences, biases & default plays</label>
        <p style={{ fontSize: 12, color: "#6B7686", marginBottom: 8 }}>
          Your "pool of likies" — fund families you favor, protection-first rules, when annuities
          make sense, what you avoid, what drives your thinking.
        </p>
        <textarea
          style={{ ...inputCls, minHeight: 140, resize: "vertical" }}
          value={brain.preferences}
          onChange={(e) => setBrain((b) => ({ ...b, preferences: e.target.value }))}
          placeholder="I lead with protection before accumulation…"
        />
      </div>

      {/* Model portfolios */}
      <h3 className="font-serif" style={{ color: NAVY, fontSize: 18, marginBottom: 12 }}>
        Model Portfolios A–E
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {brain.models.map((m, i) => (
          <div
            key={m.letter}
            style={{
              border: `1px solid ${m.name ? GOLD : "#E2E6EB"}`,
              borderRadius: 8,
              padding: "16px",
              background: m.name ? CREAM : "white",
            }}
          >
            {/* Letter badge + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: NAVY,
                  color: GOLD,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {m.letter}
              </div>
              <input
                style={{
                  flex: 1,
                  borderBottom: "1px solid #D8DCE2",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  background: "transparent",
                  padding: "4px 4px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: NAVY,
                  outline: "none",
                  fontFamily: "inherit",
                }}
                value={m.name}
                onChange={(e) => updateModel(i, "name", e.target.value)}
                placeholder={`Model ${m.letter} name (e.g., Balanced Growth)`}
              />
            </div>

            {/* Three fields */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <div>
                <label style={{ ...labelCls, fontSize: 10 }}>Risk profile</label>
                <input
                  style={inputCls}
                  value={m.riskProfile}
                  onChange={(e) => updateModel(i, "riskProfile", e.target.value)}
                  placeholder="Moderate, 7+ yr horizon"
                />
              </div>
              <div>
                <label style={{ ...labelCls, fontSize: 10 }}>Target allocation</label>
                <input
                  style={inputCls}
                  value={m.allocation}
                  onChange={(e) => updateModel(i, "allocation", e.target.value)}
                  placeholder="50% equity, 30% bonds…"
                />
              </div>
              <div>
                <label style={{ ...labelCls, fontSize: 10 }}>When to use</label>
                <input
                  style={inputCls}
                  value={m.whenToUse}
                  onChange={(e) => updateModel(i, "whenToUse", e.target.value)}
                  placeholder="Mid-career accumulators…"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <button
          onClick={handleSave}
          style={{
            padding: "10px 24px",
            borderRadius: 6,
            border: "none",
            background: saveState === "error" ? "#C0392B" : NAVY,
            color: GOLD,
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: 0.4,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {saveLabel}
        </button>

        <button
          onClick={handleLoadSample}
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            border: `1px solid ${GOLD}`,
            background: "transparent",
            color: ACCENT,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Load sample brain (demo)
        </button>

        {brainComplete && (
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1A7A4A" }}>
            ● Brain active — engine ready
          </span>
        )}
      </div>
    </div>
  );
}
