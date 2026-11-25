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

        if (session.type !== "SECTOR" && session.type !== "DIVISION") {
            return NextResponse.json({ error: "Only sector and division accounts can access units" }, { status: 403 });
        }

        const units = await prisma.unit.findMany({
            where: session.type === "SECTOR" ? { sectorId: session.id } : {},
            include: { sector: true },
            orderBy: { name: "asc" },
        });

        // Get active campaigns for units
        const activeCampaigns = await prisma.campaign.findMany({
            where: {
                status: "ACTIVE",
                targetAudience: { in: ["ALL", "UNIT_ONLY"] },
            },
            orderBy: { createdAt: "desc" },
        });

        // Get all unit submissions
        const submissions = await prisma.campaignSubmission.findMany({
            where: {
                entityType: "UNIT",
                ...(session.type === "SECTOR" ? { sectorId: session.id } : {}),
            },
        });

        const unitsData = units.map((unit) => {
            const unitSubs = submissions.filter((s) => s.entityId === unit.id);
            const submittedCampaignIds = new Set(unitSubs.map((s) => s.campaignId));

            const campaignStatuses = activeCampaigns.map((c) => ({
                campaignId: c.id,
                campaignTitle: c.title,
                isSubmitted: submittedCampaignIds.has(c.id),
                submission: unitSubs.find((s) => s.campaignId === c.id) || null,
            }));

            const completedCount = campaignStatuses.filter((c) => c.isSubmitted).length;

            return {
                id: unit.id,
                name: unit.name,
                code: unit.code,
                username: unit.username,
                campaignStatuses,
                totalActiveCampaigns: activeCampaigns.length,
                completedCampaignsCount: completedCount,
                pendingCampaignsCount: activeCampaigns.length - completedCount,
            };
        });

        return NextResponse.json({
            units: unitsData,
            activeCampaigns,
            stats: {
                totalUnits: units.length,
                activeCampaignsCount: activeCampaigns.length,
            },
        });
    } catch (error: any) {
        console.error("Fetch sector units error:", error);
        return NextResponse.json({ error: "Failed to fetch sector units" }, { status: 500 });
    }
}
