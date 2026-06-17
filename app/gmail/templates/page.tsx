"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

export default function TemplatesPage() {

  const [templates, setTemplates] = useState<any[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {

      const res = await fetch(
        `${BACKEND_URL}/email-template`,
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


  const createTemplate = async () => {
  try {

    const res = await fetch(
      `${BACKEND_URL}/email-template`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_name: templateName,
          subject,
          body,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {

      setTemplateName("");
      setSubject("");
      setBody("");

      loadTemplates();
    }

  } catch (error) {
    console.error(error);
  }
};

//delete template 
const deleteTemplate = async (id: number) => {
  try {

    const res = await fetch(
      `${BACKEND_URL}/email-template/${id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (data.success) {
      loadTemplates();
    }

  } catch (error) {
    console.error(error);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 p-10">

      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          Email Templates
        </h1>
        <div className="bg-white rounded-xl shadow p-6 mb-6">

  <input
    className="border rounded p-3 w-full mb-3"
    placeholder="Template Name"
    value={templateName}
    onChange={(e) => setTemplateName(e.target.value)}
  />

  <input
    className="border rounded p-3 w-full mb-3"
    placeholder="Subject"
    value={subject}
    onChange={(e) => setSubject(e.target.value)}
  />

  <textarea
    className="border rounded p-3 w-full mb-3"
    rows={8}
    placeholder="Email Body"
    value={body}
    onChange={(e) => setBody(e.target.value)}
  />

  <button
  onClick={createTemplate}
  className="bg-black text-white px-5 py-2 rounded"
>
  Create Template
</button>

</div>
{templates.length === 0 ? (

  <div className="bg-white rounded-xl shadow p-6">
    No templates found
  </div>

) : (

  <div className="space-y-4">

    {templates.map((template) => (

      <div
        key={template.id}
        className="bg-white rounded-xl shadow p-6"
      >

        <h3 className="font-semibold text-lg">
          {template.template_name}
        </h3>

        <p className="mt-2 font-medium">
          {template.subject}
        </p>

        <p className="mt-2 text-gray-600 whitespace-pre-wrap">
          {template.body}
        </p>
        <button
  onClick={() => deleteTemplate(template.id)}
  className="mt-4 bg-red-700 text-white px-4 py-2 rounded"
>
  Delete
</button>

      </div>

    ))}

  </div>

)}

      </div>

    </div>
  );
}