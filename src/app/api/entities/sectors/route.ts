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

export async function GET() {
    try {
        const sectors = await prisma.sector.findMany({
            include: {
                units: {
                    orderBy: { name: "asc" },
                },
            },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(sectors);
    } catch (error) {
        console.error("Failed to fetch sectors:", error);
        return NextResponse.json({ error: "Failed to fetch sectors" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
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
            return NextResponse.json({ error: "Sector name is required" }, { status: 400 });
        }

        const trimmedName = name.trim();
        const generatedCode = code?.trim() || cleanSlug(trimmedName);
        const generatedUsername = username?.trim() || `sec_${cleanSlug(trimmedName).replace(/-/g, "_")}`;
        const finalPassword = password?.trim() || `SSF@${trimmedName.replace(/\s+/g, "")}26`;

        // Check if sector with same name or code or username exists
        const existing = await prisma.sector.findFirst({
            where: {
                OR: [
                    { name: trimmedName },
                    { code: generatedCode },
                    { username: generatedUsername },
                ],
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: `Sector with name/code/username "${trimmedName}" already exists` },
                { status: 409 }
            );
        }

        const sector = await prisma.sector.create({
            data: {
                name: trimmedName,
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
                units: true,
            },
        });

        return NextResponse.json(sector, { status: 201 });
    } catch (error: any) {
        console.error("Failed to create sector:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create sector" },
            { status: 500 }
        );
    }
}
