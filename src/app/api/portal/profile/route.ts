import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portalAuth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
    try {
        const session = await getPortalSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { presidentName, presidentMobile, secretaryName, secretaryMobile, notes } = body;

        if (session.type === "SECTOR") {
            const updated = await prisma.sector.update({
                where: { id: session.id },
                data: {
                    presidentName: presidentName?.trim() || null,
                    presidentMobile: presidentMobile?.trim() || null,
                    secretaryName: secretaryName?.trim() || null,
                    secretaryMobile: secretaryMobile?.trim() || null,
                    notes: notes?.trim() || null,
                },
            });

            return NextResponse.json({ success: true, entity: updated });
        } else {
            const updated = await prisma.unit.update({
                where: { id: session.id },
                data: {
                    presidentName: presidentName?.trim() || null,
                    presidentMobile: presidentMobile?.trim() || null,
                    secretaryName: secretaryName?.trim() || null,
                    secretaryMobile: secretaryMobile?.trim() || null,
                    notes: notes?.trim() || null,
                },
            });

            return NextResponse.json({ success: true, entity: updated });
        }
    } catch (error: any) {
        console.error("Update profile error:", error);
        return NextResponse.json({ error: "Failed to update profile information" }, { status: 500 });
    }
}
