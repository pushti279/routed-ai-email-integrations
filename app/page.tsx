"use client";

export default function HomePage() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>OAuth Demo</h1>

      <p>
        Open <b>/integrations</b> to test Google OAuth.
      </p>

      <a href="/integrations">
        Go to Integrations
      </a>
    </div>
  );
}