import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            name,
            sectorId,
            code,
            username,
            password,
            presidentName,
            presidentMobile,
            secretaryName,
            secretaryMobile,
            notes,
        } = body;

        const existing = await prisma.unit.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Unit not found" }, { status: 404 });
        }

        const data: any = {};
        if (name !== undefined) data.name = name.trim();
        if (sectorId !== undefined) data.sectorId = sectorId.trim();
        if (code !== undefined) data.code = code.trim();
        if (username !== undefined) data.username = username.trim();
        if (password !== undefined) data.password = password.trim();
        if (presidentName !== undefined) data.presidentName = presidentName.trim() || null;
        if (presidentMobile !== undefined) data.presidentMobile = presidentMobile.trim() || null;
        if (secretaryName !== undefined) data.secretaryName = secretaryName.trim() || null;
        if (secretaryMobile !== undefined) data.secretaryMobile = secretaryMobile.trim() || null;
        if (notes !== undefined) data.notes = notes.trim() || null;

        const updated = await prisma.unit.update({
            where: { id },
            data,
            include: {
                sector: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Failed to update unit:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update unit" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.unit.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete unit:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete unit" },
            { status: 500 }
        );
    }
}
