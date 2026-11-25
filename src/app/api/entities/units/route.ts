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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sectorId = searchParams.get("sectorId");

        const where = sectorId ? { sectorId } : {};

        const units = await prisma.unit.findMany({
            where,
            include: {
                sector: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: [{ sector: { name: "asc" } }, { name: "asc" }],
        });

        return NextResponse.json(units);
    } catch (error) {
        console.error("Failed to fetch units:", error);
        return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
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

        if (!name || typeof name !== "string" || !name.trim()) {
            return NextResponse.json({ error: "Unit name is required" }, { status: 400 });
        }

        if (!sectorId || typeof sectorId !== "string" || !sectorId.trim()) {
            return NextResponse.json({ error: "Sector is required" }, { status: 400 });
        }

        // Verify sector exists
        const sector = await prisma.sector.findUnique({
            where: { id: sectorId.trim() },
        });

        if (!sector) {
            return NextResponse.json({ error: "Selected Sector does not exist" }, { status: 404 });
        }

        const trimmedName = name.trim();
        const generatedCode = code?.trim() || cleanSlug(trimmedName);
        const generatedUsername =
            username?.trim() || `unit_${cleanSlug(trimmedName).replace(/-/g, "_")}`;
        const finalPassword = password?.trim() || `SSF@${trimmedName.replace(/\s+/g, "")}26`;

        // Check if unit with same name in same sector exists
        const existing = await prisma.unit.findFirst({
            where: {
                sectorId: sector.id,
                name: trimmedName,
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: `Unit "${trimmedName}" already exists in ${sector.name} sector` },
                { status: 409 }
            );
        }

        const unit = await prisma.unit.create({
            data: {
                name: trimmedName,
                sectorId: sector.id,
                code: generatedCode,
                username: generatedUsername,
                password: finalPassword,
                presidentName: presidentName?.trim() || null,
                presidentMobile: presidentMobile?.trim() || null,
                secretaryName: secretaryName?.trim() || null,
                secretaryMobile: secretaryMobile?.trim() || null,
                notes: notes?.trim() || null,
            },
            include: {
                sector: true,
            },
        });

        return NextResponse.json(unit, { status: 201 });
    } catch (error: any) {
        console.error("Failed to create unit:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create unit" },
            { status: 500 }
        );
    }
}
