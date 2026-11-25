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
            session.type === "DIVISION"
                ? { in: ["ALL", "SECTOR_ONLY", "UNIT_ONLY"] }
                : session.type === "SECTOR"
                ? { in: ["ALL", "SECTOR_ONLY"] }
                : { in: ["ALL", "UNIT_ONLY"] };

        // Fetch campaigns matching audience
        const campaigns = await prisma.campaign.findMany({
            where: {
                targetAudience: audienceFilter,
                status: { not: "ARCHIVED" },
            },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        });

        // Fetch submissions for this entity
        const mySubmissions = await prisma.campaignSubmission.findMany({
            where: {
                entityType: session.type,
                entityId: session.id,
            },
        });

        const submissionMap = new Map();
        for (const sub of mySubmissions) {
            submissionMap.set(sub.campaignId, sub);
        }

        // If sector or division, also get unit submission progress per campaign
        let unitSubmissionsCountByCampaign: Record<string, { totalUnits: number; submittedUnits: number }> = {};
        if (session.type === "SECTOR" || session.type === "DIVISION") {
            const unitsInScope = await prisma.unit.findMany({
                where: session.type === "SECTOR" ? { sectorId: session.id } : {},
                select: { id: true },
            });
            const unitIds = unitsInScope.map((u) => u.id);
            const totalUnits = unitIds.length;

            const unitSubs = await prisma.campaignSubmission.findMany({
                where: {
                    entityType: "UNIT",
                    entityId: { in: unitIds },
                },
                select: { campaignId: true, entityId: true },
            });

            for (const c of campaigns) {
                const subsForC = unitSubs.filter((s) => s.campaignId === c.id);
                const uniqueSubmittedUnits = new Set(subsForC.map((s) => s.entityId)).size;
                unitSubmissionsCountByCampaign[c.id] = {
                    totalUnits,
                    submittedUnits: uniqueSubmittedUnits,
                };
            }
        }

        const enrichedCampaigns = campaigns.map((c) => {
            const mySub = submissionMap.get(c.id) || null;
            return {
                ...c,
                mySubmission: mySub,
                isSubmitted: !!mySub,
                unitStats:
                    session.type === "SECTOR" || session.type === "DIVISION"
                        ? unitSubmissionsCountByCampaign[c.id] || null
                        : null,
            };
        });

        return NextResponse.json({
            campaigns: enrichedCampaigns,
            stats: {
                totalActive: campaigns.filter((c) => c.status === "ACTIVE").length,
                submittedCount: mySubmissions.length,
            },
        });
    } catch (error: any) {
        console.error("Fetch portal campaigns error:", error);
        return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }
}
