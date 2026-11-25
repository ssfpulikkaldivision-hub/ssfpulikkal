import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portalAuth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const session = await getPortalSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Current and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "New password must be at least 6 characters" },
                { status: 400 }
            );
        }

        if (session.type === "SECTOR") {
            const sector = await prisma.sector.findUnique({ where: { id: session.id } });
            if (!sector || !sector.password) {
                return NextResponse.json({ error: "Sector record not found" }, { status: 404 });
            }

            const isMatch =
                sector.password === currentPassword.trim() ||
                (sector.password.startsWith("$2") && (await bcrypt.compare(currentPassword.trim(), sector.password)));

            if (!isMatch) {
                return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
            }

            await prisma.sector.update({
                where: { id: session.id },
                data: { password: newPassword.trim() },
            });

            return NextResponse.json({ success: true, message: "Password updated successfully" });
        } else {
            const unit = await prisma.unit.findUnique({ where: { id: session.id } });
            if (!unit || !unit.password) {
                return NextResponse.json({ error: "Unit record not found" }, { status: 404 });
            }

            const isMatch =
                unit.password === currentPassword.trim() ||
                (unit.password.startsWith("$2") && (await bcrypt.compare(currentPassword.trim(), unit.password)));

            if (!isMatch) {
                return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
            }

            await prisma.unit.update({
                where: { id: session.id },
                data: { password: newPassword.trim() },
            });

            return NextResponse.json({ success: true, message: "Password updated successfully" });
        }
    } catch (error: any) {
        console.error("Change password error:", error);
        return NextResponse.json({ error: "Failed to update password. Please try again." }, { status: 500 });
    }
}
