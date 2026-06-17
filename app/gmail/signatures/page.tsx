"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";



export default function SignaturesPage() {
  const [signatures, setSignatures] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [content, setContent] = useState(""); 

  useEffect(() => {
    loadSignatures();
  }, []);

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

  const createSignature = async () => {
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
          name,
          content,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      setName("");
      setContent("");

      loadSignatures();
    }
  } catch (error) {
    console.error(error);
  }
};

 const deleteSignature = async (id: number) => {
  try {
    const res = await fetch(
      `${BACKEND_URL}/gmail/signatures/${id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (data.success) {
      loadSignatures();
    }
  } catch (error) {
    console.error(error);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          Signatures
        </h1>

        <div className="bg-white rounded-xl shadow p-6 mb-6">

  <h2 className="text-xl font-semibold mb-4">
    Create Signature
  </h2>

  <input
    className="border rounded p-3 w-full mb-3"
    placeholder="Signature Name"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />

  <textarea
    className="border rounded p-3 w-full mb-3"
    rows={5}
    placeholder="Signature Content"
    value={content}
    onChange={(e) => setContent(e.target.value)}
  />

  <button
    onClick={createSignature}
    className="bg-black text-white px-5 py-2 rounded"
  >
    Create Signature
  </button>

</div>

        {signatures.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6">
            No signatures found
          </div>
        ) : (
          <div className="space-y-4">
            {signatures.map((signature) => (
              <div
                key={signature.id}
                className="bg-white rounded-xl shadow p-6"
              >
                <h3 className="font-semibold text-lg">
                  {signature.name}
                </h3>

                <p className="mt-2 text-gray-600">
                  {signature.content}
                </p>
                <button
  onClick={() => deleteSignature(signature.id)}
  className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
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