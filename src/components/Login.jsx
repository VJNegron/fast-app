import { useState } from "react";
import { login } from "../lib/api";

// ── Wall Street brand tokens ──────────────────────────────────────────────────
const DARK    = "#06101D";
const NAVY    = "#0D1B2A";
const GOLD    = "#C4992A";
const STEEL   = "#5C6E7E";
const CREAM   = "#F5F1E8";
const BORDER  = "#1E2E3E";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      onLogin();
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = username.trim() && password && !loading;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

        .fast-login-root {
          min-height: 100vh;
          background: ${DARK};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Subtle grid overlay */
        .fast-login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(196,153,42,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(196,153,42,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .fast-login-wordmark {
          text-align: center;
          margin-bottom: 48px;
          position: relative;
          z-index: 1;
        }
        .fast-login-wordmark-text {
          font-family: 'Playfair Display', serif;
          color: ${GOLD};
          font-size: 52px;
          font-weight: 700;
          letter-spacing: 8px;
          line-height: 1;
        }
        .fast-login-wordmark-rule {
          width: 48px;
          height: 1px;
          background: ${GOLD};
          margin: 14px auto 12px;
          opacity: 0.6;
        }
        .fast-login-wordmark-sub {
          color: ${STEEL};
          font-size: 9px;
          letter-spacing: 4px;
          text-transform: uppercase;
          font-weight: 500;
        }

        .fast-login-card {
          background: #0D1825;
          border: 1px solid ${BORDER};
          width: 100%;
          max-width: 360px;
          padding: 40px 36px;
          position: relative;
          z-index: 1;
        }

        /* Corner accents */
        .fast-login-card::before,
        .fast-login-card::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          border-color: ${GOLD};
          border-style: solid;
          opacity: 0.5;
        }
        .fast-login-card::before {
          top: -1px; left: -1px;
          border-width: 1px 0 0 1px;
        }
        .fast-login-card::after {
          bottom: -1px; right: -1px;
          border-width: 0 1px 1px 0;
        }

        .fast-login-heading {
          font-family: 'Playfair Display', serif;
          color: #E8E2D9;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
          letter-spacing: 0.3px;
        }
        .fast-login-sub {
          color: ${STEEL};
          font-size: 12px;
          margin-bottom: 32px;
          letter-spacing: 0.2px;
        }

        .fast-login-label {
          display: block;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: ${STEEL};
          margin-bottom: 6px;
        }
        .fast-login-input {
          width: 100%;
          background: #06101D;
          border: 1px solid ${BORDER};
          padding: 11px 14px;
          font-size: 13px;
          color: #E8E2D9;
          outline: none;
          margin-bottom: 20px;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.3px;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .fast-login-input:focus {
          border-color: ${GOLD};
        }
        .fast-login-input.error {
          border-color: #8B3A3A;
        }
        .fast-login-input::placeholder {
          color: #2A3D50;
        }

        .fast-login-error {
          font-size: 12px;
          color: #C0736A;
          background: rgba(139,58,58,0.1);
          border: 1px solid rgba(139,58,58,0.3);
          padding: 8px 12px;
          margin-bottom: 16px;
          letter-spacing: 0.2px;
        }

        .fast-login-btn {
          width: 100%;
          background: transparent;
          border: 1px solid ${GOLD};
          color: ${GOLD};
          padding: 12px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          margin-top: 4px;
        }
        .fast-login-btn:hover:not(:disabled) {
          background: ${GOLD};
          color: ${DARK};
        }
        .fast-login-btn:disabled {
          border-color: #2A3D50;
          color: #2A3D50;
          cursor: not-allowed;
        }

        .fast-login-footer {
          margin-top: 48px;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .fast-login-footer-text {
          font-size: 10px;
          color: #1E2E3E;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .fast-login-footer-accent {
          color: rgba(196,153,42,0.4);
        }
      `}</style>

      <div className="fast-login-root">
        <div className="fast-login-wordmark">
          <div className="fast-login-wordmark-text">F.A.S.T.</div>
          <div className="fast-login-wordmark-rule" />
          <div className="fast-login-wordmark-sub">Financial Advisory Stewardship Technology</div>
        </div>

        <form className="fast-login-card" onSubmit={handleSubmit}>
          <div className="fast-login-heading">Secure Access</div>
          <div className="fast-login-sub">Authorized personnel only</div>

          <label className="fast-login-label">Username</label>
          <input
            className={`fast-login-input${error ? " error" : ""}`}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            autoFocus
            autoComplete="username"
          />

          <label className="fast-login-label">Password</label>
          <input
            className={`fast-login-input${error ? " error" : ""}`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{ marginBottom: error ? 8 : 4 }}
          />

          {error && <div className="fast-login-error">{error}</div>}

          <button className="fast-login-btn" type="submit" disabled={!canSubmit}>
            {loading ? "Authenticating…" : "Access System"}
          </button>
        </form>

        <div className="fast-login-footer">
          <div className="fast-login-footer-text">
            Built by Vicron A.I. Consulting &nbsp;·&nbsp;{" "}
            <span className="fast-login-footer-accent">Bridging the Gap</span>
          </div>
        </div>
      </div>
    </>
  );
}
