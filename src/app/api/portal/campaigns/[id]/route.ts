import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portalAuth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getPortalSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const campaign = await prisma.campaign.findUnique({
            where: { id },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // Fetch my submission
        const mySubmission = await prisma.campaignSubmission.findFirst({
            where: {
                campaignId: id,
                entityType: session.type,
                entityId: session.id,
            },
        });

        // If sector or division, fetch units and their submission status
        let unitSubmissions: any[] = [];
        if (session.type === "SECTOR" || session.type === "DIVISION") {
            const units = await prisma.unit.findMany({
                where: session.type === "SECTOR" ? { sectorId: session.id } : {},
                include: { sector: true },
                orderBy: { name: "asc" },
            });

            const unitSubs = await prisma.campaignSubmission.findMany({
                where: {
                    campaignId: id,
                    entityType: "UNIT",
                    entityId: { in: units.map((u) => u.id) },
                },
            });

            const subMap = new Map();
            for (const s of unitSubs) {
                subMap.set(s.entityId, s);
            }

            unitSubmissions = units.map((u) => ({
                unit: {
                    id: u.id,
                    name: u.name,
                    code: u.code,
                    sectorName: u.sector?.name || "",
                },
                submission: subMap.get(u.id) || null,
                isSubmitted: subMap.has(u.id),
            }));
        }

        return NextResponse.json({
            campaign,
            mySubmission,
            isSubmitted: !!mySubmission,
            unitSubmissions,
        });
    } catch (error: any) {
        console.error("Get campaign details error:", error);
        return NextResponse.json({ error: "Failed to fetch campaign details" }, { status: 500 });
    }
}
