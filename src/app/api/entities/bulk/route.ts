import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const cleanSlug = (text: string) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sectorId, unitNames, defaultPassword } = body;

        if (!sectorId || typeof sectorId !== "string") {
            return NextResponse.json({ error: "Sector ID is required" }, { status: 400 });
        }

        if (!Array.isArray(unitNames) || unitNames.length === 0) {
            return NextResponse.json({ error: "List of unit names is required" }, { status: 400 });
        }

        const sector = await prisma.sector.findUnique({
            where: { id: sectorId.trim() },
            include: { units: true },
        });

        if (!sector) {
            return NextResponse.json({ error: "Sector not found" }, { status: 404 });
        }

        const existingNames = new Set(sector.units.map((u) => u.name.toLowerCase().trim()));
        const createdUnits: any[] = [];
        const skippedNames: string[] = [];

        for (const rawName of unitNames) {
            if (!rawName || typeof rawName !== "string" || !rawName.trim()) continue;
            const name = rawName.trim();

            if (existingNames.has(name.toLowerCase())) {
                skippedNames.push(name);
                continue;
            }

            const code = cleanSlug(name);
            const username = `unit_${cleanSlug(name).replace(/-/g, "_")}`;
            const password = defaultPassword?.trim() || `SSF@${name.replace(/\s+/g, "")}26`;

            try {
                const u = await prisma.unit.create({
                    data: {
                        name,
                        code,
                        sectorId: sector.id,
                        username,
                        password,
                    },
                });
                createdUnits.push(u);
                existingNames.add(name.toLowerCase());
            } catch (err) {
                console.warn(`Could not create unit ${name}:`, err);
                skippedNames.push(name);
            }
        }

        return NextResponse.json({
            success: true,
            createdCount: createdUnits.length,
            skippedCount: skippedNames.length,
            createdUnits,
            skippedNames,
        });
    } catch (error: any) {
        console.error("Bulk units creation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to bulk create units" },
            { status: 500 }
        );
    }
}
