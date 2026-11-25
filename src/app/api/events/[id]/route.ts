import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { formatUrl } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const event = await prisma.event.findUnique({
            where: { id },
        });
        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
        return NextResponse.json(event);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, slug: customSlug, description, date, time, venue, image, category, status, registerUrl, registerButtonText } = body;

        const hasRegisterUrl = typeof registerUrl === "string" && registerUrl.trim().length > 0;
        const sanitizedRegisterUrl = hasRegisterUrl ? formatUrl(registerUrl.trim()) : null;

        const updateData: any = {
            title,
            description,
            date,
            time,
            venue,
            image,
            category,
            status,
            registerUrl: sanitizedRegisterUrl,
            registerButtonText: hasRegisterUrl ? (registerButtonText?.trim() || "Register for Event") : null,
        };

        if (customSlug && typeof customSlug === "string" && customSlug.trim()) {
            const formatted = slugify(customSlug.trim(), { lower: true, strict: true });
            if (formatted) {
                const existing = await prisma.event.findFirst({
                    where: {
                        slug: formatted,
                        NOT: { id },
                    },
                });
                if (existing) {
                    return NextResponse.json({ error: "Slug is already in use by another event" }, { status: 400 });
                }
                updateData.slug = formatted;
            }
        }

        const event = await prisma.event.update({
            where: { id },
            data: updateData,
        });

        revalidatePath("/", "layout");
        revalidatePath("/events");
        if (event.slug) revalidatePath(`/events/${event.slug}`);

        return NextResponse.json(event);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.event.delete({
            where: { id },
        });

        revalidatePath("/", "layout");
        revalidatePath("/events");

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}
