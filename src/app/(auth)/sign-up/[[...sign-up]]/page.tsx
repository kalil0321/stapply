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

export default function SignUpPage() {
    const [name, setName] = useState("");
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

        await authClient.signUp.email(
            {
                email,
                password,
                name,
                callbackURL: redirectUrl,
            },
            {
                onError: (ctx) => {
                    setError(ctx.error.message);
                },
            }
        );

        setLoading(false);
    };

    const handleSocialAuth = async (provider: "google" | "github") => {
        setLoading(true);
        setError("");

        try {
            if (provider === "google") {
                await authClient.signIn.social({
                    provider: "google",
                    callbackURL: redirectUrl,
                });
            } else {
                await authClient.signIn.social({
                    provider: "github",
                    callbackURL: redirectUrl,
                });
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : `An error occurred during ${provider} sign up`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center">
            <Card className="w-full max-w-xl rounded-4xl px-6 py-10 pt-14 shadow-none border-none">
                <CardContent>
                    <div className="flex flex-col items-center space-y-4">
                        <Stapply className="text-4xl" />

                        <div className="space-y-2 text-center">
                            <h1 className="text-3xl font-semibold text-foreground">
                                Create your account
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Already have an account?{" "}
                                <a
                                    href={`/sign-in${
                                        redirectUrl !== "/"
                                            ? `?redirect_url=${encodeURIComponent(
                                                  redirectUrl
                                              )}`
                                            : ""
                                    }`}
                                    className="text-foreground hover:underline"
                                >
                                    Sign in
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
                                type="text"
                                placeholder="Your full name"
                                className="w-full rounded-xl"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                disabled={loading}
                                required
                            />
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
                                placeholder="Create a password"
                                className="w-full rounded-xl"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                disabled={loading}
                                required
                            />
                            <Button
                                className="w-full rounded-xl"
                                size="lg"
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating account..."
                                    : "Create account"}
                            </Button>

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

                        <p className="text-center text-xs w-11/12 text-muted-foreground">
                            By creating an account, you acknowledge that you
                            read, and agree, to our{" "}
                            <a
                                href="/tos"
                                className="underline hover:text-foreground"
                            >
                                Terms of Service
                            </a>{" "}
                            and our{" "}
                            <a
                                href="/privacy"
                                className="underline hover:text-foreground"
                            >
                                Privacy Policy
                            </a>
                            .
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
