import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const existing = await prisma.payasamOrder.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Order not found." }, { status: 404 });
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

        if (typeof body.personName === "string" && body.personName.trim()) {
            if (!isEnglishName(body.personName)) {
                return NextResponse.json(
                    { error: "Person name must be in English letters only." },
                    { status: 400 }
                );
            }
            updateData.personName = body.personName.trim();
        }
        if (typeof body.mobile === "string" && body.mobile.trim()) {
            if (!isTenDigitMobile(body.mobile)) {
                return NextResponse.json(
                    { error: "Mobile number must be exactly 10 digits." },
                    { status: 400 }
                );
            }
            updateData.mobile = body.mobile.trim();
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
            updateData.handedOverToDivision = body.handedOverToDivision;
            updateData.divisionHandoverAt = body.handedOverToDivision ? new Date() : null;
            if (body.handedOverToDivision) {
                updateData.paymentStatus = "PAID";
                updateData.handedOverToSector = true;
                updateData.sectorHandoverAt = new Date();
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
        console.error("Admin Payasam order PATCH error:", error);
        return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const existing = await prisma.payasamOrder.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Order not found." }, { status: 404 });
        }

        await prisma.payasamOrder.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin Payasam order DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete order." }, { status: 500 });
    }
}
