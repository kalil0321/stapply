import { Link } from "lucide-react";

interface ProfessionalLinksProps {
    register: any;
    errors?: any;
}

export function ProfessionalLinks({
    register,
    errors,
}: ProfessionalLinksProps) {
    return (
        <section className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Link className="w-5 h-5 mr-2" />
                Professional Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        LinkedIn Profile
                    </label>
                    <input
                        {...register("linkedinUrl")}
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://linkedin.com/in/johndoe"
                    />
                    {errors?.linkedinUrl && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.linkedinUrl.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Portfolio/Website
                    </label>
                    <input
                        {...register("portfolioUrl")}
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://johndoe.com"
                    />
                    {errors?.portfolioUrl && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.portfolioUrl.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        GitHub Profile
                    </label>
                    <input
                        {...register("githubUrl")}
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://github.com/johndoe"
                    />
                    {errors?.githubUrl && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.githubUrl.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other Profile
                    </label>
                    <input
                        {...register("otherUrl")}
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://..."
                    />
                    {errors?.otherUrl && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.otherUrl.message}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
