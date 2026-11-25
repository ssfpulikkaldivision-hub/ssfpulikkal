import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portalAuth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const session = await getPortalSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const audienceFilter =
            session.type === "SECTOR"
                ? { in: ["ALL", "SECTOR_ONLY"] }
                : { in: ["ALL", "UNIT_ONLY"] };

        const notices = await prisma.portalNotice.findMany({
            where: {
                targetAudience: audienceFilter,
            },
            orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
            take: 20,
        });

        return NextResponse.json({ notices });
    } catch (error: any) {
        console.error("Fetch portal notices error:", error);
        return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
    }
}
