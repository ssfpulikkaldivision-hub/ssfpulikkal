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

        const { searchParams } = new URL(request.url);
        const scope = searchParams.get("scope"); // 'all', 'mine', 'units'

        if (session.type === "SECTOR" && scope === "units") {
            const submissions = await prisma.campaignSubmission.findMany({
                where: {
                    sectorId: session.id,
                    entityType: "UNIT",
                },
                include: {
                    campaign: {
                        select: {
                            id: true,
                            title: true,
                            category: true,
                            status: true,
                            targetValue: true,
                            targetUnit: true,
                        },
                    },
                },
                orderBy: { updatedAt: "desc" },
            });
            return NextResponse.json({ submissions });
        }

        // Default: My submissions
        const submissions = await prisma.campaignSubmission.findMany({
            where: {
                entityType: session.type,
                entityId: session.id,
            },
            include: {
                campaign: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        status: true,
                        targetValue: true,
                        targetUnit: true,
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json({ submissions });
    } catch (error: any) {
        console.error("Fetch submissions error:", error);
        return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getPortalSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { campaignId, values, submittedBy, submittedMobile, numericValue, attachments } = body;

        if (!campaignId) {
            return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
        }

        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        if (campaign.status === "COMPLETED" || campaign.status === "ARCHIVED") {
            return NextResponse.json({ error: "This campaign is completed. New submissions are not accepted." }, { status: 400 });
        }

        const valuesString = typeof values === "string" ? values : JSON.stringify(values || {});
        const attachmentsString = attachments ? (typeof attachments === "string" ? attachments : JSON.stringify(attachments)) : null;

        // Calculate numeric value if not passed
        let parsedNumeric: number | null = null;
        if (numericValue !== undefined && numericValue !== null && !isNaN(Number(numericValue))) {
            parsedNumeric = Number(numericValue);
        } else if (typeof values === "object" && values !== null) {
            // Check for common numeric field keys like count, amount, total, value, kits
            for (const key of ["count", "amount", "total", "kits", "members", "value"]) {
                if (values[key] !== undefined && values[key] !== "" && !isNaN(Number(values[key]))) {
                    parsedNumeric = Number(values[key]);
                    break;
                }
            }
        }

        const submission = await prisma.campaignSubmission.upsert({
            where: {
                campaignId_entityType_entityId: {
                    campaignId,
                    entityType: session.type,
                    entityId: session.id,
                },
            },
            create: {
                campaignId,
                entityType: session.type,
                entityId: session.id,
                entityName: session.name,
                sectorId: session.sectorId,
                sectorName: session.sectorName,
                unitId: session.type === "UNIT" ? session.id : null,
                unitName: session.type === "UNIT" ? session.name : null,
                submittedBy: submittedBy?.trim() || session.name,
                submittedMobile: submittedMobile?.trim() || null,
                values: valuesString,
                numericValue: parsedNumeric,
                attachments: attachmentsString,
                status: "SUBMITTED",
            },
            update: {
                entityName: session.name,
                sectorName: session.sectorName,
                unitName: session.type === "UNIT" ? session.name : null,
                submittedBy: submittedBy?.trim() || session.name,
                submittedMobile: submittedMobile?.trim() || null,
                values: valuesString,
                numericValue: parsedNumeric,
                attachments: attachmentsString,
                status: "SUBMITTED",
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            submission,
            message: "Report submitted successfully",
        });
    } catch (error: any) {
        console.error("Submit campaign error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to submit report. Please try again." },
            { status: 500 }
        );
    }
}
