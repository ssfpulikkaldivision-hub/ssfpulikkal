import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: {
                submissions: {
                    orderBy: { updatedAt: "desc" },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // Fetch all sectors and units to know who hasn't submitted yet
        const sectors = await prisma.sector.findMany({
            include: {
                units: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        secretaryName: true,
                        secretaryMobile: true,
                        presidentName: true,
                        presidentMobile: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ campaign, sectors });
    } catch (error: any) {
        console.error("Admin get campaign error:", error);
        return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const {
            title,
            description,
            category,
            targetAudience,
            startDate,
            endDate,
            status,
            bannerImage,
            attachmentUrl,
            formFields,
            targetValue,
            targetUnit,
        } = body;

        const updated = await prisma.campaign.update({
            where: { id },
            data: {
                title: title?.trim(),
                description: description?.trim(),
                category,
                targetAudience,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status,
                bannerImage: bannerImage || null,
                attachmentUrl: attachmentUrl || null,
                formFields: formFields ? (typeof formFields === "string" ? formFields : JSON.stringify(formFields)) : null,
                targetValue: targetValue !== undefined ? (targetValue ? Number(targetValue) : null) : undefined,
                targetUnit: targetUnit?.trim() || null,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Admin update campaign error:", error);
        return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await prisma.campaign.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: "Campaign deleted" });
    } catch (error: any) {
        console.error("Admin delete campaign error:", error);
        return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
    }
}
