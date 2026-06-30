interface StepCardProps {
    step: any;
}

export default function StepCard({
    step,
}: StepCardProps) {
    return (
        <div className="border rounded-xl bg-white shadow-sm p-5">

            <div className="flex justify-between items-start">

                <div>

                    <span className="text-xs font-semibold text-blue-600 uppercase">
                        Step {step.step_number}
                    </span>

                    <h2 className="mt-2 text-lg font-semibold">
                        Email
                    </h2>

                    <p className="mt-2 text-gray-700">
                        {step.template_name}
                    </p>

                    <p className="mt-3 text-sm text-gray-500">
                        {step.delay_value === 0
                            ? "Immediately"
                            : `After ${step.delay_value} ${step.delay_unit}`
                        }
                    </p>

                </div>

                <button
                    className="text-sm text-blue-600 hover:underline"
                >
                    Edit
                </button>

            </div>

        </div>
    );
}