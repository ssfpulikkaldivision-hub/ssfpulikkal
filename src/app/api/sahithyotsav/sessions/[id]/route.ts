import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { itemName, category, stage, time, status } = body;

        const session = await prisma.litFestSession.update({
            where: { id },
            data: { itemName, category, stage, time, status },
        });
        return NextResponse.json(session);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.litFestSession.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
    }
}
