import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessions } = body;

        if (!sessions || !Array.isArray(sessions)) {
            return NextResponse.json({ error: "Invalid sessions array" }, { status: 400 });
        }

        const dataToInsert = sessions.map((s: any) => ({
            itemName: s.itemName || "Unnamed Item",
            category: s.category || "General",
            stage: s.stage || "Stage A",
            time: s.time || "Day 1 - 09:00 AM",
            status: s.status || "UPCOMING",
        }));

        const result = await prisma.litFestSession.createMany({
            data: dataToInsert,
        });

        return NextResponse.json({ count: result.count });
    } catch (error) {
        console.error("Bulk session import error:", error);
        return NextResponse.json({ error: "Failed to import sessions" }, { status: 500 });
    }
}
