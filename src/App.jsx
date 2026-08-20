import { useState, useEffect } from "react";
import { getToken, clearToken, syncBrain } from "./lib/storage";
import Login from "./components/Login";
import Shell from "./components/Shell";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Token presence is a soft check — the server will 401 if it's expired
    const token = getToken();
    if (!token) {
      setChecking(false);
      return;
    }
    // Pull the Advisor Brain from the server before rendering any view —
    // server is the source of truth so the brain follows the advisor's devices.
    syncBrain().finally(() => {
      setAuthed(true);
      setChecking(false);
    });
  }, []);

  function handleLogin() {
    // Fresh login — sync the brain down before showing the app
    setChecking(true);
    syncBrain().finally(() => {
      setAuthed(true);
      setChecking(false);
    });
  }

  function handleLogout() {
    clearToken();
    setAuthed(false);
  }

  if (checking) {
    // Minimal loading state — avoids flash of login screen on refresh
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1B1A33",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#C6B159", fontFamily: "'Playfair Display', serif", fontSize: 24 }}>
          F.A.S.T.
        </div>
      </div>
    );
  }

  if (!authed) {
    return <Login onLogin={handleLogin} />;
  }

  return <Shell onLogout={handleLogout} />;
}
