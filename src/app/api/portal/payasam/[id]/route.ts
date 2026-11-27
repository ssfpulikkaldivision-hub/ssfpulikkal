import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portalAuth";
import prisma from "@/lib/prisma";
import {
    isEnglishName,
    isTenDigitMobile,
    normalizePaymentStatus,
    roundLiters,
} from "@/lib/payasam";

export const dynamic = "force-dynamic";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getPortalSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const existing = await prisma.payasamOrder.findUnique({ where: { id } });

        if (!existing) {
            return NextResponse.json({ error: "Order not found." }, { status: 404 });
        }

        const hasAccess =
            (session.type === "UNIT" && existing.unitId === session.id) ||
            (session.type === "SECTOR" && existing.sectorId === session.id);

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const updateData: {
            personName?: string;
            mobile?: string;
            liters?: number;
            paymentStatus?: string;
            handedOverToSector?: boolean;
            sectorHandoverAt?: Date | null;
            handedOverToDivision?: boolean;
            divisionHandoverAt?: Date | null;
            notes?: string | null;
        } = {};

        if (typeof body.personName === "string") {
            const trimmed = body.personName.trim();
            if (!trimmed) {
                return NextResponse.json({ error: "Person name cannot be empty." }, { status: 400 });
            }
            if (!isEnglishName(trimmed)) {
                return NextResponse.json(
                    { error: "Person name must be in English letters only." },
                    { status: 400 }
                );
            }
            updateData.personName = trimmed;
        }

        if (typeof body.mobile === "string") {
            const trimmed = body.mobile.trim();
            if (!isTenDigitMobile(trimmed)) {
                return NextResponse.json(
                    { error: "Mobile number must be exactly 10 digits." },
                    { status: 400 }
                );
            }
            updateData.mobile = trimmed;
        }

        if (body.liters !== undefined) {
            const litersNum = Number(body.liters);
            if (!Number.isFinite(litersNum) || litersNum <= 0) {
                return NextResponse.json({ error: "Liters must be greater than 0." }, { status: 400 });
            }
            updateData.liters = roundLiters(litersNum);
        }

        if (typeof body.paymentStatus === "string") {
            updateData.paymentStatus = normalizePaymentStatus(body.paymentStatus);
        }

        if (typeof body.handedOverToSector === "boolean") {
            updateData.handedOverToSector = body.handedOverToSector;
            updateData.sectorHandoverAt = body.handedOverToSector ? new Date() : null;
            if (body.handedOverToSector) {
                updateData.paymentStatus = "PAID";
            }
        }

        if (typeof body.handedOverToDivision === "boolean") {
            if (session.type === "UNIT") {
                return NextResponse.json(
                    { error: "Only Sector or Division accounts can record Division handover." },
                    { status: 403 }
                );
            }
            // Prerequisite: order must have been handed to sector first before it can be handed to division
            if (body.handedOverToDivision && !existing.handedOverToSector) {
                return NextResponse.json(
                    { error: "This order has not been handed over to the Sector yet. Please complete the Unit → Sector handover first." },
                    { status: 400 }
                );
            }
            updateData.handedOverToDivision = body.handedOverToDivision;
            updateData.divisionHandoverAt = body.handedOverToDivision ? new Date() : null;
            if (body.handedOverToDivision) {
                updateData.paymentStatus = "PAID";
            }
        }

        if (body.notes !== undefined) {
            updateData.notes =
                typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
        }

        const updated = await prisma.payasamOrder.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, order: updated });
    } catch (error) {
        console.error("Portal Payasam PATCH error:", error);
        return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getPortalSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const existing = await prisma.payasamOrder.findUnique({ where: { id } });

        if (!existing) {
            return NextResponse.json({ error: "Order not found." }, { status: 404 });
        }

        const hasAccess =
            (session.type === "UNIT" && existing.unitId === session.id) ||
            (session.type === "SECTOR" && existing.sectorId === session.id);

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.payasamOrder.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Portal Payasam DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete order." }, { status: 500 });
    }
}
