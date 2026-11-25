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

// Robust CSV parser supporting quotes and CRLF
function parseCSV(text: string): string[][] {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentField = "";

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            row.push(currentField.trim());
            currentField = "";
        } else if ((char === "\r" || char === "\n") && !inQuotes) {
            if (char === "\r" && nextChar === "\n") {
                i++;
            }
            row.push(currentField.trim());
            currentField = "";
            if (row.some((field) => field.length > 0)) {
                lines.push(row);
            }
            row = [];
        } else {
            currentField += char;
        }
    }

    if (currentField.length > 0 || row.length > 0) {
        row.push(currentField.trim());
        if (row.some((field) => field.length > 0)) {
            lines.push(row);
        }
    }

    return lines;
}

export async function POST(request: NextRequest) {
    try {
        let csvText = "";
        let mode = "auto"; // "sectors" | "units" | "auto"

        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const file = formData.get("file") as File | null;
            if (!file) {
                return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
            }
            csvText = await file.text();
            mode = (formData.get("mode") as string) || "auto";
        } else {
            const body = await request.json();
            csvText = body.csvText || body.csv || "";
            mode = body.mode || "auto";
        }

        if (!csvText || !csvText.trim()) {
            return NextResponse.json({ error: "CSV content is empty" }, { status: 400 });
        }

        const rawRows = parseCSV(csvText);
        if (rawRows.length === 0) {
            return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });
        }

        let startIndex = 0;
        const firstRow = rawRows[0].map((c) => c.toLowerCase().trim());
        const hasHeader = firstRow.some(
            (c) => c.includes("sector") || c.includes("unit") || c.includes("name") || c.includes("user")
        );
        if (hasHeader) {
            startIndex = 1;
        }

        // Cache all existing sectors in memory
        const allExistingSectors = await prisma.sector.findMany({
            include: { units: true },
        });

        // Helper to find a sector by ID, code, name, or username
        const findSector = (ref: string) => {
            if (!ref) return null;
            const r = ref.toLowerCase().trim();
            return (
                allExistingSectors.find(
                    (s) =>
                        s.id.toLowerCase() === r ||
                        (s.code && s.code.toLowerCase() === r) ||
                        s.name.toLowerCase() === r ||
                        (s.username && s.username.toLowerCase() === r)
                ) || null
            );
        };

        // Auto-detect mode if "auto"
        let detectedMode = mode;
        if (detectedMode === "auto") {
            if (hasHeader) {
                const headerLine = firstRow.join(" ");
                if (headerLine.includes("unit") && headerLine.includes("sector")) {
                    detectedMode = "units";
                } else if (headerLine.includes("unit")) {
                    detectedMode = "units";
                } else if (headerLine.includes("sector")) {
                    detectedMode = "sectors";
                } else {
                    detectedMode = "sectors";
                }
            } else {
                // If row has >= 4 columns -> default to units (Unit, Sector ID, Username, Password)
                // If 3 columns -> default to sectors (Sector Name, Username, Password)
                detectedMode = rawRows[0].length >= 4 ? "units" : "sectors";
            }
        }

        let sectorsCreated = 0;
        let sectorsUpdated = 0;
        let unitsCreated = 0;
        let unitsUpdated = 0;
        const errors: string[] = [];

        if (detectedMode === "sectors") {
            // Sector Import: Sector Name, Username, Password
            let secCol = 0;
            let userCol = 1;
            let passCol = 2;

            if (hasHeader) {
                firstRow.forEach((col, idx) => {
                    if (col.includes("user")) userCol = idx;
                    else if (col.includes("pass")) passCol = idx;
                    else if (col.includes("sector") || col === "name") secCol = idx;
                });
            }

            for (let i = startIndex; i < rawRows.length; i++) {
                const row = rawRows[i];
                const sectorName = row[secCol]?.trim();
                if (!sectorName) continue;

                const username = row[userCol]?.trim() || `sec_${cleanSlug(sectorName).replace(/-/g, "_")}`;
                const password = row[passCol]?.trim() || `SSF@${sectorName.replace(/\s+/g, "")}26`;
                const code = cleanSlug(sectorName);

                const existingSector = findSector(sectorName) || findSector(code) || findSector(username);

                if (!existingSector) {
                    try {
                        const newSector = await prisma.sector.create({
                            data: {
                                name: sectorName,
                                code,
                                username,
                                password,
                            },
                            include: { units: true },
                        });
                        allExistingSectors.push(newSector);
                        sectorsCreated++;
                    } catch (err: any) {
                        console.error(`Error creating sector "${sectorName}":`, err);
                        errors.push(`Row ${i + 1}: Could not create sector "${sectorName}" (${err.message})`);
                    }
                } else {
                    try {
                        await prisma.sector.update({
                            where: { id: existingSector.id },
                            data: {
                                ...(username && { username }),
                                ...(password && { password }),
                            },
                        });
                        sectorsUpdated++;
                    } catch (err: any) {
                        errors.push(`Row ${i + 1}: Could not update sector "${sectorName}" (${err.message})`);
                    }
                }
            }
        } else {
            // Units Import: Unit Name, Sector ID, Username, Password
            let unitCol = 0;
            let secCol = 1;
            let userCol = 2;
            let passCol = 3;

            if (hasHeader) {
                firstRow.forEach((col, idx) => {
                    if (col.includes("unit")) unitCol = idx;
                    else if (col.includes("sector")) secCol = idx;
                    else if (col.includes("user")) userCol = idx;
                    else if (col.includes("pass")) passCol = idx;
                });
            }

            for (let i = startIndex; i < rawRows.length; i++) {
                const row = rawRows[i];
                const unitName = row[unitCol]?.trim();
                const sectorRef = row[secCol]?.trim();

                if (!unitName || !sectorRef) {
                    if (!unitName && !sectorRef) continue;
                    errors.push(`Row ${i + 1}: Unit Name and Sector ID are both required`);
                    continue;
                }

                const targetSector = findSector(sectorRef);
                if (!targetSector) {
                    errors.push(`Row ${i + 1}: Sector "${sectorRef}" not found for Unit "${unitName}"`);
                    continue;
                }

                const username = row[userCol]?.trim() || `unit_${cleanSlug(unitName).replace(/-/g, "_")}`;
                const password = row[passCol]?.trim() || `SSF@${unitName.replace(/\s+/g, "")}26`;
                const code = cleanSlug(unitName);

                const existingUnit = targetSector.units?.find(
                    (u: any) => u.name.toLowerCase().trim() === unitName.toLowerCase()
                );

                if (!existingUnit) {
                    try {
                        const newUnit = await prisma.unit.create({
                            data: {
                                name: unitName,
                                code,
                                sectorId: targetSector.id,
                                username,
                                password,
                            },
                        });
                        if (!targetSector.units) targetSector.units = [];
                        targetSector.units.push(newUnit);
                        unitsCreated++;
                    } catch (err: any) {
                        console.error(`Error creating unit "${unitName}":`, err);
                        errors.push(`Row ${i + 1}: Could not create unit "${unitName}" (${err.message})`);
                    }
                } else {
                    try {
                        await prisma.unit.update({
                            where: { id: existingUnit.id },
                            data: {
                                ...(username && { username }),
                                ...(password && { password }),
                            },
                        });
                        unitsUpdated++;
                    } catch (err: any) {
                        errors.push(`Row ${i + 1}: Could not update unit "${unitName}" (${err.message})`);
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            mode: detectedMode,
            totalProcessedRows: rawRows.length - startIndex,
            sectorsCreated,
            sectorsUpdated,
            unitsCreated,
            unitsUpdated,
            errors,
        });
    } catch (error: any) {
        console.error("CSV import error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process CSV import" },
            { status: 500 }
        );
    }
}
