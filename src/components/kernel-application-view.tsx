import { Application } from "@/lib/types";

export function KernelApplicationView({ application, isLoading, error }: { application: Application, isLoading: boolean, error: Error | null }) {
    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error: {error.message}</div>;
    }


    // TODO: add buttons to switch from live to replay
    return (
        <div>
            <iframe src={application.status === "completed" ? application.replayUrl : application.liveUrl} className="w-full h-full border border-border rounded-lg" />
        </div>
    );
}