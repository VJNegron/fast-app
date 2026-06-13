import { useState } from "react";
import BrainView from "../views/BrainView";
import AnalyzeView from "../views/AnalyzeView";
import OutputView from "../views/OutputView";

const NAVY = "#0D1B2A";
const GOLD = "#C9A84C";

const NAV_ITEMS = [
  { id: "analyze", label: "New Client Analysis", sub: "Upload PDF → recommendation" },
  { id: "output", label: "Recommendation", sub: "Latest analysis result" },
  { id: "brain", label: "The Advisor Brain", sub: "Your preferences & models A–E" },
];

function NavItem({ id, label, sub, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`fast-nav-item ${active ? "active" : ""}`}
    >
      <span className="fast-nav-label">{label}</span>
      <span className="fast-nav-sub">{sub}</span>
    </button>
  );
}

export default function Shell({ onLogout }) {
  const [view, setView] = useState("analyze");
  const [result, setResult] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  function navigate(id) {
    setView(id);
    setNavOpen(false);
  }

  function handleResult(r) {
    setResult(r);
    setView("output");
  }

  function handleNewAnalysis() {
    setResult(null);
    setView("analyze");
  }

  return (
    <>
      <style>{`
        .fast-shell {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: white;
        }

        /* ── Sidebar ────────────────────────────────── */
        .fast-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: ${NAVY};
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: transform 0.25s ease;
        }

        .fast-sidebar-wordmark {
          padding: 28px 20px 22px;
          border-bottom: 1px solid rgba(201,168,76,0.2);
        }

        .fast-wordmark-text {
          font-family: 'Playfair Display', Georgia, serif;
          color: ${GOLD};
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .fast-wordmark-sub {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #8A93A3;
          margin-top: 6px;
          line-height: 1.6;
        }

        nav.fast-nav {
          margin-top: 12px;
          flex: 1;
        }

        .fast-nav-item {
          display: flex;
          flex-direction: column;
          width: 100%;
          text-align: left;
          padding: 16px 20px;
          background: transparent;
          border: none;
          border-left: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .fast-nav-item.active {
          background: rgba(201,168,76,0.08);
          border-left-color: ${GOLD};
        }
        .fast-nav-label {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: #C9CED6;
        }
        .fast-nav-item.active .fast-nav-label { color: ${GOLD}; }
        .fast-nav-sub {
          font-size: 11px;
          margin-top: 2px;
          color: #6B7686;
        }

        .fast-sidebar-footer {
          padding: 16px 20px;
          border-top: 1px solid rgba(201,168,76,0.2);
          font-size: 10px;
          color: #6B7686;
          line-height: 1.8;
        }
        .fast-sidebar-footer .credit-accent { color: ${GOLD}; }
        .fast-signout {
          display: block;
          margin-top: 10px;
          font-size: 11px;
          color: #6B7686;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          font-family: inherit;
        }

        /* ── Main ───────────────────────────────────── */
        .fast-main {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .fast-content {
          max-width: 780px;
          margin: 0 auto;
          padding: 40px 32px;
          width: 100%;
        }

        /* ── Mobile header bar ──────────────────────── */
        .fast-mobile-bar {
          display: none;
          background: ${NAVY};
          padding: 12px 16px;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(201,168,76,0.2);
          flex-shrink: 0;
        }
        .fast-hamburger {
          background: transparent;
          border: none;
          cursor: pointer;
          color: ${GOLD};
          font-size: 20px;
          line-height: 1;
          padding: 4px;
          font-family: inherit;
          width: 32px;
        }
        .fast-mobile-wordmark {
          font-family: 'Playfair Display', Georgia, serif;
          color: ${GOLD};
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        /* ── Overlay ────────────────────────────────── */
        .fast-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 40;
        }
        .fast-overlay.visible { display: block; }

        /* ── Mobile breakpoint ──────────────────────── */
        @media (max-width: 767px) {
          .fast-mobile-bar { display: flex; }
          .fast-sidebar {
            position: fixed;
            z-index: 50;
            top: 0;
            left: 0;
            height: 100vh;
            transform: translateX(-100%);
          }
          .fast-sidebar.open { transform: translateX(0); }
          .fast-content { padding: 24px 16px; }
        }
      `}</style>

      <div className="fast-shell">
        {/* Sidebar */}
        <div className={`fast-sidebar ${navOpen ? "open" : ""}`}>
          <div className="fast-sidebar-wordmark">
            <div className="fast-wordmark-text">F.A.S.T.</div>
            <div className="fast-wordmark-sub">
              Financial Advisory
              <br />
              Steward Technology
            </div>
          </div>
          <nav className="fast-nav">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.id}
                {...item}
                active={view === item.id}
                onClick={navigate}
              />
            ))}
          </nav>
          <div className="fast-sidebar-footer">
            Built by Vicron A.I. Consulting
            <br />
            <span className="credit-accent">Bridging the Gap</span>
            <button className="fast-signout" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile nav overlay */}
        <div
          className={`fast-overlay ${navOpen ? "visible" : ""}`}
          onClick={() => setNavOpen(false)}
        />

        {/* Main content area */}
        <div className="fast-main">
          {/* Mobile top bar */}
          <div className="fast-mobile-bar">
            <button
              className="fast-hamburger"
              onClick={() => setNavOpen((o) => !o)}
              aria-label="Toggle navigation"
            >
              {navOpen ? "✕" : "☰"}
            </button>
            <div className="fast-mobile-wordmark">F.A.S.T.</div>
            <div style={{ width: 32 }} />
          </div>

          <div className="fast-content">
            {view === "brain" && <BrainView />}
            {view === "analyze" && <AnalyzeView onResult={handleResult} />}
            {view === "output" && (
              <OutputView result={result} onNewAnalysis={handleNewAnalysis} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
