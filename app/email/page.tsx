"use client";
import { useEffect, useState } from "react";

export default function EmailPage() {
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [signatures, setSignatures] = useState<any[]>([]);
  const [selectedSignature, setSelectedSignature] = useState("");

  const sendEmail = async () => {
    const response = await fetch(
      "http://localhost:8000/gmail/send-test",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to_email: toEmail,
          subject,
          body,
        }),
      }
    );

    const data = await response.json();

    alert(JSON.stringify(data));
  };

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

useEffect(() => {
  loadTemplates();
  loadSignatures();
}, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">
        Send Email
      </h1>
      <select
  className="border p-3 w-full mb-4"
  value={selectedTemplate}
  onChange={(e) => {
    const templateId = e.target.value;

    setSelectedTemplate(templateId);

    const template = templates.find(
      (t) => t.id.toString() === templateId
    );

    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
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
<select
  className="border p-3 w-full mb-4"
  value={selectedSignature}
  onChange={(e) => {
    const signatureId = e.target.value;

    setSelectedSignature(signatureId);

    const signature = signatures.find(
      (s) => s.id.toString() === signatureId
    );

    if (signature) {
      setBody((prev) =>
        `${prev}\n\n${signature.content}`
      );
    }
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
      <input
        className="border p-3 w-full mb-4"
        placeholder="Recipient Email"
        value={toEmail}
        onChange={(e) => setToEmail(e.target.value)}
      />

      <input
        className="border p-3 w-full mb-4"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <textarea
        className="border p-3 w-full mb-4 h-48"
        placeholder="Email Body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <button
        onClick={sendEmail}
        className="bg-black text-white px-6 py-3 rounded"
      >
        Send Test Email
      </button>

    </div>
  );
}
