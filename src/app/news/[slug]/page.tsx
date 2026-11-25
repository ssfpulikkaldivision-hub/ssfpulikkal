import prisma from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { notFound } from "next/navigation";
import { Share2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let news = null;
    let footer = null;
    let navbar = null;
    let contact = null;

    try {
        news = await prisma.news.findUnique({
            where: { slug },
        });
        footer = await prisma.footer.findUnique({ where: { id: "footer-content" } });
        navbar = await prisma.navbar.findUnique({ where: { id: "navbar-settings" } });
        contact = await prisma.contact.findUnique({ where: { id: "contact-info" } });
    } catch (err) {
        console.warn("Could not load NewsDetailPage data:", err);
    }

    if (!news || news.status === "DRAFT") notFound();

    return (
        <main className="min-h-screen bg-white">
            <Navbar data={navbar as any} />

            {/* Article Header */}
            <div className="pt-36 md:pt-40 pb-16 md:pb-20 bg-black text-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
                    <div>
                        <div className="flex items-center space-x-3 mb-6">
                            <Link href="/news" className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
                                <ArrowLeft size={13} /> Latest Stories
                            </Link>
                            <span className="text-white/20">•</span>
                            <span className="text-white/40 text-[11px] uppercase font-bold tracking-widest">
                                {new Date(news.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                        </div>
                        <h1 
                            className="font-malayalam text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.35] md:leading-[1.3] text-white tracking-normal mb-10"
                            style={{ fontFamily: "'Anek Malayalam', sans-serif" }}
                        >
                            {news.title}
                        </h1>
                        <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-2xl md:rounded-3xl bg-gray-900 shadow-2xl">
                            <img src={news.image} className="w-full h-full object-cover" alt={news.title} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Article Content */}
            <article className="py-12 md:py-16" style={{ fontFamily: "'Anek Malayalam', sans-serif" }}>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
                    {/* Share Bar in a single horizontal line under the photo */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-10 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Share this post:</span>
                            <div className="flex items-center gap-2">
                                <button className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-[#1877F2] transition-transform hover:scale-110 border border-gray-200/60" title="Share on Facebook">
                                    <Share2 size={16} />
                                </button>
                                <button className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-[#25D366] transition-transform hover:scale-110 border border-gray-200/60" title="Share on WhatsApp">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                </button>
                            </div>
                        </div>

                        <Link href="/news" className="text-xs font-semibold text-gray-500 hover:text-black flex items-center gap-1.5 transition-colors">
                            <ArrowLeft size={13} /> View all news stories
                        </Link>
                    </div>

                    {/* News Content - Full Width of Photo, Left Aligned */}
                    <div className="w-full text-left" style={{ fontFamily: "'Anek Malayalam', sans-serif" }}>
                        <div
                            className="news-content font-malayalam text-left"
                            style={{ fontFamily: "'Anek Malayalam', sans-serif", textAlign: "left" }}
                            dangerouslySetInnerHTML={{ __html: news.content }}
                        />
                    </div>
                </div>
            </article>

            {footer && <Footer data={footer} contact={contact ?? undefined} />}
        </main>
    );
}
