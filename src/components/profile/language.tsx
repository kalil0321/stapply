import { X } from "lucide-react";
import { PROFICIENCY_LEVELS, COMMON_LANGUAGES } from "@/lib/profile-constants";

interface LanguageProps {
    index: number;
    register: any;
    onRemove: () => void;
    canRemove: boolean;
    errors?: any;
}

export function Language({
    index,
    register,
    onRemove,
    canRemove,
    errors,
}: LanguageProps) {
    return (
        <div className="flex items-center gap-4 rounded-lg">
            <div className="flex-1">
                <select
                    {...register(`languages.${index}.language`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">Select language</option>
                    {COMMON_LANGUAGES.map((language) => (
                        <option key={language} value={language}>
                            {language}
                        </option>
                    ))}
                </select>
                {errors?.language && (
                    <p className="mt-1 text-sm text-red-600">
                        {errors.language.message}
                    </p>
                )}
            </div>

            <div className="flex-1">
                <select
                    {...register(`languages.${index}.proficiency`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {PROFICIENCY_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                            {level.label}
                        </option>
                    ))}
                </select>
                {errors?.proficiency && (
                    <p className="mt-1 text-sm text-red-600">
                        {errors.proficiency.message}
                    </p>
                )}
            </div>

            {canRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-red-600 hover:text-red-800 p-1"
                    aria-label={`Remove language ${index + 1}`}
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
