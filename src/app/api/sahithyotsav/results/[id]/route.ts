import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { itemName, category, winnerName, unitName, position, points } = body;

        const result = await prisma.litFestResult.update({
            where: { id },
            data: {
                itemName,
                category,
                winnerName,
                unitName,
                position: Number(position),
                points: Number(points),
            },
        });
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update result" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.litFestResult.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete result" }, { status: 500 });
    }
}
