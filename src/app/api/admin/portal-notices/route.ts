import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notices = await prisma.portalNotice.findMany({
            orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        });

        return NextResponse.json({ notices });
    } catch (error: any) {
        console.error("Admin fetch notices error:", error);
        return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, priority = "NORMAL", targetAudience = "ALL", fileUrl, isPinned = false } = body;

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
        }

        const notice = await prisma.portalNotice.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                priority,
                targetAudience,
                fileUrl: fileUrl || null,
                isPinned: Boolean(isPinned),
            },
        });

        return NextResponse.json(notice, { status: 201 });
    } catch (error: any) {
        console.error("Admin create notice error:", error);
        return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Notice ID is required" }, { status: 400 });
        }

        await prisma.portalNotice.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Admin delete notice error:", error);
        return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
    }
}
