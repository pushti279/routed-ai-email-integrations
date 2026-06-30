"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SequencesPage() {

    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [sequenceName, setSequenceName] = useState("");
    const [selectedMailbox, setSelectedMailbox] = useState("");
    const [mailboxes, setMailboxes] = useState([]);

    const BACKEND_URL = "http://localhost:8000";
    const router = useRouter();


    //load sequence 
    const loadSequences = async () => {
    try {
        const res = await fetch(
            `${BACKEND_URL}/email-sequences`,
            {
                credentials: "include",
            }
        );

        const data = await res.json();

        console.log("SEQUENCES:", data);

        if (data.success) {
            setSequences(data.data);
        }
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
};


//load mail boxes
const loadMailboxes = async () => {
    try {
        const res = await fetch(
            `${BACKEND_URL}/gmail/connections`,
            {
                credentials: "include",
            }
        );

        const data = await res.json();

        console.log("MAILBOXES:", data);

        if (data.success) {
            setMailboxes(data.data);
        }
    } catch (error) {
        console.error(error);
    }
};


//create sequence 
const createSequence = async () => {
    if (!sequenceName.trim()) {
    alert("Please enter a sequence name");
    return;
}

if (!selectedMailbox) {
    alert("Please select a mailbox");
    return;
}
    try {
        const res = await fetch(
            `${BACKEND_URL}/email-sequences`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: sequenceName,
                    mailbox_id: Number(selectedMailbox),
                }),
            }
        );

        const data = await res.json();

        console.log("CREATE:", data);

        if (data.success) {
            alert("Sequence created successfully");

            setShowModal(false);
            setSequenceName("");
            setSelectedMailbox("");

            loadSequences();
        }

    } catch (error) {
        console.error(error);
    }
};

useEffect(() => {
    loadSequences();
    loadMailboxes();
}, []);


    return (
        <div className="p-8">
            <div className="flex items-center justify-between">
    <div>
        <h1 className="text-3xl font-bold">
            Email Sequences
        </h1>

        <p className="text-gray-500 mt-1">
            Create and manage automated email sequences.
        </p>
    </div>

   <button
    onClick={() => setShowModal(true)}
    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
>
    + New Sequence
</button>
</div>

            {loading ? (
    <p className="mt-4">Loading...</p>
) : (


    <div className="mt-8 space-y-4">
    {sequences.map((sequence: any) => (
        <div
    key={sequence.id}
    onClick={() => router.push(`/sequences/${sequence.id}`)}
    className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md cursor-pointer transition"
>
            <div className="flex justify-between items-start">

                <div>
                    <h2 className="text-lg font-semibold">
                        {sequence.name}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Mailbox: {sequence.mailbox_email}
                    </p>

                    <div className="flex gap-5 mt-3 text-sm text-gray-500">

    <span>
        ✉️ {sequence.step_count} Steps
    </span>

    <span>
        👥 {sequence.candidate_count} Candidates
    </span>

</div>

                    <div className="mt-3">

    <span
        className={`px-3 py-1 rounded-full text-xs font-semibold
        ${
            sequence.status === "running"
                ? "bg-green-100 text-green-700"
            : sequence.status === "completed"
                ? "bg-gray-100 text-gray-700"
            : sequence.status === "paused"
                ? "bg-blue-100 text-blue-700"
                : "bg-yellow-100 text-yellow-700"
        }`}
    >
        {sequence.status === "running" && "🟢 Running"}
        {sequence.status === "completed" && "✅ Completed"}
        {sequence.status === "paused" && "🔵 Paused"}
        {(sequence.status === "draft" ||
          sequence.status === "active") && "🟡 Draft"}
    </span>

</div>
                </div>

                <span className="text-gray-400 text-sm">
                    →
                </span>

            </div>
        </div>
    ))}
</div>
)}


{showModal && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

        <div className="bg-white rounded-xl shadow-xl w-[450px] p-6">

            <h2 className="text-2xl font-semibold mb-6">
                Create New Sequence
            </h2>

            <div className="space-y-4">

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Sequence Name
                    </label>

                    <input
                        type="text"
                        value={sequenceName}
                        onChange={(e) => setSequenceName(e.target.value)}
                        className="w-full border rounded-lg p-3"
                        placeholder="Software Engineer Hiring"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Mailbox
                    </label>

                    <select
    value={selectedMailbox}
    onChange={(e) => setSelectedMailbox(e.target.value)}
    className="w-full border rounded-lg p-3"
>
    <option value="">
        Select Mailbox
    </option>

    {mailboxes.map((mailbox: any) => (
        <option
            key={mailbox.id}
            value={mailbox.id}
        >
            {mailbox.email}
        </option>
    ))}
</select>
                </div>

            </div>

            <div className="flex justify-end gap-3 mt-8">

                <button
                    onClick={() => setShowModal(false)}
                    className="border px-5 py-2 rounded-lg"
                >
                    Cancel
                </button>

                <button
    onClick={createSequence}
    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
>
    Create
</button>

            </div>

        </div>

    </div>
)}
        </div>
    );
}