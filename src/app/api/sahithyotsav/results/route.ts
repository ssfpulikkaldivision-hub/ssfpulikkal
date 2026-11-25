import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const results = await prisma.litFestResult.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { itemName, category, winnerName, unitName, position, points } = body;

        const result = await prisma.litFestResult.create({
            data: {
                itemName,
                category,
                winnerName,
                unitName,
                position: Number(position),
                points: Number(points),
            },
        });
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create result" }, { status: 500 });
    }
}
