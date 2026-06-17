"use client";

import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

export default function GmailSettingsPage() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/gmail/mailbox-settings`,
        {
          credentials: "include",
        }
      );

      const data = await res.json();

      if (data.success && data.data.length > 0) {
        setSettings(data.data[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!settings) {
    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-10">

      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          Mailbox Settings
        </h1>

        <div className="bg-white rounded-xl shadow p-6">

          <div className="mb-6">
            <p className="text-gray-500 text-sm">
              Sender Name
            </p>

            <p className="text-lg font-medium">
              {settings.sender_name}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-gray-500 text-sm">
              Daily Email Limit
            </p>

            <p className="text-lg font-medium">
              {settings.max_emails_per_day}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-gray-500 text-sm">
              Default Signature
            </p>

            <p className="text-lg font-medium">
              {settings.signature_name}
            </p>
          </div>

          <button className="bg-black text-white px-5 py-2 rounded-lg">
            Edit Settings
          </button>

        </div>

      </div>

    </div>
  );
}