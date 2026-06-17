"use client";

import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function RequestIntegrationPage() {
  const handleGoogleLogin = () => {
    window.location.href =
      `${BACKEND_URL}/auth/google/login`;
  };

  return (
    <div
      style={{
        padding: "30px",
        background: "#f7f7f7",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            margin: 0,
          }}
        >
          Request Integration
        </h1>

        <Link
          href="/integrations"
          style={{
            textDecoration: "none",
            color: "#2563eb",
            fontWeight: 500,
          }}
        >
          ← Back
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >

        {/* Gmail */}

        <div
          style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <img
              src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
              alt="gmail"
              width="28"
              height="28"
            />

            <h2
              style={{
                margin: 0,
                color: "#111",
              }}
            >
              Gmail
            </h2>
          </div>

          <p style={{ color: "#666" }}>
            gmail.com
          </p>

          <button
            onClick={handleGoogleLogin}
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            Sign in with Gmail
          </button>
        </div>

        {/* Outlook */}

        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "25px",
            opacity: 0.7,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
              alt="microsoft"
              width="28"
              height="28"
            />

            <h2
              style={{
                margin: 0,
                color: "#111",
              }}
            >
              Microsoft Outlook
            </h2>
          </div>

          <p style={{ color: "#666" }}>
            outlook.com
          </p>

          <div
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "#f3f4f6",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
             connect
          </div>
        </div>

        {/* IMAP */}

        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "25px",
            opacity: 0.7,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <span style={{ fontSize: "28px" }}>📧</span>

            <h2
              style={{
                margin: 0,
                color: "#111",
              }}
            >
              IMAP
            </h2>
          </div>

          <p style={{ color: "#666" }}>
            Internet Message Access Protocol
          </p>

          <div
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "#f3f4f6",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
             connect
          </div>
        </div>

        {/* External User */}

        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "25px",
            opacity: 0.7,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <span style={{ fontSize: "28px" }}>👥</span>

            <h2
              style={{
                margin: 0,
                color: "#111",
              }}
            >
              Invite External User
            </h2>
          </div>

          <p style={{ color: "#666" }}>
            Supported mailbox providers
          </p>

          <div
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "#f3f4f6",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            connect
          </div>
        </div>

      </div>
    </div>
  );
}