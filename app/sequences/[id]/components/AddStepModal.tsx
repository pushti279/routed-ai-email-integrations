"use client";

import { useEffect, useState } from "react";

interface AddStepModalProps {
    open: boolean;
    onClose: () => void;
    sequenceId: number;
    onStepAdded: () => void;
}

export default function AddStepModal({
    open,
    onClose,
    sequenceId,
    onStepAdded,
}: AddStepModalProps) {

    const BACKEND_URL = "http://localhost:8000";

    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [delay, setDelay] = useState(0);

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

    const createStep = async () => {

        if (!selectedTemplate) {
            alert("Please select a template");
            return;
        }

        try {

            const res = await fetch(
                `${BACKEND_URL}/email-sequence-steps`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sequence_id: sequenceId,
                        template_id: Number(selectedTemplate),
                        delay_value: delay,
                        delay_unit: "days",
                    }),
                }
            );

            const data = await res.json();

            if (data.success) {

                onStepAdded();

                onClose();

                setSelectedTemplate("");
                setDelay(0);

            } else {
                alert(data.message);
            }

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (open) {
            loadTemplates();
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-xl shadow-xl w-[450px] p-6">

                <h2 className="text-2xl font-semibold mb-6">
                    Add Email Step
                </h2>

                <div className="space-y-4">

                    <div>

                        <label className="block text-sm font-medium mb-2">
                            Template
                        </label>

                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="w-full border rounded-lg p-3"
                        >

                            <option value="">
                                Select Template
                            </option>

                            {templates.map((template: any) => (
                                <option
                                    key={template.id}
                                    value={template.id.toString()}
                                >
                                    {template.template_name}
                                </option>
                            ))}

                        </select>

                    </div>

                    <div>

                        <label className="block text-sm font-medium mb-2">
                            Delay (Days)
                        </label>

                        <input
                            type="number"
                            value={delay}
                            onChange={(e) => setDelay(Number(e.target.value))}
                            className="w-full border rounded-lg p-3"
                        />

                    </div>

                </div>

                <div className="flex justify-end gap-3 mt-8">

                    <button
                        onClick={onClose}
                        className="border px-5 py-2 rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={createStep}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Add Step
                    </button>

                </div>

            </div>

        </div>
    );
}