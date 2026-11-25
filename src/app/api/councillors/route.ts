import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeMobile, formatTicketNumber } from "@/lib/councillor-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sector = searchParams.get("sector");
        const search = searchParams.get("search");
        const status = searchParams.get("status"); // ALL, ADMITTED, PENDING

        // Fetch all councillors to compute accurate stats and unique sector lists
        const all = await prisma.councillor.findMany({
            orderBy: [{ sector: "asc" }, { unit: "asc" }, { name: "asc" }],
        });

        // Compute overall and sector-wise stats
        const total = all.length;
        const admitted = all.filter((c) => c.isAdmitted).length;
        const pending = total - admitted;
        const admittedPercentage = total > 0 ? Math.round((admitted / total) * 100) : 0;

        // Group by sectors
        const sectorMap = new Map<string, { total: number; admitted: number }>();
        for (const c of all) {
            const sec = (c.sector || "Unassigned").trim();
            const curr = sectorMap.get(sec) || { total: 0, admitted: 0 };
            curr.total += 1;
            if (c.isAdmitted) curr.admitted += 1;
            sectorMap.set(sec, curr);
        }

        const sectors = Array.from(sectorMap.entries())
            .map(([name, data]) => ({
                name,
                total: data.total,
                admitted: data.admitted,
                pending: data.total - data.admitted,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        // Filter data based on query params
        let filtered = all;

        if (sector && sector !== "ALL") {
            filtered = filtered.filter(
                (c) => c.sector.trim().toLowerCase() === sector.trim().toLowerCase()
            );
        }

        if (status && status !== "ALL") {
            if (status === "ADMITTED") {
                filtered = filtered.filter((c) => c.isAdmitted);
            } else if (status === "PENDING") {
                filtered = filtered.filter((c) => !c.isAdmitted);
            }
        }

        if (search && search.trim()) {
            const query = search.trim().toLowerCase();
            const queryDigits = search.replace(/\D/g, "");
            filtered = filtered.filter((c) => {
                const nameMatch = c.name?.toLowerCase().includes(query);
                const sectorMatch = c.sector?.toLowerCase().includes(query);
                const unitMatch = c.unit?.toLowerCase().includes(query);
                const ticketMatch = c.ticketNumber?.toLowerCase().includes(query);
                const desigMatch = c.designation?.toLowerCase().includes(query);
                const mobileMatch = queryDigits
                    ? c.mobile.includes(queryDigits)
                    : c.mobile.toLowerCase().includes(query);

                return nameMatch || sectorMatch || unitMatch || ticketMatch || desigMatch || mobileMatch;
            });
        }

        return NextResponse.json({
            councillors: filtered,
            stats: {
                total,
                admitted,
                pending,
                admittedPercentage,
                sectors,
            },
        });
    } catch (error: any) {
        console.error("Error fetching councillors:", error);
        return NextResponse.json(
            { error: "Failed to fetch councillors", details: error?.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, mobile, sector, unit, designation, notes, eventId } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        if (!mobile || !mobile.trim()) {
            return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
        }
        if (!sector || !sector.trim()) {
            return NextResponse.json({ error: "Sector is required" }, { status: 400 });
        }
        if (!unit || !unit.trim()) {
            return NextResponse.json({ error: "Unit is required" }, { status: 400 });
        }

        const normMobile = normalizeMobile(mobile.trim());

        // Canonicalize Sector and Unit from Entities if available
        let canonicalSector = sector.trim();
        let canonicalUnit = unit.trim();
        try {
            const matchedSector = await prisma.sector.findFirst({
                where: {
                    OR: [
                        { name: canonicalSector },
                        { code: canonicalSector.toLowerCase() },
                        { id: canonicalSector },
                    ],
                },
                include: { units: true },
            });

            if (matchedSector) {
                canonicalSector = matchedSector.name;
                const matchedUnit = matchedSector.units.find(
                    (u) => u.name.toLowerCase() === canonicalUnit.toLowerCase()
                );
                if (matchedUnit) {
                    canonicalUnit = matchedUnit.name;
                }
            }
        } catch {}

        // Generate next ticket number
        let ticketNumber = body.ticketNumber?.trim();
        if (!ticketNumber) {
            const latest = await prisma.councillor.findFirst({
                where: { ticketNumber: { startsWith: "DSC-26-" } },
                orderBy: { ticketNumber: "desc" },
            });
            let nextIndex = 1;
            if (latest && latest.ticketNumber) {
                const parts = latest.ticketNumber.split("-");
                const num = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(num)) {
                    nextIndex = num + 1;
                }
            } else {
                const count = await prisma.councillor.count();
                nextIndex = count + 1;
            }
            ticketNumber = formatTicketNumber(nextIndex);
            // Ensure unique
            while (await prisma.councillor.findUnique({ where: { ticketNumber } })) {
                nextIndex++;
                ticketNumber = formatTicketNumber(nextIndex);
            }
        }

        const councillor = await prisma.councillor.create({
            data: {
                ticketNumber,
                name: name.trim(),
                mobile: normMobile,
                sector: canonicalSector,
                unit: canonicalUnit,
                designation: designation?.trim() || null,
                notes: notes?.trim() || null,
                eventId: eventId || null,
            },
        });

        return NextResponse.json({ success: true, councillor }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating councillor:", error);
        return NextResponse.json(
            { error: "Failed to create councillor", details: error?.message },
            { status: 500 }
        );
    }
}
