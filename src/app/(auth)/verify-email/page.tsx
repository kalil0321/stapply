"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { authClient, useSession } from "@/lib/auth/client";

export default function VerifyEmailPage() {
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [verified, setVerified] = useState(false);
    
    const { data: session, isPending } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");

    useEffect(() => {
        // If no session, redirect to sign in
        if (!isPending && !session?.user) {
            router.push("/sign-in");
            return;
        }

        // If email is already verified, redirect to dashboard
        if (session?.user?.emailVerified) {
            router.push("/");
            return;
        }

        // Set error from URL params
        if (errorParam) {
            setError(errorParam === "invalid-token" 
                ? "Invalid or expired verification link. Please request a new one."
                : "Verification failed. Please try again."
            );
        }

        // Handle verification token if present
        if (token && session?.user) {
            handleVerification(token);
        }
    }, [session, isPending, token, errorParam, router]);

    const handleVerification = async (verificationToken: string) => {
        setLoading(true);
        setError("");
        
        try {
            // Call the better-auth API endpoint directly
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: verificationToken }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setVerified(true);
                setMessage("Your email has been successfully verified!");
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    router.push("/");
                }, 2000);
            } else {
                setError(result.message || "Verification failed. Please try again.");
            }
        } catch (verifyError: any) {
            console.error("Email verification failed:", verifyError);
            setError("Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!session?.user?.email) return;
        
        setResendLoading(true);
        setError("");
        setMessage("");

        try {
            // Call the better-auth API endpoint directly
            const response = await fetch('/api/auth/send-verification-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: session.user.email }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage("Verification email sent! Please check your inbox.");
            } else {
                setError(result.message || "Failed to send verification email. Please try again.");
            }
        } catch (resendError: any) {
            console.error("Failed to resend verification email:", resendError);
            setError("Failed to send verification email. Please try again.");
        } finally {
            setResendLoading(false);
        }
    };

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/sign-in");
    };

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (verified) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-green-900">Email Verified!</CardTitle>
                        <CardDescription>
                            Your email has been successfully verified. You can now access all features.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            className="w-full" 
                            onClick={() => router.push("/")}
                        >
                            Continue to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Verify Your Email</CardTitle>
                    <CardDescription>
                        We&apos;ve sent a verification email to <strong>{session?.user?.email}</strong>. 
                        Please check your inbox and click the verification link to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading && (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Verifying email...</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-700">{error}</span>
                        </div>
                    )}

                    {message && (
                        <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700">{message}</span>
                        </div>
                    )}
                    
                    <div className="text-sm text-gray-600 space-y-2">
                        <p>Didn&apos;t receive the email?</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Check your spam folder</li>
                            <li>Make sure {session?.user?.email} is correct</li>
                            <li>Try resending the verification email</li>
                        </ul>
                    </div>

                    <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleResendVerification}
                        disabled={resendLoading || loading}
                    >
                        {resendLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Sending...
                            </>
                        ) : (
                            "Resend Verification Email"
                        )}
                    </Button>
                    
                    <div className="pt-4 border-t">
                        <Button 
                            variant="ghost" 
                            className="w-full" 
                            onClick={handleSignOut}
                            disabled={loading}
                        >
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}