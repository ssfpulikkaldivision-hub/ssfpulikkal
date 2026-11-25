import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portalAuth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getPortalSession();
        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        // Fetch fresh entity details
        if (session.type === "DIVISION") {
            const sectors = await prisma.sector.findMany({
                include: {
                    units: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            username: true,
                            password: true,
                            presidentName: true,
                            presidentMobile: true,
                            secretaryName: true,
                            secretaryMobile: true,
                            notes: true,
                        },
                        orderBy: { name: "asc" },
                    },
                },
                orderBy: { name: "asc" },
            });

            const allUnits = sectors.flatMap((s) =>
                s.units.map((u) => ({ ...u, sectorId: s.id, sectorName: s.name }))
            );

            return NextResponse.json({
                authenticated: true,
                entity: {
                    id: session.id,
                    type: "DIVISION",
                    name: "SSF Pulikkal Division",
                    code: "DIV",
                    username: session.username,
                    sectorId: "division",
                    sectorName: "SSF Pulikkal Division",
                    sectorsCount: sectors.length,
                    unitsCount: allUnits.length,
                    sectors: sectors.map((s) => ({
                        id: s.id,
                        name: s.name,
                        code: s.code,
                        username: s.username,
                        password: s.password,
                        presidentName: s.presidentName,
                        presidentMobile: s.presidentMobile,
                        secretaryName: s.secretaryName,
                        secretaryMobile: s.secretaryMobile,
                        unitsCount: s.units.length,
                    })),
                    units: sectors.flatMap((s) =>
                        s.units.map((u) => ({
                            ...u,
                            sectorId: s.id,
                            sectorName: s.name,
                        }))
                    ),
                },
            });
        } else if (session.type === "SECTOR") {
            const sector = await prisma.sector.findUnique({
                where: { id: session.id },
                include: {
                    units: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            username: true,
                            password: true,
                            presidentName: true,
                            presidentMobile: true,
                            secretaryName: true,
                            secretaryMobile: true,
                            notes: true,
                        },
                        orderBy: { name: "asc" },
                    },
                },
            });

            if (!sector) {
                return NextResponse.json({ authenticated: false }, { status: 401 });
            }

            return NextResponse.json({
                authenticated: true,
                entity: {
                    id: sector.id,
                    type: "SECTOR",
                    name: sector.name,
                    code: sector.code,
                    username: sector.username,
                    sectorId: sector.id,
                    sectorName: sector.name,
                    notes: sector.notes,
                    sectorsCount: 1,
                    sectors: [
                        {
                            id: sector.id,
                            name: sector.name,
                            code: sector.code,
                            username: sector.username,
                            unitsCount: sector.units.length,
                        },
                    ],
                    unitsCount: sector.units.length,
                    units: sector.units.map((u) => ({
                        ...u,
                        sectorId: sector.id,
                        sectorName: sector.name,
                    })),
                },
            });
        } else {
            const unit = await prisma.unit.findUnique({
                where: { id: session.id },
                include: {
                    sector: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            });

            if (!unit) {
                return NextResponse.json({ authenticated: false }, { status: 401 });
            }

            return NextResponse.json({
                authenticated: true,
                entity: {
                    id: unit.id,
                    type: "UNIT",
                    name: unit.name,
                    code: unit.code,
                    username: unit.username,
                    sectorId: unit.sectorId,
                    sectorName: unit.sector?.name || "",
                    notes: unit.notes,
                },
            });
        }
    } catch (error) {
        console.error("Portal me error:", error);
        return NextResponse.json({ authenticated: false, error: "Failed to verify session" }, { status: 500 });
    }
}
