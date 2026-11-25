import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sectorId = searchParams.get("sectorId");

        const where = sectorId ? { id: sectorId } : {};

        const sectors = await prisma.sector.findMany({
            where,
            include: {
                units: {
                    orderBy: { name: "asc" },
                },
            },
            orderBy: { name: "asc" },
        });

        const totalSectors = sectors.length;
        const totalUnits = sectors.reduce((acc, s) => acc + s.units.length, 0);

        return NextResponse.json({
            sectors,
            stats: {
                totalSectors,
                totalUnits,
            },
        });
    } catch (error) {
        console.error("Failed to fetch entities:", error);
        return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 });
    }
}
