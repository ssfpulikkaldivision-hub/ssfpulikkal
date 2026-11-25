import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeMobile, formatTicketNumber } from "@/lib/councillor-utils";

export const dynamic = "force-dynamic";

interface CouncillorInput {
    name: string;
    mobile: string;
    sector: string;
    unit: string;
    designation?: string;
    ticketNumber?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let items: CouncillorInput[] = [];

        if (Array.isArray(body.items)) {
            items = body.items;
        } else if (typeof body.rawText === "string") {
            // Parse CSV or TSV lines
            const lines = body.rawText
                .split(/\r?\n/)
                .map((l: string) => l.trim())
                .filter((l: string) => l.length > 0);

            for (const line of lines) {
                // Determine separator (tab, comma, or semicolon)
                const sep = line.includes("\t") ? "\t" : line.includes(",") ? "," : ";";
                const parts = line.split(sep).map((p: string) => p.trim().replace(/^["']|["']$/g, ""));

                // Skip header if line looks like "Name, Mobile, Sector..."
                if (
                    parts[0]?.toLowerCase().includes("name") ||
                    parts[1]?.toLowerCase().includes("mobile")
                ) {
                    continue;
                }

                if (parts.length >= 4) {
                    items.push({
                        name: parts[0],
                        mobile: parts[1],
                        sector: parts[2],
                        unit: parts[3],
                        designation: parts[4] || "",
                    });
                }
            }
        }

        if (items.length === 0) {
            return NextResponse.json(
                { error: "No valid councillor records found to import" },
                { status: 400 }
            );
        }

        let existingCount = await prisma.councillor.count();
        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        // Preload entities for canonical matching
        let dbSectors: any[] = [];
        try {
            dbSectors = await prisma.sector.findMany({
                include: { units: true },
            });
        } catch {}

        for (const item of items) {
            const name = item.name?.trim();
            const mobile = normalizeMobile(item.mobile || "");
            let sector = item.sector?.trim();
            let unit = item.unit?.trim();

            if (!name || !mobile || !sector || !unit) {
                skipped++;
                errors.push(`Row with name "${name || "unknown"}" is missing required fields.`);
                continue;
            }

            // Match against Entities database to guarantee exact casing and names
            const matchedSector = dbSectors.find(
                (s) =>
                    s.name.toLowerCase() === sector.toLowerCase() ||
                    (s.code && s.code.toLowerCase() === sector.toLowerCase()) ||
                    s.id === sector
            );
            if (matchedSector) {
                sector = matchedSector.name;
                const matchedUnit = matchedSector.units?.find(
                    (u: any) => u.name.toLowerCase() === unit.toLowerCase()
                );
                if (matchedUnit) {
                    unit = matchedUnit.name;
                }
            }

            // Assign unique ticket number
            existingCount++;
            let ticketNumber = item.ticketNumber?.trim();
            if (!ticketNumber) {
                ticketNumber = formatTicketNumber(existingCount);
                while (await prisma.councillor.findUnique({ where: { ticketNumber } })) {
                    existingCount++;
                    ticketNumber = formatTicketNumber(existingCount);
                }
            }

            try {
                await prisma.councillor.create({
                    data: {
                        ticketNumber,
                        name,
                        mobile,
                        sector,
                        unit,
                        designation: item.designation?.trim() || null,
                    },
                });
                imported++;
            } catch (err: any) {
                skipped++;
                errors.push(`Failed to insert "${name}": ${err?.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            totalProcessed: items.length,
            imported,
            skipped,
            errors: errors.slice(0, 10),
        });
    } catch (error: any) {
        console.error("Bulk import error:", error);
        return NextResponse.json(
            { error: "Bulk import failed", details: error?.message },
            { status: 500 }
        );
    }
}
