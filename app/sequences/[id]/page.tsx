"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SequenceHeader from "./components/SequenceHeader";
import StepCard from "./components/StepCard";
import AddStepModal from "./components/AddStepModal";
import CandidatesModal from "./components/CandidatesModal";


export default function SequenceBuilderPage() {
    const params = useParams();

    const BACKEND_URL = "http://localhost:8000";

    const [sequence, setSequence] = useState<any>(null);
    const [steps, setSteps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddStepModal, setShowAddStepModal] = useState(false);
    const [showCandidatesModal, setShowCandidatesModal] = useState(false);

    const loadSequence = async () => {
        try {
            const res = await fetch(
                `${BACKEND_URL}/sequence-builder/${params.id}`,
                {
                    credentials: "include",
                }
            );

            const data = await res.json();

            console.log("BUILDER:", data);

            if (data.success) {
                setSequence(data.data.sequence);
                setSteps(data.data.steps);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startSequence = async () => {
    try {
        const res = await fetch(
            `${BACKEND_URL}/email-sequences/${params.id}/start`,
            {
                method: "POST",
                credentials: "include",
            }
        );

        const data = await res.json();

        console.log("START:", data);

        if (data.success) {
            alert("Sequence Started Successfully");
            loadSequence();
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error(error);
    }
};



    useEffect(() => {
        loadSequence();
    }, []);

    return (
        <div className="p-8">
            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <SequenceHeader
    sequence={sequence}
    onAddStep={() => setShowAddStepModal(true)}
    onAddCandidates={() => setShowCandidatesModal(true)}
    onStart={startSequence}
/>

                    <div className="space-y-6">
                        {steps.map((step: any) => (
                            <StepCard
                                key={step.id}
                                step={step}
                            />
                        ))}
                    </div>
                </>
            )}
       <AddStepModal
    open={showAddStepModal}
    onClose={() => setShowAddStepModal(false)}
    sequenceId={sequence?.id || 0}
    onStepAdded={loadSequence}
/>

<CandidatesModal
    open={showCandidatesModal}
    onClose={() => setShowCandidatesModal(false)}
    sequenceId={sequence?.id || 0}
/>

</div>
);
}