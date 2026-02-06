"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!token.trim()) {
      setError("Erişim tokeni gerekli.");
      return;
    }
    setLoading(true);
    setError("");
    // Token'ı query param olarak dashboard'a yönlendir
    router.push(`/dashboard?token=${encodeURIComponent(token.trim())}`);
  };

  const handleDemo = () => {
    router.push("/dashboard?demo=true");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0b0f",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          animation: "fade-in 0.5s ease-out",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            O
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#e2e4f0",
            }}
          >
            Olga Stok
          </h1>
          <p style={{ fontSize: 14, color: "#6b7094", marginTop: 6 }}>
            ikas Entegrasyonlu Stok Yönetim Platformu
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: "#12131a",
            border: "1px solid #1e2030",
            borderRadius: 16,
            padding: 28,
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#6b7094",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Erişim Tokeni
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Token'ınızı yapıştırın..."
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "#0a0b0f",
              border: `1px solid ${error ? "#ef4444" : "#1e2030"}`,
              borderRadius: 10,
              color: "#e2e4f0",
              fontSize: 14,
              outline: "none",
              fontFamily: "JetBrains Mono, monospace",
              transition: "border-color 0.15s",
            }}
          />

          {error && (
            <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 0",
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 16,
              transition: "all 0.15s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "20px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#1e2030" }} />
            <span style={{ fontSize: 11, color: "#6b7094" }}>veya</span>
            <div style={{ flex: 1, height: 1, background: "#1e2030" }} />
          </div>

          <button
            onClick={handleDemo}
            style={{
              width: "100%",
              padding: "12px 0",
              background: "transparent",
              color: "#818cf8",
              border: "1px solid #1e2030",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Demo Modu ile Gir
          </button>
        </div>

        {/* Footer Info */}
        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 11,
            color: "#6b7094",
            lineHeight: 1.6,
          }}
        >
          <p>Token'ınız yoksa admin'den talep edin.</p>
          <p style={{ marginTop: 4 }}>
            Paylaşılan link ile giriş yapıyorsanız, token otomatik algılanır.
          </p>
        </div>
      </div>
    </div>
  );
}
