"use client";

import Link from "next/link";

export default function GmailDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold">
          Gmail Integration
        </h1>

        <p className="text-gray-600 mb-8">
          Manage your connected Gmail account
        </p>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold">
            Connected Account
          </h2>

          <p className="text-gray-600 mt-2">
            pushti2705@gmail.com
          </p>

          <div className="mt-3 inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            Connected
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">

          <Link
            href="/gmail/settings"
            className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
          >
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="font-semibold text-lg">
              Mailbox Settings
            </h3>
            <p className="text-gray-500 mt-2">
              Manage sender settings
            </p>
          </Link>

          <Link
            href="/gmail/signatures"
            className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
          >
            <div className="text-3xl mb-3">✍️</div>
            <h3 className="font-semibold text-lg">
              Signatures
            </h3>
            <p className="text-gray-500 mt-2">
              Create and manage signatures
            </p>
          </Link>
          <Link
  href="/gmail/templates"
  className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
>
  <div className="text-3xl mb-3">📄</div>

  <h3 className="font-semibold text-lg">
    Templates
  </h3>

  <p className="text-gray-500 mt-2">
    Create and manage email templates
  </p>
</Link>

          <Link
            href="/email"
            className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
          >
            <div className="text-3xl mb-3">📨</div>
            <h3 className="font-semibold text-lg">
              Send Email
            </h3>
            <p className="text-gray-500 mt-2">
              Compose and send emails
            </p>
          </Link>

        </div>

      </div>
    </div>
  );
}