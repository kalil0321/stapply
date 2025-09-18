"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Stapply } from "@/components/logo";
import { GOOGLE, GITHUB } from "@/components/icons";
import { authClient } from "@/lib/auth/client";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") || "/";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        await authClient.signIn.email({
            email,
            password,
            callbackURL: redirectUrl,
            },
            {
                onError: (ctx) => {
                    console.log(ctx.error);
                    setError(ctx.error.message || "An error occurred");
                },
            }
        );
        
        setLoading(false);
    };

    const handleSocialAuth = async (provider: "google" | "github") => {
        setLoading(true);
        setError("");

            if (provider === "google") {
                await authClient.signIn.social({
                    provider: "google",
                    callbackURL: redirectUrl,
                }, {
                    onError: (ctx) => {
                        setError(ctx.error.message);
                    },
                });
            } else {
                await authClient.signIn.social({
                    provider: "github",
                    callbackURL: redirectUrl,
                }, {
                    onError: (ctx) => {
                        setError(ctx.error.message);
                    },
                });
            }

        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center">
            <Card className="w-full min-w-100 rounded-4xl px-6 py-10 pt-8">
                <CardContent>
                    <div className="flex flex-col items-center space-y-4">
                        <Stapply className="text-4xl" showDocs />

                        <div className="space-y-2 text-center">
                            <h1 className="text-3xl font-semibold text-foreground">
                                Welcome back!
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                First time here?{" "}
                                <a
                                    href={`/sign-up${redirectUrl !== "/" ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`}
                                    className="text-foreground hover:underline"
                                >
                                    Sign up
                                </a>
                            </p>
                        </div>

                        {error && (
                            <div className="w-full p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                                {error}
                            </div>
                        )}

                        <form
                            className="w-full space-y-4"
                            onSubmit={handleSubmit}
                        >
                            <Input
                                type="email"
                                placeholder="Your email"
                                className="w-full rounded-xl"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                disabled={loading}
                                required
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                className="w-full rounded-xl"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                disabled={loading}
                                required
                            />
                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-full rounded-xl"
                                    size="lg"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? "Signing in..." : "Sign in"}
                                </Button>
                                <Button
                                    variant="link"
                                    className="w-full text-sm text-muted-foreground"
                                    type="button"
                                    disabled={loading}
                                >
                                    Forgot your password?
                                </Button>
                            </div>

                            <div className="flex items-center gap-4 py-2">
                                <Separator className="flex-1" />
                                <span className="text-sm text-muted-foreground">
                                    OR
                                </span>
                                <Separator className="flex-1" />
                            </div>

                            <Button
                                variant="outline"
                                className="w-full rounded-xl"
                                size="lg"
                                type="button"
                                disabled={loading}
                                onClick={() => handleSocialAuth("google")}
                            >
                                <GOOGLE className="w-4 h-4 mr-2" />
                                Continue with Google
                            </Button>
                            {/* <Button
                                variant="outline"
                                className="w-full rounded-xl"
                                size="lg"
                                type="button"
                                disabled={loading}
                                onClick={() => handleSocialAuth("github")}
                            >
                                <GITHUB className="w-4 h-4 mr-2" />
                                Continue with GitHub
                            </Button> */}
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
