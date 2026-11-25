import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { roundLiters, validateOrderInput } from "@/lib/payasam";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const [sectors, targets, orderStats] = await Promise.all([
            prisma.sector.findMany({
                select: {
                    id: true,
                    name: true,
                    code: true,
                    units: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                        orderBy: { name: "asc" },
                    },
                },
                orderBy: { name: "asc" },
            }),
            prisma.payasamSectorTarget.findMany({
                select: { targetLiters: true },
            }),
            prisma.payasamOrder.aggregate({
                _sum: { liters: true },
                _count: { id: true },
            }),
        ]);

        const totalTarget = roundLiters(
            targets.reduce((sum, t) => sum + (t.targetLiters || 0), 0)
        );
        const totalLiters = roundLiters(orderStats._sum.liters || 0);
        const totalOrders = orderStats._count.id || 0;

        return NextResponse.json({
            sectors,
            summary: {
                totalTarget,
                totalLiters,
                totalOrders,
            },
        });
    } catch (error) {
        console.error("Failed to fetch public Payasam Challenge data:", error);
        return NextResponse.json(
            { error: "Failed to load Payasam Challenge data." },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const sectorId = typeof body.sectorId === "string" ? body.sectorId.trim() : "";
        const unitId = typeof body.unitId === "string" ? body.unitId.trim() : "";

        if (!sectorId || !unitId) {
            return NextResponse.json(
                { error: "Please select both Sector and Unit." },
                { status: 400 }
            );
        }

        const validation = validateOrderInput(body);
        if (!validation.ok) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const unit = await prisma.unit.findUnique({
            where: { id: unitId },
            select: {
                id: true,
                name: true,
                sectorId: true,
                sector: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!unit || unit.sectorId !== sectorId) {
            return NextResponse.json(
                { error: "Selected unit does not belong to the selected sector." },
                { status: 400 }
            );
        }

        const order = await prisma.payasamOrder.create({
            data: {
                sectorId: unit.sectorId,
                unitId: unit.id,
                personName: validation.data.personName,
                mobile: validation.data.mobile,
                liters: validation.data.liters,
                paymentStatus: validation.data.paymentStatus,
                source: "PUBLIC_LINK",
                notes: validation.data.notes,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Order submitted successfully.",
                order: {
                    ...order,
                    sectorName: unit.sector.name,
                    unitName: unit.name,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Public Payasam order error:", error);
        return NextResponse.json(
            { error: "Failed to submit order. Please try again." },
            { status: 500 }
        );
    }
}
