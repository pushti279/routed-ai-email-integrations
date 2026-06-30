"use client";

import { useEffect, useState } from "react";

interface CandidatesModalProps {
    open: boolean;
    onClose: () => void;
    sequenceId: number;
}

export default function CandidatesModal({
    open,
    onClose,
    sequenceId,
}: CandidatesModalProps)  {

    const BACKEND_URL = "http://localhost:8000";

    const [candidates, setCandidates] = useState<any[]>([]);
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
    const loadCandidates = async () => {
        try {
            const res = await fetch(
                `${BACKEND_URL}/candidates`,
                {
                    credentials: "include",
                }
            );

            const data = await res.json();

            console.log("CANDIDATES:", data);

            if (data.success) {
                setCandidates(data.data);
            }

        } catch (error) {
            console.error(error);
        }
    };


    const enrollCandidates = async () => {

    try {

        const selectedData = candidates.filter((candidate: any) =>
            selectedCandidates.includes(candidate.email)
        );

        const res = await fetch(
            `${BACKEND_URL}/sequence-enrollments`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sequence_id: sequenceId,
                    candidates: selectedData,
                }),
            }
        );

        const data = await res.json();

        console.log("ENROLL:", data);

        if (data.success) {

            alert("Candidates enrolled successfully!");

            setSelectedCandidates([]);

            onClose();

        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error(error);
    }

};

    useEffect(() => {
        if (open) {
            loadCandidates();
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-xl shadow-xl w-[650px] p-6">

                <h2 className="text-2xl font-semibold mb-6">
                    Enroll Candidates
                </h2>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">

                    {candidates.map((candidate: any) => (

                        <label
                            key={candidate.email}
                            className="flex items-center gap-4 border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                        >

                            <input
                                type="checkbox"
                                checked={selectedCandidates.includes(candidate.email)}
                                onChange={(e) => {

                                    if (e.target.checked) {
                                        setSelectedCandidates([
                                            ...selectedCandidates,
                                            candidate.email,
                                        ]);
                                    } else {
                                        setSelectedCandidates(
                                            selectedCandidates.filter(
                                                (email) => email !== candidate.email
                                            )
                                        );
                                    }

                                }}
                            />

                            <div>

                                <p className="font-medium">
                                    {candidate.name}
                                </p>

                                <p className="text-gray-500 text-sm">
                                    {candidate.email}
                                </p>

                            </div>

                        </label>

                    ))}

                </div>

                <div className="flex justify-end gap-3 mt-6">

                    <button
                        onClick={onClose}
                        className="border px-5 py-2 rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
    onClick={enrollCandidates}
    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
>
    Enroll Selected ({selectedCandidates.length})
</button>

                </div>

            </div>

        </div>
    );
}