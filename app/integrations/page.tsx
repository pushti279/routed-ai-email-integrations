"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8000";

export default function IntegrationsPage() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mailboxSettings, setMailboxSettings] = useState<any[]>([]);
  const [senderName, setSenderName] = useState("");
  const [maxEmails, setMaxEmails] = useState(100);
  const [signature, setSignature] = useState("");
  const mailbox = mailboxSettings[0];
  const [signatures, setSignatures] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);

  const [showSignatureForm, setShowSignatureForm] =
  useState(false);

  const [newSignatureName, setNewSignatureName] =
  useState("");

  const [newSignatureContent, setNewSignatureContent] = useState("");
  const [loadingConnections, setLoadingConnections] =
  useState(true);
  

  useEffect(() => {
  console.log("MAILBOX CHANGED:", mailbox);

  if (mailbox) {
    setSenderName(mailbox.sender_name || "");
    setMaxEmails(mailbox.max_emails_per_day || 100);
    setSignature(mailbox.signature_name || "");
  }
}, [mailbox]);


const loadConnections = async () => {
  try {
    const res = await fetch(
      `${BACKEND_URL}/gmail/connections`,
      {
        credentials: "include",
      }
    );

    const data = await res.json();

    if (data.success) {
      setConnections(data.data);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setLoadingConnections(false);
  }
};


const loadMailboxSettings = async () => {
  try {
    const res = await fetch(
      `${BACKEND_URL}/gmail/mailbox-settings`,
      {
        credentials: "include",
      }
    );

    const data = await res.json();

    if (data.success) {
      setMailboxSettings(data.data);
    }
  } catch (error) {
    console.error(error);
  }

};

const loadSignatures = async () => {
  try {

    const res = await fetch(
      `${BACKEND_URL}/gmail/signatures`,
      {
        credentials: "include",
      }
    );

    const data = await res.json();

    if (data.success) {
      setSignatures(data.data);
    }

  } catch (error) {
    console.error(error);
  }
};


useEffect(() => {
  checkConnection();
  loadConnections();
  loadMailboxSettings();
  loadSignatures();
}, []);





const checkConnection = async () => {
  try {
    const res = await fetch(
      `${BACKEND_URL}/auth/google/status`,
      {
        credentials: "include",
      }
    );

    const data = await res.json();

    if (data.connected) {
      setConnected(true);
      setUser(data.user);
    }
  } catch (error) {
    console.error(error);
  }
};


const handleGoogleLogin = () => {
    window.location.href =
      `${BACKEND_URL}/auth/google/login`;
  };


//save function 
const handleSave = async () => {
  try {
    const res = await fetch(
      `${BACKEND_URL}/gmail/mailbox-settings/${mailbox.id}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender_name: senderName,
          max_emails_per_day: maxEmails,
          signature_name: signature,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("Settings saved successfully");
      loadMailboxSettings();
    }
  } catch (error) {
    console.error(error);
  }
};
const handleDisconnect = async (
  connectionId: number
) => {

  const confirmed = window.confirm(
    "Are you sure you want to disconnect this mailbox?"
  );

  if (!confirmed) return;

  try {

    const res = await fetch(
      `${BACKEND_URL}/gmail/connections/${connectionId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (data.success) {

      alert("Mailbox disconnected");

      setConnected(false);
      setConnections([]);
      setMailboxSettings([]);

      window.location.reload();
    }

  } catch (error) {
    console.error(error);
  }
};

const handleCreateSignature = async () => {
  try {

    const res = await fetch(
      `${BACKEND_URL}/gmail/signatures`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSignatureName,
          content: newSignatureContent,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {

      alert("Signature created");

      setNewSignatureName("");
      setNewSignatureContent("");

      setShowSignatureForm(false);

      loadSignatures();
    }

  } catch (error) {
    console.error(error);
  }
};

const handleDeleteSignature = async (
  signatureId: number
) => {

  const confirmed = window.confirm(
    "Delete this signature?"
  );

  if (!confirmed) return;

  try {

    const res = await fetch(
      `${BACKEND_URL}/gmail/signatures/${signatureId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (data.success) {

      alert("Signature deleted");

      loadSignatures();

    }

  } catch (error) {
    console.error(error);
  }
};
if (loadingConnections) {
  return (
    <div
      style={{
        padding: "30px",
      }}
    >
      Loading integrations...
    </div>
  );
}
  
  
 

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
          marginBottom: "40px",
        }}
      >
        <input
          placeholder="Search for integrations"
          style={{
            width: "75%",
            padding: "14px",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        />

      <Link
  href="/integrations/request"
  style={{
    padding: "14px 24px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
    textDecoration: "none",
    color: "#111827",
  }}
>
  Request Integration ↗
</Link>
      </div>
<h1
  style={{
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "8px",
    color: "#111827",
  }}
>
  Email Integration
</h1>

<p
  style={{
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "24px",
  }}
>
  Connect your email accounts to send automated
  sequences
</p>


      {mailboxSettings.length === 0 && (
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

        {/* Microsoft */}

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
    Microsoft
  </h2>
</div>

          <p style={{ color: "#666" }}>
            outlook.com
          </p>

          <button
            disabled
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            Sign in with Microsoft
          </button>
        </div>

        {/* IMAP */}

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

          <button
            disabled
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            Sign in with IMAP
          </button>
        </div>

        {/* Invite */}

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

          <button
            disabled
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            Click to Invite
          </button>
        </div>
           </div>
)}

{mailboxSettings.length > 0 && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "20px",
      marginTop: "30px",
      marginBottom: "30px",
    }}
  >
    <Link
      href="/gmail/templates"
      style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "24px",
        textDecoration: "none",
        color: "black",
      }}
    >
      <h3>Templates</h3>
      <p style={{ color: "#666" }}>
        Create and manage email templates
      </p>
    </Link>

    <Link
      href="/gmail/signatures"
      style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "24px",
        textDecoration: "none",
        color: "black",
      }}
    >
      <h3>Signatures</h3>
      <p style={{ color: "#666" }}>
        Create and manage signatures
      </p>
    </Link>

    <Link
      href="/email"
      style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "24px",
        textDecoration: "none",
        color: "black",
      }}
    >
      <h3>Send Email</h3>
      <p style={{ color: "#666" }}>
        Create and send emails
      </p>
    </Link>

    <Link
  href="/gmail/bulk"
  style={{
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "24px",
    textDecoration: "none",
    color: "black",
  }}
>
  <h3>Bulk Email</h3>

  <p style={{ color: "#666" }}>
    Send personalized emails to multiple candidates
  </p>
</Link>
  </div>
)}

      {mailboxSettings.length > 0 && (

        
        <div
          style={{
            marginTop: "40px",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
       <h2
  style={{
    padding: "20px",
    margin: 0,
    fontSize: "16px",
    fontWeight: 600,
  }}
>
  Connected Mailboxes
</h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f5f5f5",
                }}
              >
              <th style={{ padding: "14px", textAlign: "left" }}>
  Provider
</th>

<th style={{ padding: "14px", textAlign: "left" }}>
  Sender Name
</th>

<th style={{ padding: "14px", textAlign: "left" }}>
  Email Address
</th>

<th style={{ padding: "14px", textAlign: "left" }}>
  Max Emails Per Day
</th>

<th style={{ padding: "14px", textAlign: "left" }}>
  Signature
</th>

<th style={{ padding: "14px", textAlign: "left" }}>
  Status
</th>
<th style={{ padding: "14px", textAlign: "left" }}>
  Actions
</th>
              </tr>
            </thead>

            <tbody>
              {connections.map((item) => (
                <tr key={item.id}>
  <td style={{ padding: "14px" }}>
    Gmail
  </td>

  <td style={{ padding: "14px" }}>
  <input
    value={senderName}
onChange={(e) => setSenderName(e.target.value)}
    style={{
      padding: "8px",
      border: "1px solid #ddd",
      borderRadius: "6px",
      width: "180px",
    }}
  />
</td>

  <td style={{ padding: "14px" }}>
    {item.email}
  </td>

  <td style={{ padding: "14px" }}>
  <input
    type="number"
    value={maxEmails}
onChange={(e) => {
  console.log("NEW VALUE:", e.target.value);
  setMaxEmails(Number(e.target.value));
}}
    min={1}
    max={100}
    style={{
      padding: "8px",
      border: "1px solid #ddd",
      borderRadius: "6px",
      width: "90px",
    }}
  />
</td>

 <td style={{ padding: "14px" }}>
  <select
    value={signature}
onChange={(e) => setSignature(e.target.value)}
    style={{
      padding: "8px",
      border: "1px solid #ddd",
      borderRadius: "6px",
      width: "160px",
      background: "white",
    }}
  >
    <option value="">
  Select Signature
</option>

{signatures.map((item) => (
  <option
    key={item.id}
    value={item.name}
  >
    {item.name}
  </option>
))}
  </select>
</td>

  <td
    style={{
      padding: "14px",
      color: "#16a34a",
      fontWeight: 500,
    }}
  >
    Connected
  </td>
  <td style={{ padding: "14px" }}>

  <div
    style={{
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    }}
  >

    <button
  onClick={handleSave}
  style={{
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "white",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
  }}
>
  Save
</button>
    

    <button
      onClick={() => handleDisconnect(item.id)}
      style={{
        border: "1px solid #ef4444",
        background: "white",
        color: "#ef4444",
        borderRadius: "6px",
        padding: "6px 10px",
        cursor: "pointer",
      }}
    >
      Disconnect
    </button>

  </div>

</td>
  
</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
