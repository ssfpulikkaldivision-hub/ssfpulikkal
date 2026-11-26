import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const hero = await prisma.hero.findUnique({ where: { id: "hero-section" } });
        const img = hero?.bannerImage?.trim();

        if (img && img.startsWith("data:image/")) {
            const match = img.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
            if (match) {
                const mime = match[1];
                const buffer = Buffer.from(match[2], "base64");
                return new NextResponse(buffer, {
                    headers: {
                        "Content-Type": mime,
                        "Cache-Control": "public, max-age=3600",
                    },
                });
            }
        }

        if (img && (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/"))) {
            return NextResponse.redirect(new URL(img, request.url));
        }
    } catch (err) {
        console.warn("Could not load hero image for OG:", err);
    }

    return NextResponse.redirect(new URL("/portal-share.png", request.url));
}
