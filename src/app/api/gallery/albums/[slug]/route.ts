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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const album = await prisma.galleryAlbum.findUnique({
            where: { slug },
            include: {
                photos: {
                    orderBy: { createdAt: "desc" },
                },
                _count: {
                    select: { photos: true },
                },
            },
        });

        if (!album) {
            // Also check if any loose photos exist with event matching this slug
            const photos = await prisma.gallery.findMany({
                where: {
                    OR: [
                        { eventSlug: slug },
                        { event: { contains: slug.replace(/-/g, " ") } },
                    ],
                },
                orderBy: { createdAt: "desc" },
            });

            if (photos.length > 0) {
                return NextResponse.json({
                    id: "virtual-" + slug,
                    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                    slug,
                    description: null,
                    coverImage: photos[0]?.image || null,
                    date: null,
                    location: null,
                    photos,
                    photoCount: photos.length,
                });
            }

            return NextResponse.json({ error: "Event album not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...album,
            coverImage: album.coverImage || album.photos[0]?.image || null,
            photoCount: album._count.photos,
        });
    } catch (error) {
        console.error("Failed to fetch gallery album by slug:", error);
        return NextResponse.json({ error: "Failed to fetch album" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();
        const { title, slug: newSlug, description, date, coverImage, location } = body;

        const existing = await prisma.galleryAlbum.findUnique({
            where: { slug },
        });

        if (!existing) {
            return NextResponse.json({ error: "Event album not found" }, { status: 404 });
        }

        const data: any = {};
        if (title !== undefined) data.title = title.trim();
        if (newSlug !== undefined) data.slug = cleanSlug(newSlug);
        if (description !== undefined) data.description = description.trim() || null;
        if (date !== undefined) data.date = date.trim() || null;
        if (coverImage !== undefined) data.coverImage = coverImage.trim() || null;
        if (location !== undefined) data.location = location.trim() || null;

        const updated = await prisma.galleryAlbum.update({
            where: { slug },
            data,
        });

        revalidatePath("/", "layout");
        revalidatePath("/gallery");
        revalidatePath(`/gallery/${slug}`);
        if (newSlug && newSlug !== slug) {
            revalidatePath(`/gallery/${newSlug}`);
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Failed to update gallery album:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update album" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const album = await prisma.galleryAlbum.findUnique({
            where: { slug },
        });

        if (!album) {
            return NextResponse.json({ error: "Event album not found" }, { status: 404 });
        }

        // Delete album (cascade deletes photos)
        await prisma.galleryAlbum.delete({
            where: { id: album.id },
        });

        revalidatePath("/", "layout");
        revalidatePath("/gallery");
        revalidatePath(`/gallery/${slug}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete gallery album:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete album" },
            { status: 500 }
        );
    }
}
