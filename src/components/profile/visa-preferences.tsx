import { Shield } from "lucide-react";

interface VisaPreferencesProps {
    register: any;
    errors?: any;
}

export function VisaPreferences({ register, errors }: VisaPreferencesProps) {
    return (
        <section className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Visa & Location Preferences
            </h3>
            <div className="space-y-4">
                <div className="flex items-center">
                    <input
                        {...register("willingToRelocate")}
                        type="checkbox"
                        id="willingToRelocate"
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                        htmlFor="willingToRelocate"
                        className="text-sm font-medium text-gray-700"
                    >
                        Willing to relocate
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center">
                        <input
                            {...register("requiresEuVisa")}
                            type="checkbox"
                            id="requiresEuVisa"
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                            htmlFor="requiresEuVisa"
                            className="text-sm text-gray-700"
                        >
                            Requires EU visa
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            {...register("requiresUkVisa")}
                            type="checkbox"
                            id="requiresUkVisa"
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                            htmlFor="requiresUkVisa"
                            className="text-sm text-gray-700"
                        >
                            Requires UK visa
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            {...register("requiresChVisa")}
                            type="checkbox"
                            id="requiresChVisa"
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                            htmlFor="requiresChVisa"
                            className="text-sm text-gray-700"
                        >
                            Requires CH visa
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            {...register("requiresOtherVisa")}
                            type="checkbox"
                            id="requiresOtherVisa"
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                            htmlFor="requiresOtherVisa"
                            className="text-sm text-gray-700"
                        >
                            Requires other visa
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other visa details
                    </label>
                    <textarea
                        {...register("otherVisaDetails")}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Please specify any other visa requirements or details..."
                    />
                    {errors?.otherVisaDetails && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.otherVisaDetails.message}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
