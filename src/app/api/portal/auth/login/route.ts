import { NextRequest, NextResponse } from "next/server";
import { authenticatePortalEntity, signPortalToken, COOKIE_NAME } from "@/lib/portalAuth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { identifier, password } = body;

        if (!identifier || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            );
        }

        const result = await authenticatePortalEntity(identifier, password);

        if (!result.success || !result.session) {
            return NextResponse.json(
                { error: "Invalid username or password" },
                { status: 401 }
            );
        }

        const token = await signPortalToken(result.session);

        const response = NextResponse.json({
            success: true,
            session: result.session,
            message: "Login successful",
        });

        // Set secure HTTP-only cookie
        response.cookies.set({
            name: COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return response;
    } catch (error: any) {
        console.error("Portal login error:", error);
        return NextResponse.json(
            { error: error?.message || "Login failed. Please try again." },
            { status: 500 }
        );
    }
}
