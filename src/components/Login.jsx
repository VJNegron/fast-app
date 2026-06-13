import { useState } from "react";
import { login } from "../lib/api";

const NAVY = "#0D1B2A";
const GOLD = "#C9A84C";
const ACCENT = "#1A3A5C";

const fieldStyle = {
  width: "100%",
  border: "1px solid #D8DCE2",
  borderRadius: 6,
  padding: "10px 12px",
  fontSize: 14,
  color: NAVY,
  outline: "none",
  marginBottom: 16,
  fontFamily: "inherit",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: ACCENT,
  marginBottom: 6,
};

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      onLogin();
    } catch (err) {
      setError(err.message || "Incorrect username or password.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = username.trim() && password && !loading;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: NAVY,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div
          className="font-serif"
          style={{ color: GOLD, fontSize: 48, fontWeight: 700, letterSpacing: 3 }}
        >
          F.A.S.T.
        </div>
        <div
          style={{
            color: "#8A93A3",
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginTop: 8,
          }}
        >
          Financial Advisory Steward Technology
        </div>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          borderRadius: 12,
          padding: "40px 36px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        }}
      >
        <h2 className="font-serif" style={{ color: NAVY, fontSize: 20, marginBottom: 6 }}>
          Advisor Access
        </h2>
        <p style={{ color: "#6B7686", fontSize: 13, marginBottom: 28 }}>
          Sign in to access the engine.
        </p>

        {/* Username */}
        <label style={labelStyle}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="advisor"
          autoFocus
          autoComplete="username"
          style={{ ...fieldStyle, borderColor: error ? "#C0392B" : "#D8DCE2" }}
        />

        {/* Password */}
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          style={{ ...fieldStyle, borderColor: error ? "#C0392B" : "#D8DCE2", marginBottom: 8 }}
        />

        {error && (
          <div
            style={{
              color: "#C0392B",
              fontSize: 13,
              marginBottom: 16,
              padding: "8px 12px",
              background: "#FFF5F5",
              border: "1px solid #FFCDD2",
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            width: "100%",
            background: !canSubmit ? "#9AA3AF" : NAVY,
            color: GOLD,
            border: "none",
            borderRadius: 6,
            padding: "12px",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 0.5,
            cursor: !canSubmit ? "not-allowed" : "pointer",
            marginTop: 8,
            fontFamily: "inherit",
          }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {/* Footer credit */}
      <div
        style={{
          marginTop: 48,
          fontSize: 11,
          color: "#3A4455",
          textAlign: "center",
          lineHeight: 1.8,
        }}
      >
        Built by Vicron A.I. Consulting
        <br />
        <span style={{ color: GOLD }}>Bridging the Gap</span>
      </div>
    </div>
  );
}
