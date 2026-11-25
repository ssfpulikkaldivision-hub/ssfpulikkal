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

export async function GET() {
    try {
        const albums = await prisma.galleryAlbum.findMany({
            include: {
                photos: {
                    take: 4,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        image: true,
                        title: true,
                    },
                },
                _count: {
                    select: { photos: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Ensure every album has a cover image (fall back to its first photo if coverImage is empty)
        const formatted = albums.map((album) => ({
            ...album,
            coverImage: album.coverImage || album.photos[0]?.image || null,
            photoCount: album._count.photos,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Failed to fetch gallery albums:", error);
        return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, slug, description, date, coverImage, location } = body;

        if (!title || typeof title !== "string" || !title.trim()) {
            return NextResponse.json({ error: "Event album title is required" }, { status: 400 });
        }

        const trimmedTitle = title.trim();
        const generatedSlug = slug?.trim() ? cleanSlug(slug) : cleanSlug(trimmedTitle);

        if (!generatedSlug) {
            return NextResponse.json({ error: "Valid slug is required" }, { status: 400 });
        }

        // Check if album with same slug exists
        const existing = await prisma.galleryAlbum.findUnique({
            where: { slug: generatedSlug },
        });

        if (existing) {
            return NextResponse.json(
                { error: `An event album with slug "${generatedSlug}" already exists` },
                { status: 409 }
            );
        }

        const album = await prisma.galleryAlbum.create({
            data: {
                title: trimmedTitle,
                slug: generatedSlug,
                description: description?.trim() || null,
                date: date?.trim() || null,
                coverImage: coverImage?.trim() || null,
                location: location?.trim() || null,
            },
        });

        revalidatePath("/", "layout");
        revalidatePath("/gallery");
        revalidatePath(`/gallery/${album.slug}`);

        return NextResponse.json(album, { status: 201 });
    } catch (error: any) {
        console.error("Failed to create gallery album:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create album" },
            { status: 500 }
        );
    }
}
