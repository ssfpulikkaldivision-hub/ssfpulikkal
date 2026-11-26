import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const cleanSlug = (text: string) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const albumSlug = searchParams.get("albumSlug") || searchParams.get("slug");
        const albumId = searchParams.get("albumId");

        const where: any = {};
        if (albumId) {
            where.albumId = albumId;
        } else if (albumSlug) {
            where.OR = [
                { eventSlug: albumSlug },
                { event: { contains: albumSlug.replace(/-/g, " ") } },
            ];
        }

        const images = await prisma.gallery.findMany({
            where,
            include: {
                album: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        coverImage: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(images);
    } catch (error) {
        console.error("Failed to fetch gallery:", error);
        return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Helper to resolve or create album
        const resolveAlbum = async (
            albumId?: string,
            eventSlug?: string,
            eventTitle?: string
        ): Promise<{ id?: string; slug?: string; title?: string }> => {
            if (albumId) {
                const found = await prisma.galleryAlbum.findUnique({ where: { id: albumId } });
                if (found) return { id: found.id, slug: found.slug, title: found.title };
            }
            if (eventSlug) {
                const found = await prisma.galleryAlbum.findUnique({ where: { slug: eventSlug } });
                if (found) return { id: found.id, slug: found.slug, title: found.title };
            }
            if (eventTitle && eventTitle.trim()) {
                const trimmed = eventTitle.trim();
                const genSlug = cleanSlug(trimmed);
                let found = await prisma.galleryAlbum.findFirst({
                    where: { OR: [{ title: trimmed }, { slug: genSlug }] },
                });
                if (!found && genSlug) {
                    try {
                        found = await prisma.galleryAlbum.create({
                            data: {
                                title: trimmed,
                                slug: genSlug,
                            },
                        });
                    } catch {
                        // ignore collision
                    }
                }
                if (found) return { id: found.id, slug: found.slug, title: found.title };
            }
            return {
                id: undefined,
                slug: eventSlug ? cleanSlug(eventSlug) : undefined,
                title: eventTitle?.trim() || undefined,
            };
        };

        // 1. Bulk array of items: [ { image, title, event, albumId, eventSlug }, ... ]
        if (Array.isArray(body)) {
            const validItems = body.filter(
                (item) => item && typeof item.image === "string" && item.image.trim().length > 0
            );
            if (validItems.length === 0) {
                return NextResponse.json({ error: "No valid images provided" }, { status: 400 });
            }

            let insertedCount = 0;
            for (const item of validItems) {
                const resolved = await resolveAlbum(item.albumId, item.eventSlug, item.event);
                const created = await prisma.gallery.create({
                    data: {
                        image: item.image.trim(),
                        title: item.title?.trim() || null,
                        event: resolved.title || item.event?.trim() || null,
                        eventSlug: resolved.slug || null,
                        albumId: resolved.id || null,
                    },
                });

                // Update album cover image if missing
                if (resolved.id) {
                    await prisma.galleryAlbum.updateMany({
                        where: { id: resolved.id, coverImage: null },
                        data: { coverImage: item.image.trim() },
                    });
                }
                insertedCount++;
            }

            revalidatePath("/", "layout");
            revalidatePath("/gallery");

            return NextResponse.json({ success: true, count: insertedCount });
        }

        // 2. Bulk images with shared album/title/event: { images: string[], title?: string, event?: string, albumId?: string, eventSlug?: string }
        if (body.images && Array.isArray(body.images)) {
            const validUrls = body.images.filter(
                (url: string) => typeof url === "string" && url.trim().length > 0
            );
            if (validUrls.length === 0) {
                return NextResponse.json({ error: "No valid images provided" }, { status: 400 });
            }

            const resolved = await resolveAlbum(body.albumId, body.eventSlug, body.event);
            let insertedCount = 0;

            for (const url of validUrls) {
                await prisma.gallery.create({
                    data: {
                        image: url.trim(),
                        title: body.title?.trim() || null,
                        event: resolved.title || body.event?.trim() || null,
                        eventSlug: resolved.slug || null,
                        albumId: resolved.id || null,
                    },
                });
                insertedCount++;
            }

            // Update album cover image if missing
            if (resolved.id && validUrls.length > 0) {
                await prisma.galleryAlbum.updateMany({
                    where: { id: resolved.id, coverImage: null },
                    data: { coverImage: validUrls[0].trim() },
                });
            }

            revalidatePath("/", "layout");
            revalidatePath("/gallery");
            if (resolved.slug) {
                revalidatePath(`/gallery/${resolved.slug}`);
            }

            return NextResponse.json({ success: true, count: insertedCount });
        }

        // 3. Single image creation
        const { image, title, event, albumId, eventSlug } = body;

        if (!image || typeof image !== "string" || !image.trim()) {
            return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
        }

        const resolved = await resolveAlbum(albumId, eventSlug, event);

        const item = await prisma.gallery.create({
            data: {
                image: image.trim(),
                title: title?.trim() || null,
                event: resolved.title || event?.trim() || null,
                eventSlug: resolved.slug || null,
                albumId: resolved.id || null,
            },
        });

        if (resolved.id) {
            await prisma.galleryAlbum.updateMany({
                where: { id: resolved.id, coverImage: null },
                data: { coverImage: image.trim() },
            });
        }

        revalidatePath("/", "layout");
        revalidatePath("/gallery");
        if (resolved.slug) {
            revalidatePath(`/gallery/${resolved.slug}`);
        }

        return NextResponse.json(item);
    } catch (error) {
        console.error("Gallery create error:", error);
        return NextResponse.json({ error: "Failed to add image(s)" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Missing image IDs" }, { status: 400 });
        }

        const deleted = await prisma.gallery.deleteMany({
            where: {
                id: { in: ids },
            },
        });

        revalidatePath("/", "layout");
        revalidatePath("/gallery");

        return NextResponse.json({ success: true, count: deleted.count });
    } catch (error) {
        console.error("Gallery bulk delete error:", error);
        return NextResponse.json({ error: "Failed to delete images" }, { status: 500 });
    }
}
