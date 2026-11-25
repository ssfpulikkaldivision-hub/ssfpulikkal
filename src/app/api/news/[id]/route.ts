import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import slugify from "slugify";
import { revalidatePath } from "next/cache";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const news = await prisma.news.findUnique({
            where: { id: id },
        });
        if (!news) return NextResponse.json({ error: "News not found" }, { status: 404 });
        return NextResponse.json(news);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, slug: customSlug, shortDescription, content, image, isFeatured, status } = body;

        const data: any = {
            title,
            shortDescription,
            content,
            image,
            isFeatured,
        };

        if (status) {
            data.status = status;
        }

        if (customSlug && typeof customSlug === "string" && customSlug.trim()) {
            const formatted = slugify(customSlug.trim(), { lower: true, strict: true });
            if (formatted) {
                // Ensure slug is not already used by another news item
                const existing = await prisma.news.findFirst({
                    where: {
                        slug: formatted,
                        NOT: { id },
                    },
                });
                if (existing) {
                    return NextResponse.json({ error: "Slug is already in use by another article" }, { status: 400 });
                }
                data.slug = formatted;
            }
        }

        const news = await prisma.news.update({
            where: { id: id },
            data,
        });

        revalidatePath("/", "layout");
        revalidatePath("/news");
        if (news.slug) revalidatePath(`/news/${news.slug}`);

        return NextResponse.json(news);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update news" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.news.delete({
            where: { id: id },
        });

        revalidatePath("/", "layout");
        revalidatePath("/news");

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete news" }, { status: 500 });
    }
}
