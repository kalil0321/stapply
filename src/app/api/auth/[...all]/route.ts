import { NextResponse } from "next/server";

export const GET = async () =>
    NextResponse.json({ error: "Auth disabled" }, { status: 404 });
export const POST = async () =>
    NextResponse.json({ error: "Auth disabled" }, { status: 404 });
