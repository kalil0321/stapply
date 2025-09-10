import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";

interface SkillInputProps {
    onAddSkill: (skill: string) => void;
}

export function SkillInput({ onAddSkill }: SkillInputProps) {
    const { register, setValue, getValues, reset } = useForm<{
        skill: string;
    }>();

    const handleAddSkill = () => {
        const skillValue = getValues("skill")?.trim();
        if (skillValue) {
            onAddSkill(skillValue);
            reset();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddSkill();
        }
    };

    return (
        <div className="flex gap-2">
            <input
                {...register("skill", { required: true })}
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a skill"
                onKeyDown={handleKeyDown}
            />
            <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                aria-label="Add skill"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}
