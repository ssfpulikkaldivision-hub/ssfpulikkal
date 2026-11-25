import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { roundLiters } from "@/lib/payasam";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const items: Array<{ sectorId: string; targetLiters: number }> = Array.isArray(body.targets)
            ? body.targets
            : body.sectorId
            ? [{ sectorId: body.sectorId, targetLiters: body.targetLiters }]
            : [];

        if (items.length === 0) {
            return NextResponse.json(
                { error: "No sector targets provided." },
                { status: 400 }
            );
        }

        for (const item of items) {
            const val = Number(item.targetLiters);
            if (!item.sectorId || !Number.isFinite(val) || val < 0) {
                return NextResponse.json(
                    { error: "Each target must have a valid sector and non-negative liters." },
                    { status: 400 }
                );
            }
        }

        const results = [];
        for (const item of items) {
            const liters = roundLiters(Number(item.targetLiters));
            const saved = await prisma.payasamSectorTarget.upsert({
                where: { sectorId: item.sectorId },
                create: {
                    sectorId: item.sectorId,
                    targetLiters: liters,
                },
                update: {
                    targetLiters: liters,
                },
            });
            results.push(saved);
        }

        return NextResponse.json({
            success: true,
            message: "Sector targets updated successfully.",
            targets: results,
        });
    } catch (error) {
        console.error("Admin Payasam targets PUT error:", error);
        return NextResponse.json(
            { error: "Failed to save sector targets." },
            { status: 500 }
        );
    }
}
