import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { computeOrderMetrics, roundLiters } from "@/lib/payasam";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [sectors, targets, orders] = await Promise.all([
            prisma.sector.findMany({
                select: {
                    id: true,
                    name: true,
                    code: true,
                    secretaryName: true,
                    secretaryMobile: true,
                    units: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            sectorId: true,
                        },
                        orderBy: { name: "asc" },
                    },
                },
                orderBy: { name: "asc" },
            }),
            prisma.payasamSectorTarget.findMany(),
            prisma.payasamOrder.findMany({
                include: {
                    sector: { select: { id: true, name: true } },
                    unit: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        const targetMap = new Map<string, number>();
        for (const t of targets) {
            targetMap.set(t.sectorId, roundLiters(t.targetLiters || 0));
        }

        const sectorOrdersMap = new Map<string, typeof orders>();
        const unitOrdersMap = new Map<string, typeof orders>();

        for (const order of orders) {
            const sList = sectorOrdersMap.get(order.sectorId) || [];
            sList.push(order);
            sectorOrdersMap.set(order.sectorId, sList);

            const uList = unitOrdersMap.get(order.unitId) || [];
            uList.push(order);
            unitOrdersMap.set(order.unitId, uList);
        }

        const sectorBreakdown = sectors.map((sector) => {
            const sOrders = sectorOrdersMap.get(sector.id) || [];
            const targetLiters = targetMap.get(sector.id) || 0;
            const sMetrics = computeOrderMetrics(sOrders);
            const remainingLiters = roundLiters(Math.max(0, targetLiters - sMetrics.totalLiters));
            const completionPercentage =
                targetLiters > 0 ? Math.min(999, Math.round((sMetrics.totalLiters / targetLiters) * 100)) : 0;

            const units = sector.units
                .map((u) => {
                    const uOrders = unitOrdersMap.get(u.id) || [];
                    const uMetrics = computeOrderMetrics(uOrders);
                    return {
                        id: u.id,
                        name: u.name,
                        code: u.code,
                        sectorId: sector.id,
                        sectorName: sector.name,
                        ...uMetrics,
                        ordersCount: uMetrics.totalOrders,
                    };
                })
                .sort((a, b) => b.totalLiters - a.totalLiters || a.name.localeCompare(b.name));

            return {
                id: sector.id,
                name: sector.name,
                code: sector.code,
                secretaryName: sector.secretaryName,
                secretaryMobile: sector.secretaryMobile,
                targetLiters,
                achievedLiters: sMetrics.totalLiters,
                ...sMetrics,
                remainingLiters,
                completionPercentage,
                ordersCount: sOrders.length,
                unitsCount: sector.units.length,
                activeUnitsCount: units.filter((u) => u.ordersCount > 0).length,
                units,
            };
        });

        const totalTarget = roundLiters(
            sectorBreakdown.reduce((sum, s) => sum + s.targetLiters, 0)
        );
        const divMetrics = computeOrderMetrics(orders);
        const remainingLiters = roundLiters(Math.max(0, totalTarget - divMetrics.totalLiters));
        const completionPercentage =
            totalTarget > 0 ? Math.min(999, Math.round((divMetrics.totalLiters / totalTarget) * 100)) : 0;

        const totalUnitsCount = sectors.reduce((sum, s) => sum + s.units.length, 0);
        const activeUnitsCount = sectorBreakdown.reduce((sum, s) => sum + s.activeUnitsCount, 0);

        const formattedOrders = orders.map((o) => ({
            id: o.id,
            sectorId: o.sectorId,
            sectorName: o.sector.name,
            unitId: o.unitId,
            unitName: o.unit.name,
            personName: o.personName,
            mobile: o.mobile,
            liters: o.liters,
            paymentStatus: o.paymentStatus,
            handedOverToSector: o.handedOverToSector,
            sectorHandoverAt: o.sectorHandoverAt,
            handedOverToDivision: o.handedOverToDivision,
            divisionHandoverAt: o.divisionHandoverAt,
            source: o.source,
            notes: o.notes,
            createdAt: o.createdAt,
        }));

        return NextResponse.json({
            summary: {
                totalTarget,
                totalAchieved: divMetrics.totalLiters,
                ...divMetrics,
                remainingLiters,
                completionPercentage,
                totalSectorsCount: sectors.length,
                activeSectorsCount: sectorBreakdown.filter((s) => s.ordersCount > 0).length,
                totalUnitsCount,
                activeUnitsCount,
            },
            sectors: sectorBreakdown,
            orders: formattedOrders,
        });
    } catch (error) {
        console.error("Admin Payasam GET error:", error);
        return NextResponse.json(
            { error: "Failed to load Payasam Challenge overview." },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const action = typeof body.action === "string" ? body.action : "";
        const orderIds: string[] = Array.isArray(body.orderIds)
            ? body.orderIds.filter((x: unknown) => typeof x === "string" && x.trim())
            : [];

        if (orderIds.length === 0) {
            return NextResponse.json({ error: "No orders selected." }, { status: 400 });
        }

        const now = new Date();
        let updateData: Record<string, unknown> = {};

        switch (action) {
            case "MARK_PAID":
                updateData = { paymentStatus: "PAID" };
                break;
            case "MARK_PENDING":
                updateData = { paymentStatus: "PENDING" };
                break;
            case "HANDOVER_TO_SECTOR":
                updateData = {
                    paymentStatus: "PAID",
                    handedOverToSector: true,
                    sectorHandoverAt: now,
                };
                break;
            case "HANDOVER_TO_DIVISION":
                updateData = {
                    paymentStatus: "PAID",
                    handedOverToSector: true,
                    sectorHandoverAt: now,
                    handedOverToDivision: true,
                    divisionHandoverAt: now,
                };
                break;
            case "UNDO_DIVISION_HANDOVER":
                updateData = {
                    handedOverToDivision: false,
                    divisionHandoverAt: null,
                };
                break;
            default:
                return NextResponse.json({ error: "Invalid action." }, { status: 400 });
        }

        const result = await prisma.payasamOrder.updateMany({
            where: { id: { in: orderIds } },
            data: updateData,
        });

        return NextResponse.json({ success: true, updatedCount: result.count });
    } catch (error) {
        console.error("Admin Payasam bulk PATCH error:", error);
        return NextResponse.json({ error: "Failed to apply bulk update." }, { status: 500 });
    }
}
