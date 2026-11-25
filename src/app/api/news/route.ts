import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import slugify from "slugify";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const news = await prisma.news.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(news);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, slug: customSlug, shortDescription, content, image, isFeatured, status } = body;

        if (!title || !content || !image) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let baseSlug = "";
        if (customSlug && typeof customSlug === "string" && customSlug.trim()) {
            baseSlug = slugify(customSlug.trim(), { lower: true, strict: true });
        }
        if (!baseSlug) {
            const fromTitle = slugify(title, { lower: true, strict: true });
            baseSlug = fromTitle ? `${fromTitle}-${Date.now().toString().slice(-4)}` : `news-${Date.now().toString().slice(-6)}`;
        }

        // Ensure slug uniqueness
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.news.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const news = await prisma.news.create({
            data: {
                title,
                slug,
                shortDescription,
                content,
                image,
                isFeatured: isFeatured || false,
                status: status === "DRAFT" ? "DRAFT" : "PUBLISHED",
            },
        });

        revalidatePath("/", "layout");
        revalidatePath("/news");

        return NextResponse.json(news);
    } catch (error) {
        console.error("News creation error:", error);
        return NextResponse.json({ error: "Failed to create news" }, { status: 500 });
    }
}
