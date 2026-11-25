import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.gallery.delete({
            where: { id: id },
        });

        revalidatePath("/", "layout");
        revalidatePath("/gallery");
        revalidatePath("/sahithyotsav/gallery");

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
    }
}
