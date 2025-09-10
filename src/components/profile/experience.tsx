import { X } from "lucide-react";

interface ExperienceProps {
    index: number;
    register: any;
    onRemove: () => void;
    canRemove: boolean;
    errors?: any;
}

export function Experience({
    index,
    register,
    onRemove,
    canRemove,
    errors,
}: ExperienceProps) {
    return (
        <div>
            <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium text-gray-900">
                    Experience {index + 1}
                </h4>
                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-red-600 hover:text-red-800"
                        aria-label={`Remove experience ${index + 1}`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Job Title
                    </label>
                    <input
                        {...register(`experiences.${index}.title`)}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Software Engineer"
                    />
                    {errors?.title && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.title.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Company
                    </label>
                    <input
                        {...register(`experiences.${index}.company`)}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tech Corp"
                    />
                    {errors?.company && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.company.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Date
                    </label>
                    <input
                        {...register(`experiences.${index}.startDate`)}
                        type="month"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors?.startDate && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.startDate.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        End Date
                    </label>
                    <input
                        {...register(`experiences.${index}.endDate`)}
                        type="month"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors?.endDate && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.endDate.message}
                        </p>
                    )}

                    <label className="flex items-center mt-2">
                        <input
                            {...register(`experiences.${index}.current`)}
                            type="checkbox"
                            className="mr-2"
                        />
                        <span className="text-xs text-gray-600">
                            Currently working here
                        </span>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    {...register(`experiences.${index}.description`)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your responsibilities and achievements..."
                />
                {errors?.description && (
                    <p className="mt-1 text-sm text-red-600">
                        {errors.description.message}
                    </p>
                )}
            </div>
        </div>
    );
}
