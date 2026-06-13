import { useState } from "react";
import BrainView from "../views/BrainView";
import AnalyzeView from "../views/AnalyzeView";
import OutputView from "../views/OutputView";

// ── Wall Street brand tokens ──────────────────────────────────────────────────
const DARK   = "#06101D";
const NAVY   = "#0D1825";
const GOLD   = "#C4992A";
const STEEL  = "#5C6E7E";
const CREAM  = "#F5F1E8";
const BORDER = "#1A2B3C";

const NAV_ITEMS = [
  { id: "analyze", label: "New Client Analysis", sub: "Upload PDF · Generate recommendation" },
  { id: "output",  label: "Recommendation",      sub: "Latest analysis result" },
  { id: "brain",   label: "The Advisor Brain",   sub: "Preferences · Models A–E" },
];

function NavItem({ id, label, sub, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`fast-nav-item${active ? " active" : ""}`}
    >
      <span className="fast-nav-label">{label}</span>
      <span className="fast-nav-sub">{sub}</span>
    </button>
  );
}

export default function Shell({ onLogout }) {
  const [view, setView]       = useState("analyze");
  const [result, setResult]   = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  function navigate(id) { setView(id); setNavOpen(false); }
  function handleResult(r) { setResult(r); setView("output"); }
  function handleNewAnalysis() { setResult(null); setView("analyze"); }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .fast-shell {
          display: flex;
          height: 100vh;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        /* ── Sidebar ─────────────────────────────────── */
        .fast-sidebar {
          width: 230px;
          flex-shrink: 0;
          background: ${DARK};
          display: flex;
          flex-direction: column;
          height: 100%;
          border-right: 1px solid ${BORDER};
          transition: transform 0.25s ease;
        }

        .fast-sidebar-top {
          padding: 32px 20px 24px;
          border-bottom: 1px solid ${BORDER};
        }

        .fast-wordmark {
          font-family: 'Playfair Display', serif;
          color: ${GOLD};
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 4px;
        }

        .fast-wordmark-rule {
          width: 28px;
          height: 1px;
          background: ${GOLD};
          margin: 10px 0 8px;
          opacity: 0.5;
        }

        .fast-wordmark-sub {
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          color: ${STEEL};
          line-height: 1.8;
          font-weight: 500;
        }

        nav.fast-nav {
          flex: 1;
          padding: 12px 0;
        }

        .fast-nav-item {
          display: flex;
          flex-direction: column;
          width: 100%;
          text-align: left;
          padding: 13px 20px;
          background: transparent;
          border: none;
          border-left: 2px solid transparent;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          gap: 2px;
        }
        .fast-nav-item:hover { background: rgba(196,153,42,0.04); }
        .fast-nav-item.active {
          background: rgba(196,153,42,0.06);
          border-left-color: ${GOLD};
        }
        .fast-nav-label {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.3px;
          color: #4A5A6A;
          transition: color 0.15s;
        }
        .fast-nav-item:hover .fast-nav-label { color: #8A9BAA; }
        .fast-nav-item.active .fast-nav-label { color: ${GOLD}; }
        .fast-nav-sub {
          font-size: 10px;
          color: #1E2E3E;
          letter-spacing: 0.2px;
          font-weight: 400;
        }
        .fast-nav-item.active .fast-nav-sub { color: #3A4E5E; }

        .fast-sidebar-footer {
          padding: 16px 20px;
          border-top: 1px solid ${BORDER};
        }
        .fast-credit {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #1E2E3E;
          line-height: 2;
        }
        .fast-credit-accent { color: rgba(196,153,42,0.35); }
        .fast-signout {
          display: block;
          margin-top: 10px;
          font-size: 10px;
          color: #2A3D50;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: color 0.15s;
        }
        .fast-signout:hover { color: ${STEEL}; }

        /* ── Main ────────────────────────────────────── */
        .fast-main {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          background: ${CREAM};
        }

        .fast-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 48px 40px;
          width: 100%;
        }

        /* ── Mobile bar ──────────────────────────────── */
        .fast-mobile-bar {
          display: none;
          background: ${DARK};
          padding: 14px 16px;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid ${BORDER};
          flex-shrink: 0;
        }
        .fast-hamburger {
          background: transparent;
          border: none;
          cursor: pointer;
          color: ${GOLD};
          font-size: 18px;
          line-height: 1;
          padding: 4px;
          font-family: inherit;
          width: 32px;
        }
        .fast-mobile-wordmark {
          font-family: 'Playfair Display', serif;
          color: ${GOLD};
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 3px;
        }

        .fast-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 40;
        }
        .fast-overlay.visible { display: block; }

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
        <div className={`fast-sidebar${navOpen ? " open" : ""}`}>
          <div className="fast-sidebar-top">
            <div className="fast-wordmark">F.A.S.T.</div>
            <div className="fast-wordmark-rule" />
            <div className="fast-wordmark-sub">
              Financial Advisory<br />Steward Technology
            </div>
          </div>
          <nav className="fast-nav">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.id} {...item} active={view === item.id} onClick={navigate} />
            ))}
          </nav>
          <div className="fast-sidebar-footer">
            <div className="fast-credit">
              Vicron A.I. Consulting<br />
              <span className="fast-credit-accent">Bridging the Gap</span>
            </div>
            <button className="fast-signout" onClick={onLogout}>Sign out</button>
          </div>
        </div>

        {/* Overlay */}
        <div className={`fast-overlay${navOpen ? " visible" : ""}`} onClick={() => setNavOpen(false)} />

        {/* Main */}
        <div className="fast-main">
          <div className="fast-mobile-bar">
            <button className="fast-hamburger" onClick={() => setNavOpen((o) => !o)} aria-label="Menu">
              {navOpen ? "✕" : "☰"}
            </button>
            <div className="fast-mobile-wordmark">F.A.S.T.</div>
            <div style={{ width: 32 }} />
          </div>
          <div className="fast-content">
            {view === "brain"   && <BrainView />}
            {view === "analyze" && <AnalyzeView onResult={handleResult} />}
            {view === "output"  && <OutputView result={result} onNewAnalysis={handleNewAnalysis} />}
          </div>
        </div>
      </div>
    </>
  );
}
