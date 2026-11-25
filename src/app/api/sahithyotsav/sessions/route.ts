import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const sessions = await prisma.litFestSession.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(sessions);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { itemName, category, stage, time, status } = body;

        const session = await prisma.litFestSession.create({
            data: {
                itemName,
                category,
                stage,
                time,
                status: status || "UPCOMING",
            },
        });
        return NextResponse.json(session);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
}
