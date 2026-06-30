"use client";

interface SequenceHeaderProps {
    sequence: any;
    onAddStep: () => void;
    onAddCandidates: () => void;
    onStart: () => void;
}

export default function SequenceHeader({
    sequence,
    onAddStep,
    onAddCandidates,
    onStart,
}: SequenceHeaderProps) {

    const rawStatus = sequence?.status || "draft";

    const status =
        rawStatus === "active"
            ? "draft"
            : rawStatus;

    const statusConfig = {
        draft: {
            icon: "🟡",
            label: "Draft",
            color: "text-yellow-600",
        },
        running: {
            icon: "🟢",
            label: "Running",
            color: "text-green-600",
        },
        paused: {
            icon: "🔵",
            label: "Paused",
            color: "text-blue-600",
        },
        completed: {
            icon: "✅",
            label: "Completed",
            color: "text-gray-600",
        },
    };

    const current =
        statusConfig[status as keyof typeof statusConfig] ||
        statusConfig.draft;

    return (
        <div className="flex items-center justify-between mb-8">

            <div>
                <h1 className="text-3xl font-bold">
                    {sequence.name}
                </h1>

                <p className="text-gray-500 mt-1">
                    Mailbox: {sequence.mailbox_email}
                </p>

                <p className={`mt-2 font-medium ${current.color}`}>
                    {current.icon} {current.label}
                </p>
            </div>

            <div className="flex gap-3">

                <button
                    onClick={onAddStep}
                    className="border px-5 py-2 rounded-lg hover:bg-gray-100"
                >
                    + Add Step
                </button>

                <button
                    onClick={onAddCandidates}
                    className="border px-5 py-2 rounded-lg hover:bg-gray-100"
                >
                    + Candidates
                </button>

                {(status === "draft") && (
                    <button
                        onClick={onStart}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
                    >
                        ▶ Start Sequence
                    </button>
                )}

                {status === "running" && (
                    <button
                        disabled
                        className="bg-green-100 text-green-700 px-5 py-2 rounded-lg cursor-default"
                    >
                        🟢 Running
                    </button>
                )}

                {status === "paused" && (
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                    >
                        ▶ Resume
                    </button>
                )}

                {status === "completed" && (
                    <button
                        disabled
                        className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg cursor-default"
                    >
                        ✅ Completed
                    </button>
                )}

            </div>

        </div>
    );
}