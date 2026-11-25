import NewsEditor from "@/components/admin/NewsEditor";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let news = null;
    try {
        news = await prisma.news.findUnique({
            where: { id },
        });
    } catch (err) {
        console.warn("Could not load news item in EditNewsPage:", err);
    }

    if (!news) notFound();

    return <NewsEditor initialData={news} isEditing />;
}
