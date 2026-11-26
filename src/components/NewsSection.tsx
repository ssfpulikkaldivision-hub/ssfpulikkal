"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { formatSSF } from "@/lib/ssf-formatter";

interface NewsItem {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    image: string;
    createdAt: Date;
}

interface NewsSectionProps {
    news: NewsItem[];
}

export function NewsSection({ news }: NewsSectionProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <section id="news" className="py-32 bg-white">
            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                    <div className="max-w-xl">
                        <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 mb-6 font-sans">News & Media</h2>
                        <h3 className="text-5xl md:text-7xl font-display font-medium text-black">Latest Stories</h3>
                    </div>
                    <Link href="/news" className="group flex items-center text-sm font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors whitespace-nowrap">
                        All Articles <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                    {news.length > 0 ? (
                        news.map((item) => (
                            <div
                                key={item.id}
                                className="group cursor-pointer"
                            >
                                <Link href={`/news/${item.slug}`} className="block space-y-8">
                                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 flex items-center justify-center">
                                        {item.image && !item.image.startsWith("/uploads/") ? (
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                                onError={(e) => {
                                                    const target = e.currentTarget;
                                                    target.style.display = "none";
                                                    const placeholder = target.nextElementSibling as HTMLElement;
                                                    if (placeholder) placeholder.style.display = "flex";
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-300"
                                            style={{ display: item.image && !item.image.startsWith("/uploads/") ? "none" : "flex" }}
                                        >
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                                <polyline points="21 15 16 10 5 21"/>
                                            </svg>
                                            <span className="text-xs text-gray-300 font-light">No image</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                            {mounted ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
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
                        ))
                    ) : (
                        <div className="col-span-full py-20 border-t border-gray-100 text-gray-400 font-light italic">
                            No news items found.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
