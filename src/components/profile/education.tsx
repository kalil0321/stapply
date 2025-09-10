import { X } from "lucide-react";

interface EducationProps {
    index: number;
    register: any;
    onRemove: () => void;
    canRemove: boolean;
    errors?: any;
}

export function Education({
    index,
    register,
    onRemove,
    canRemove,
    errors,
}: EducationProps) {
    return (
        <div>
            <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium text-gray-900">
                    Education {index + 1}
                </h4>
                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-red-600 hover:text-red-800"
                        aria-label={`Remove education ${index + 1}`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Degree
                    </label>
                    <input
                        {...register(`education.${index}.degree`)}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bachelor of Science in Computer Science"
                    />
                    {errors?.degree && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.degree.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Institution
                    </label>
                    <input
                        {...register(`education.${index}.institution`)}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="University of Technology"
                    />
                    {errors?.institution && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.institution.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Date
                    </label>
                    <input
                        {...register(`education.${index}.startDate`)}
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
                        {...register(`education.${index}.endDate`)}
                        type="month"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors?.endDate && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.endDate.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        GPA (Optional)
                    </label>
                    <input
                        {...register(`education.${index}.gpa`)}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="3.8"
                    />
                    {errors?.gpa && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.gpa.message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
