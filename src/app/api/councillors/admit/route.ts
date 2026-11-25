import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeMobile } from "@/lib/councillor-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { code } = body;

        if (!code || typeof code !== "string" || !code.trim()) {
            return NextResponse.json({ error: "Code, ticket number, or mobile is required" }, { status: 400 });
        }

        code = code.trim();

        // If code is a full URL or ticket query like https://.../tickets?code=DSC-26-0001
        if (code.includes("code=")) {
            const match = code.match(/code=([^&]+)/);
            if (match) code = decodeURIComponent(match[1]);
        } else if (code.includes("/verify/")) {
            const parts = code.split("/verify/");
            if (parts[1]) code = parts[1].split(/[?#]/)[0];
        }

        // Try finding by ticketNumber (case-insensitive)
        let councillor = await prisma.councillor.findFirst({
            where: {
                OR: [
                    { ticketNumber: { equals: code } },
                    { id: { equals: code } },
                ],
            },
        });

        // If not found, try matching mobile
        if (!councillor) {
            const normMobile = normalizeMobile(code);
            if (normMobile.length >= 7) {
                councillor = await prisma.councillor.findFirst({
                    where: { mobile: normMobile },
                });
            }
        }

        if (!councillor) {
            return NextResponse.json(
                { error: `No councillor found matching "${code}"` },
                { status: 404 }
            );
        }

        const wasAlreadyAdmitted = councillor.isAdmitted;

        // Mark as admitted
        const updated = await prisma.councillor.update({
            where: { id: councillor.id },
            data: {
                isAdmitted: true,
                admittedAt: councillor.admittedAt || new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            alreadyAdmitted: wasAlreadyAdmitted,
            councillor: updated,
            message: wasAlreadyAdmitted
                ? `Already admitted on ${new Date(councillor.admittedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Successfully admitted ${updated.name}!`,
        });
    } catch (error: any) {
        console.error("Admit error:", error);
        return NextResponse.json(
            { error: "Failed to process admission", details: error?.message },
            { status: 500 }
        );
    }
}
