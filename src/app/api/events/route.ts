import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { formatUrl } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

export async function GET() {
    try {
        const events = await prisma.event.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(events);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, slug: customSlug, description, date, time, venue, image, category, status, registerUrl, registerButtonText } = body;

        if (!title || !description || !date || !venue) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let baseSlug = "";
        if (customSlug && typeof customSlug === "string" && customSlug.trim()) {
            baseSlug = slugify(customSlug.trim(), { lower: true, strict: true });
        }
        if (!baseSlug) {
            const fromTitle = slugify(title, { lower: true, strict: true });
            baseSlug = fromTitle ? `${fromTitle}-${Date.now().toString().slice(-4)}` : `event-${Date.now().toString().slice(-6)}`;
        }

        // Ensure unique slug
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.event.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const hasRegisterUrl = typeof registerUrl === "string" && registerUrl.trim().length > 0;
        const sanitizedRegisterUrl = hasRegisterUrl ? formatUrl(registerUrl.trim()) : null;

        const event = await prisma.event.create({
            data: {
                title,
                slug,
                description,
                date,
                time,
                venue,
                image,
                category,
                status: status || "UPCOMING",
                registerUrl: sanitizedRegisterUrl,
                registerButtonText: hasRegisterUrl ? (registerButtonText?.trim() || "Register for Event") : null,
            },
        });
        revalidatePath("/", "layout");
        revalidatePath("/events");
        if (event.slug) revalidatePath(`/events/${event.slug}`);

        return NextResponse.json(event);
    } catch (error) {
        console.error("Event creation error:", error);
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}
