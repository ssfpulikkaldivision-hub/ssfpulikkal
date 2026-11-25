import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET() {
    try {
        const settings = await prisma.litFestSettings.findUnique({
            where: { id: "litfest-settings" },
        });
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (updateData.countdownDate) {
            updateData.countdownDate = new Date(updateData.countdownDate);
        }

        const settings = await prisma.litFestSettings.upsert({
            where: { id: "litfest-settings" },
            update: updateData,
            create: {
                id: "litfest-settings",
                ...updateData,
            },
        });
        revalidatePath("/sahithyotsav");
        revalidatePath("/sahithyotsav/schedule");
        revalidatePath("/sahithyotsav/results");

        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
