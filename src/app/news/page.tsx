import prisma from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { formatSSF } from "@/lib/ssf-formatter";

export const revalidate = 60;

export default async function NewsListPage() {
    let news: any[] = [];
    let footer = null;
    let navbar = null;
    let contact = null;

    try {
        [news, footer, navbar, contact] = await Promise.all([
            prisma.news.findMany({
                where: { NOT: { status: "DRAFT" } },
                orderBy: { createdAt: "desc" },
                take: 30,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    shortDescription: true,
                    image: true,
                    createdAt: true,
                },
            }),
            prisma.footer.findUnique({ where: { id: "footer-content" } }),
            prisma.navbar.findUnique({ where: { id: "navbar-settings" } }),
            prisma.contact.findUnique({ where: { id: "contact-info" } }),
        ]);
    } catch (err) {
        console.warn("Could not load NewsListPage data:", err);
    }

    return (
        <main className="min-h-screen bg-white">
            <Navbar data={navbar as any} />

            {/* Page Header */}
            <div className="pt-40 pb-20 bg-black text-white">
                <div className="container mx-auto px-6 md:px-12">
                    <span className="inline-block tracking-[0.2em] text-[10px] font-bold text-white/40 uppercase mb-8">News & Media</span>
                    <h1 className="text-6xl md:text-8xl font-display font-medium tracking-tight">Latest Stories</h1>
                </div>
            </div>

            <section className="py-32">
                <div className="container mx-auto px-6 md:px-12">
                    {news.length === 0 ? (
                        <p className="text-gray-400 font-light italic py-20 border-t border-gray-100">No news items found.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                            {news.map((item) => (
                                <div key={item.id} className="group cursor-pointer">
                                    <Link href={`/news/${item.slug}`} className="block space-y-8">
                                        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {item.image && !item.image.startsWith("/uploads/") ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-2 text-gray-300">
                                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                                        <polyline points="21 15 16 10 5 21"/>
                                                    </svg>
                                                    <span className="text-xs text-gray-300 font-light">No image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </div>
                                            <h4 
                                                className="font-malayalam text-xl md:text-2xl font-bold text-black group-hover:text-primary transition-colors leading-snug tracking-normal"
                                                style={{ fontFamily: "'Anek Malayalam', sans-serif" }}
                                            >
                                                {formatSSF(item.title)}
                                            </h4>
                                            <p 
                                                className="font-malayalam text-gray-600 font-normal line-clamp-2 leading-relaxed tracking-normal"
                                                style={{ fontFamily: "'Anek Malayalam', sans-serif" }}
                                            >
                                                {formatSSF(item.shortDescription)}
                                            </p>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {footer && <Footer data={footer} contact={contact ?? undefined} />}
        </main>
    );
}
