import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();

        // 1. Gather all file entries across "files" and "file" fields
        const rawEntries: any[] = [
            ...data.getAll("files"),
            ...data.getAll("file"),
        ];

        const files: File[] = rawEntries.filter(
            (entry): entry is File =>
                Boolean(entry && typeof (entry as any).arrayBuffer === "function")
        );

        if (files.length === 0) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const urls: string[] = [];

        // 2. Process each file
        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Clean filename
            const rawName = file.name || "image.jpg";
            const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
            const uniqueId = Math.random().toString(36).substring(2, 8);
            const filename = `${Date.now()}-${uniqueId}-${safeName}`;

            try {
                // Attempt saving to local filesystem (works in Node / dev server)
                const uploadsDir = join(process.cwd(), "public", "uploads");
                await mkdir(uploadsDir, { recursive: true });
                const filepath = join(uploadsDir, filename);
                await writeFile(filepath, buffer);
                urls.push(`/uploads/${filename}`);
            } catch (fsError) {
                // In serverless / Cloudflare Workers environment where filesystem is read-only,
                // fall back to base64 Data URL so upload never fails.
                console.warn("Local filesystem write failed, using base64 Data URL:", fsError);
                const mime = file.type || "image/jpeg";
                const base64 = buffer.toString("base64");
                urls.push(`data:${mime};base64,${base64}`);
            }
        }

        return NextResponse.json({
            success: true,
            url: urls[0],
            urls: urls,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
