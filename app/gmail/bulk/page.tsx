"use client";

import { useEffect, useState } from "react";

const candidates = [
  {
    id: 1,
    name: "Pushti Nirma",
    email: "23bce272@nirmauni.ac.in",
  },
  {
    id: 2,
    name: "shreni shah",
    email: "shreni1499@gmail.com",
  },
  {
    id: 3,
    name: "hirak patel",
    email: "hirakpatidar@gmail.com",
  },
  {
    id: 4,
    name: "anjali agrawal",
    email: "anjaliagrawal3097@gmail.com",
  },

  {
    id: 5,
    name: "ieee wie nu",
    email: "ieeewienu@gmail.com",
  },
];

export default function BulkEmailPage() {
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [selectedMailbox, setSelectedMailbox] =
  useState("");
  const [selectedTemplate, setSelectedTemplate] =
  useState("");

  const [selectedSignature, setSelectedSignature] =
  useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [previewSubject, setPreviewSubject] =
  useState("");

  const [previewBody, setPreviewBody] =
  useState("");
  const [previewCandidate, setPreviewCandidate] =
  useState(candidates[0]);
  const [previewSignature, setPreviewSignature] =
  useState("");
  const currentMailbox = mailboxes.find(
  (mailbox) =>
    mailbox.id.toString() === selectedMailbox
);

const dailyLimit =
  currentMailbox?.max_emails_per_day || 100;


  //templates
  const loadTemplates = async () => {
  try {
    const res = await fetch(
      "http://localhost:8000/email-template",
      {
        credentials: "include",
      }
    );

    const data = await res.json();

    if (data.success) {
      setTemplates(data.data);
    }
  } catch (error) {
    console.error(error);
  }
};

//signatures 
const loadSignatures = async () => {
  try {

    const res = await fetch(
      "http://localhost:8000/gmail/signatures",
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

  
//mailboxes
const loadMailboxes = async () => {
  try {
    const res = await fetch(
      "http://localhost:8000/gmail/connections",
      {
        credentials: "include",
      }
    );

    const data = await res.json();

   if (data.success) {
  console.log("MAILBOXES:", data.data);
  console.log("LENGTH:", data.data.length);

  setMailboxes(data.data);

  setSelectedMailbox(
    data.data[0]?.id?.toString() || ""
  );
}
  } catch (error) {
    console.error(error);
  }
};


//bulk email send 
const sendBulkEmail = async () => {
  try {

    const selectedCandidatesData =
      candidates.filter((candidate) =>
        selectedCandidates.includes(candidate.id)
      );
      console.log("selectedMailbox =", selectedMailbox);

      console.log({
 
  mailbox_id: Number(selectedMailbox),
  template_id: Number(selectedTemplate),
  signature_id: Number(selectedSignature),
  candidates: selectedCandidatesData,
});

  

    const res = await fetch(
      "http://localhost:8000/gmail/send-bulk",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mailbox_id: Number(selectedMailbox),
          template_id: Number(selectedTemplate),
          signature_id: Number(selectedSignature),
          candidates: selectedCandidatesData,
        }),
      }
    );

    const data = await res.json();
    if (data.reauthorize) {

  alert(
    "Google authorization expired. Please reconnect Gmail."
  );

  window.location.href =
    "http://localhost:8000/auth/google/login";

  return;
}

if (
  !data.success &&
  data.message === "Unauthorized"
) {

  alert(
    "Session expired. Please sign in again."
  );

  window.location.href = "/login";

  return;
}
if (data.success) {

  alert(
    `Successfully sent ${data.sent} emails`
  );

  return;
}

if (!data.success) {

  alert(
    data.message ||
    "Something went wrong"
  );

  return;
}

  } catch (error) {
    console.error(error);
  }
};

useEffect(() => {
  loadTemplates();
  loadSignatures();
  loadMailboxes();
}, []);



//variables
useEffect(() => {
  if (!selectedTemplate) return;

  const template = templates.find(
    (t) => t.id.toString() === selectedTemplate
  );

  if (!template) return;

  setPreviewSubject(template.subject);

  const signature = signatures.find(
  (s) => s.id.toString() === selectedSignature
);

const signatureContent =
  signature?.content || "";


const formattedName = previewCandidate.name
  .split(" ")
  .map(
    (word) =>
      word.charAt(0).toUpperCase() +
      word.slice(1).toLowerCase()
  )
  .join(" ");

setPreviewBody(
  template.body
    .replace("{{name}}",  formattedName)
    .replace("{{email}}", previewCandidate.email)
    + "\n\n" +
    signatureContent
); 

}, [
  selectedTemplate,
  previewCandidate,
  selectedSignature,
  templates,
  signatures,
]);


  return (
    <div
      style={{
        padding: "30px",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 600,
          marginBottom: "8px",
        }}
      >
        Bulk Email Campaign
      </h1>

      <p
        style={{
          color: "#666",
          marginBottom: "20px",
        }}
      >
        Select candidates for outreach
      </p>
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
    marginBottom: "25px",
  }}
>
  <div>
    <label
      style={{
        display: "block",
        marginBottom: "8px",
        fontWeight: 500,
      }}
    >
      Mailbox
    </label>

    <select
      value={selectedMailbox}
      onChange={(e) =>
        setSelectedMailbox(e.target.value)
      }
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #ddd",
      }}
    >
      {mailboxes.map((mailbox) => (
  <option
    key={mailbox.id}
    value={mailbox.id}
  >
    {mailbox.email}
  </option>
))}
    </select>
  </div>

  <div>
    <label
      style={{
        display: "block",
        marginBottom: "8px",
        fontWeight: 500,
      }}
    >
      Template
    </label>

    <select
      value={selectedTemplate}
       onChange={(e) => {
  setSelectedTemplate(e.target.value);
}}
  
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #ddd",
      }}
    >
        <option value="">
  Select Template
</option>

{templates.map((template) => (
  <option
    key={template.id}
    value={template.id}
  >
    {template.template_name}
  </option>
))}
      
    </select>
  </div>

  <div>
    <label
      style={{
        display: "block",
        marginBottom: "8px",
        fontWeight: 500,
      }}
    >
      Signature
    </label>

    <select
      value={selectedSignature}
      onChange={(e) =>
        setSelectedSignature(e.target.value)
      }
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #ddd",
      }}
    >
      <option value="">
  Select Signature
</option>

{signatures.map((signature) => (
  <option
    key={signature.id}
    value={signature.id}
  >
    {signature.name}
  </option>
))}
    </select>
  </div>
</div>

      <div
        style={{
          display: "flex",
          gap: "30px",
          marginBottom: "25px",
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <div>
          <strong>Selected:</strong>{" "}
          {selectedCandidates.length}
        </div>

        <div>
         
         <strong>Daily Limit:</strong> {dailyLimit}
        </div>

        <div
  style={{
    color:
      selectedCandidates.length > dailyLimit
        ? "#dc2626"
        : "inherit",
  }}
>
  <strong>Remaining:</strong>{" "}
  {Math.max(
    0,
    dailyLimit - selectedCandidates.length
  )}
</div>
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr 1fr",
            padding: "16px",
            background: "#f9fafb",
            fontWeight: 600,
            borderBottom: "1px solid #ddd",
          }}
        >
          <div>Select</div>
          <div>Candidate Name</div>
          <div>Email</div>
        </div>

        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 1fr",
              padding: "16px",
              borderBottom: "1px solid #eee",
              alignItems: "center",
            }}
          >
            <input
              type="checkbox"
              checked={selectedCandidates.includes(
                candidate.id
              )}
              onChange={(e) => {
                if (e.target.checked) {

  if (
    selectedCandidates.length >= dailyLimit
  ) {
    alert(
      `Daily limit is ${dailyLimit} candidates`
    );
    return;
  }

  setSelectedCandidates([
    ...selectedCandidates,
    candidate.id,
  ]);
} else {
                  setSelectedCandidates(
                    selectedCandidates.filter(
                      (id) => id !== candidate.id
                    )
                  );
                }
              }}
            />

            <div>{candidate.name}</div>

            <div
              style={{
                color: "#666",
              }}
            >
              {candidate.email}
            </div>
          </div>
        ))}
      </div>
      <div
  style={{
    marginTop: "25px",
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "20px",
  }}
>
    <div
  style={{
    marginBottom: "15px",
  }}
>
  <label>
    Preview Candidate
  </label>

  <select
    value={previewCandidate.id}
    onChange={(e) => {
      const candidate =
        candidates.find(
          (c) =>
            c.id === Number(e.target.value)
        );

      if (candidate) {
        setPreviewCandidate(candidate);
      }
    }}
    style={{
      width: "100%",
      padding: "10px",
      marginTop: "8px",
      border: "1px solid #ddd",
      borderRadius: "8px",
    }}
  >
     {candidates
  .filter((candidate) =>
    selectedCandidates.includes(candidate.id)
  )
  .map((candidate) => (
    <option
      key={candidate.id}
      value={candidate.id}
    >
      {candidate.name}
    </option>
))}
  </select>
</div> 

  <h3>Email Preview</h3>

  <p>
    <strong>Subject:</strong>
    {" "}
    {previewSubject}
  </p>

  <div
    style={{
      marginTop: "15px",
      whiteSpace: "pre-wrap",
      color: "#444",
    }}
  >
    {previewBody}
  </div>
</div>


{selectedCandidates.length > dailyLimit && (
  <div
    style={{
      color: "#dc2626",
      marginTop: "16px",
      fontWeight: 500,
    }}
  >
    Daily email limit exceeded.
  </div>
)}
<button
  onClick={sendBulkEmail}
  disabled={
    selectedCandidates.length === 0 ||
    selectedCandidates.length > dailyLimit
  }
  style={{
    marginTop: "24px",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    background:
      selectedCandidates.length === 0 ||
      selectedCandidates.length > dailyLimit
        ? "#d1d5db"
        : "#2563eb",
    color: "white",
    cursor:
      selectedCandidates.length === 0 ||
      selectedCandidates.length > dailyLimit
        ? "not-allowed"
        : "pointer",
    opacity:
      selectedCandidates.length === 0 ||
      selectedCandidates.length > dailyLimit
        ? 0.7
        : 1,
  }}
>
  Send Bulk Email ({selectedCandidates.length})
</button>
    </div>
  );
}