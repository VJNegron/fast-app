import { useState, useEffect } from "react";
import { getToken, clearToken } from "./lib/storage";
import Login from "./components/Login";
import Shell from "./components/Shell";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Token presence is a soft check — the server will 401 if it's expired
    const token = getToken();
    setAuthed(!!token);
    setChecking(false);
  }, []);

  function handleLogin() {
    setAuthed(true);
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
          background: "#0D1B2A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif", fontSize: 24 }}>
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
