import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import slugify from "slugify";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const campaigns = await prisma.campaign.findMany({
            include: {
                submissions: {
                    select: {
                        id: true,
                        entityType: true,
                        entityId: true,
                        entityName: true,
                        sectorName: true,
                        unitName: true,
                        numericValue: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        });

        // Summary counts
        const totalSectors = await prisma.sector.count();
        const totalUnits = await prisma.unit.count();

        const enriched = campaigns.map((c) => {
            const sectorSubmissions = c.submissions.filter((s) => s.entityType === "SECTOR").length;
            const unitSubmissions = c.submissions.filter((s) => s.entityType === "UNIT").length;
            const totalNumeric = c.submissions.reduce((acc, s) => acc + (s.numericValue || 0), 0);

            const expectedCount =
                c.targetAudience === "SECTOR_ONLY"
                    ? totalSectors
                    : c.targetAudience === "UNIT_ONLY"
                    ? totalUnits
                    : totalSectors + totalUnits;

            return {
                ...c,
                totalSubmissions: c.submissions.length,
                sectorSubmissions,
                unitSubmissions,
                totalNumeric,
                expectedCount,
                completionPercentage: expectedCount > 0 ? Math.min(100, Math.round((c.submissions.length / expectedCount) * 100)) : 0,
            };
        });

        return NextResponse.json({
            campaigns: enriched,
            totalSectors,
            totalUnits,
        });
    } catch (error: any) {
        console.error("Admin fetch campaigns error:", error);
        return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            title,
            description,
            category = "GENERAL",
            targetAudience = "ALL",
            startDate,
            endDate,
            status = "ACTIVE",
            bannerImage,
            attachmentUrl,
            formFields,
            targetValue,
            targetUnit,
        } = body;

        if (!title || !description) {
            return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
        }

        const asciiSlug = slugify(title, { lower: true, strict: true });
        const baseSlug = asciiSlug && asciiSlug.length > 2 ? asciiSlug : `campaign-${Date.now().toString(36)}`;
        let uniqueSlug = baseSlug;
        let counter = 1;

        while (await prisma.campaign.findUnique({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
        }

        const campaign = await prisma.campaign.create({
            data: {
                title: title.trim(),
                slug: uniqueSlug,
                description: description.trim(),
                category,
                targetAudience,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status,
                bannerImage: bannerImage || null,
                attachmentUrl: attachmentUrl || null,
                formFields: formFields ? (typeof formFields === "string" ? formFields : JSON.stringify(formFields)) : null,
                targetValue: targetValue ? Number(targetValue) : null,
                targetUnit: targetUnit?.trim() || null,
            },
        });

        return NextResponse.json(campaign, { status: 201 });
    } catch (error: any) {
        console.error("Admin create campaign error:", error);
        return NextResponse.json({ error: error?.message || "Failed to create campaign" }, { status: 500 });
    }
}
