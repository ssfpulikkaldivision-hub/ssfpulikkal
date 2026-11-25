import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { results } = body;

        if (!results || !Array.isArray(results)) {
            return NextResponse.json({ error: "Invalid results array" }, { status: 400 });
        }

        const dataToInsert = results.map((r: any) => {
            const position = Number(r.position) || 1;
            let points = Number(r.points);
            if (isNaN(points)) {
                if (position === 1) points = 5;
                else if (position === 2) points = 3;
                else points = 1;
            }
            return {
                itemName: r.itemName || "Unnamed Item",
                category: r.category || "General",
                winnerName: r.winnerName || "Unnamed Winner",
                unitName: r.unitName || "General",
                position,
                points,
            };
        });

        const result = await prisma.litFestResult.createMany({
            data: dataToInsert,
        });

        return NextResponse.json({ count: result.count });
    } catch (error) {
        console.error("Bulk results import error:", error);
        return NextResponse.json({ error: "Failed to import results" }, { status: 500 });
    }
}
