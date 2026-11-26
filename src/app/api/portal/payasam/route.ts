import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portalAuth";
import prisma from "@/lib/prisma";
import { computeOrderMetrics, roundLiters, validateOrderInput } from "@/lib/payasam";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getPortalSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.type === "UNIT") {
            const [orders, sectorTarget, sectorTotals] = await Promise.all([
                prisma.payasamOrder.findMany({
                    where: { unitId: session.id },
                    orderBy: { createdAt: "desc" },
                }),
                prisma.payasamSectorTarget.findUnique({
                    where: { sectorId: session.sectorId },
                }),
                prisma.payasamOrder.aggregate({
                    where: { sectorId: session.sectorId },
                    _sum: { liters: true },
                }),
            ]);

            const metrics = computeOrderMetrics(orders);

            return NextResponse.json({
                entityType: "UNIT",
                entity: {
                    id: session.id,
                    name: session.name,
                    sectorId: session.sectorId,
                    sectorName: session.sectorName,
                },
                summary: {
                    ...metrics,
                    sectorTargetLiters: roundLiters(sectorTarget?.targetLiters || 0),
                    sectorAchievedLiters: roundLiters(sectorTotals._sum.liters || 0),
                },
                orders,
            });
        }

        // SECTOR or DIVISION view
        const isDivision = session.type === "DIVISION";

        const [sectorTarget, allSectorTargets, units, orders] = await Promise.all([
            isDivision
                ? null
                : prisma.payasamSectorTarget.findUnique({
                      where: { sectorId: session.id },
                  }),
            isDivision
                ? prisma.payasamSectorTarget.findMany({
                      include: { sector: true },
                  })
                : [],
            prisma.unit.findMany({
                where: isDivision ? {} : { sectorId: session.id },
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
                orderBy: { name: "asc" },
            }),
            prisma.payasamOrder.findMany({
                where: isDivision ? {} : { sectorId: session.id },
                include: {
                    unit: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        const unitOrdersMap = new Map<string, typeof orders>();
        for (const order of orders) {
            const list = unitOrdersMap.get(order.unitId) || [];
            list.push(order);
            unitOrdersMap.set(order.unitId, list);
        }

        const unitBreakdown = units
            .map((unit) => {
                const uOrders = unitOrdersMap.get(unit.id) || [];
                const uMetrics = computeOrderMetrics(uOrders);

                return {
                    unitId: unit.id,
                    unitName: unit.name,
                    unitCode: unit.code,
                    ...uMetrics,
                    ordersCount: uMetrics.totalOrders,
                    orders: uOrders,
                };
            })
            .sort((a, b) => b.totalLiters - a.totalLiters || a.unitName.localeCompare(b.unitName));

        const targetLiters = isDivision
            ? roundLiters((allSectorTargets as { targetLiters?: number }[]).reduce((sum, t) => sum + (t.targetLiters || 0), 0))
            : roundLiters(sectorTarget?.targetLiters || 0);
        const sMetrics = computeOrderMetrics(orders);
        const remainingLiters = roundLiters(Math.max(0, targetLiters - sMetrics.totalLiters));
        const completionPercentage =
            targetLiters > 0 ? Math.min(999, Math.round((sMetrics.totalLiters / targetLiters) * 100)) : 0;

        return NextResponse.json({
            entityType: isDivision ? "DIVISION" : "SECTOR",
            entity: {
                id: session.id,
                name: session.name,
                sectorId: session.sectorId || session.id,
                sectorName: session.sectorName || session.name,
            },
            summary: {
                targetLiters,
                ...sMetrics,
                remainingLiters,
                completionPercentage,
                totalUnitsCount: units.length,
                activeUnitsCount: unitBreakdown.filter((u) => u.ordersCount > 0).length,
            },
            unitBreakdown,
            orders,
        });
    } catch (error) {
        console.error("Portal Payasam GET error:", error);
        return NextResponse.json(
            { error: "Failed to load Payasam Challenge data." },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getPortalSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = validateOrderInput(body);
        if (!validation.ok) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        let targetUnitId = session.id;
        let targetSectorId = session.sectorId || "";

        if (session.type === "DIVISION") {
            const requestedUnitId = typeof body.unitId === "string" ? body.unitId.trim() : "";
            if (!requestedUnitId) {
                return NextResponse.json(
                    { error: "Please select a unit." },
                    { status: 400 }
                );
            }

            const unit = await prisma.unit.findUnique({
                where: { id: requestedUnitId },
                select: { id: true, sectorId: true },
            });
            if (!unit) {
                return NextResponse.json(
                    { error: "Selected unit not found." },
                    { status: 404 }
                );
            }
            targetUnitId = unit.id;
            targetSectorId = unit.sectorId;
        } else if (session.type === "SECTOR") {
            const requestedUnitId = typeof body.unitId === "string" ? body.unitId.trim() : "";
            if (!requestedUnitId) {
                return NextResponse.json(
                    { error: "Please select a unit in your sector." },
                    { status: 400 }
                );
            }

            const unit = await prisma.unit.findUnique({
                where: { id: requestedUnitId },
                select: { id: true, sectorId: true },
            });
            if (!unit || unit.sectorId !== session.id) {
                return NextResponse.json(
                    { error: "Selected unit does not belong to your sector." },
                    { status: 403 }
                );
            }
            targetUnitId = unit.id;
            targetSectorId = session.id;
        } else {
            if (!targetSectorId) {
                const u = await prisma.unit.findUnique({
                    where: { id: session.id },
                    select: { sectorId: true },
                });
                targetSectorId = u?.sectorId || "";
            }
        }

        const order = await prisma.payasamOrder.create({
            data: {
                sectorId: targetSectorId,
                unitId: targetUnitId,
                personName: validation.data.personName,
                mobile: validation.data.mobile,
                liters: validation.data.liters,
                paymentStatus: validation.data.paymentStatus,
                source: "PORTAL",
                notes: validation.data.notes,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Order added successfully.",
                order,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Portal Payasam POST error:", error);
        return NextResponse.json(
            { error: "Failed to add order." },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getPortalSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const action = typeof body.action === "string" ? body.action : "";
        const orderIds: string[] = Array.isArray(body.orderIds)
            ? body.orderIds.filter((x: unknown) => typeof x === "string" && x.trim())
            : [];
        const unitIds: string[] = Array.isArray(body.unitIds)
            ? body.unitIds.filter((x: unknown) => typeof x === "string" && x.trim())
            : [];

        if (orderIds.length === 0 && unitIds.length === 0) {
            return NextResponse.json(
                { error: "Please select at least one order or unit." },
                { status: 400 }
            );
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
            case "UNDO_SECTOR_HANDOVER":
                updateData = {
                    handedOverToSector: false,
                    sectorHandoverAt: null,
                };
                break;
            case "HANDOVER_TO_DIVISION":
                if (session.type === "UNIT") {
                    return NextResponse.json(
                        { error: "Only Sector or Division accounts can record Division handover." },
                        { status: 403 }
                    );
                }
                updateData = {
                    paymentStatus: "PAID",
                    handedOverToSector: true,
                    sectorHandoverAt: now,
                    handedOverToDivision: true,
                    divisionHandoverAt: now,
                };
                break;
            case "UNDO_DIVISION_HANDOVER":
                if (session.type === "UNIT") {
                    return NextResponse.json(
                        { error: "Only Sector or Division accounts can update Division handover." },
                        { status: 403 }
                    );
                }
                updateData = {
                    handedOverToDivision: false,
                    divisionHandoverAt: null,
                };
                break;
            default:
                return NextResponse.json({ error: "Invalid bulk action." }, { status: 400 });
        }

        const whereClause: Record<string, unknown> = {};
        if (session.type === "UNIT") {
            whereClause.unitId = session.id;
        } else if (session.type === "SECTOR") {
            whereClause.sectorId = session.id;
        }

        if (orderIds.length > 0) {
            whereClause.id = { in: orderIds };
        } else if (unitIds.length > 0) {
            whereClause.unitId = { in: unitIds };
        }

        const result = await prisma.payasamOrder.updateMany({
            where: whereClause,
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            updatedCount: result.count,
        });
    } catch (error) {
        console.error("Portal Payasam bulk PATCH error:", error);
        return NextResponse.json(
            { error: "Failed to apply bulk update." },
            { status: 500 }
        );
    }
}
