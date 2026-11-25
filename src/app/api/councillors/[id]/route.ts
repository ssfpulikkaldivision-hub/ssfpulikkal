import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeMobile } from "@/lib/councillor-utils";
import { generateQRCodeDataURL } from "@/lib/qrcode";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const councillor = await prisma.councillor.findUnique({
            where: { id },
        });

        if (!councillor) {
            return NextResponse.json({ error: "Councillor not found" }, { status: 404 });
        }

        const qrDataUrl = generateQRCodeDataURL(councillor.ticketNumber, {
            size: 260,
            margin: 2,
        });

        return NextResponse.json({
            councillor: {
                ...councillor,
                qrCode: qrDataUrl,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to fetch councillor", details: error?.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, mobile, sector, unit, designation, notes } = body;

        let canonicalSector = sector ? sector.trim() : undefined;
        let canonicalUnit = unit ? unit.trim() : undefined;

        if (canonicalSector || canonicalUnit) {
            try {
                const targetSec = canonicalSector || (await prisma.councillor.findUnique({ where: { id }, select: { sector: true } }))?.sector;
                if (targetSec) {
                    const matchedSector = await prisma.sector.findFirst({
                        where: {
                            OR: [
                                { name: targetSec },
                                { code: targetSec.toLowerCase() },
                                { id: targetSec },
                            ],
                        },
                        include: { units: true },
                    });
                    if (matchedSector) {
                        if (canonicalSector) canonicalSector = matchedSector.name;
                        if (canonicalUnit) {
                            const matchedUnit = matchedSector.units.find(
                                (u) => u.name.toLowerCase() === canonicalUnit!.toLowerCase()
                            );
                            if (matchedUnit) canonicalUnit = matchedUnit.name;
                        }
                    }
                }
            } catch {}
        }

        const updated = await prisma.councillor.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(mobile && { mobile: normalizeMobile(mobile) }),
                ...(canonicalSector && { sector: canonicalSector }),
                ...(canonicalUnit && { unit: canonicalUnit }),
                designation: designation !== undefined ? designation?.trim() || null : undefined,
                notes: notes !== undefined ? notes?.trim() || null : undefined,
            },
        });

        return NextResponse.json({ success: true, councillor: updated });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to update councillor", details: error?.message },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { isAdmitted } = body;

        const updated = await prisma.councillor.update({
            where: { id },
            data: {
                isAdmitted: !!isAdmitted,
                admittedAt: isAdmitted ? new Date() : null,
            },
        });

        return NextResponse.json({ success: true, councillor: updated });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to update admission status", details: error?.message },
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
        await prisma.councillor.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: "Councillor deleted" });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to delete councillor", details: error?.message },
            { status: 500 }
        );
    }
}
