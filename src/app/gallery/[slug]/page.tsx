import prisma from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Share2, Image as ImageIcon } from "lucide-react";
import { EventGalleryClient } from "@/components/EventGalleryClient";

export const revalidate = 60;

interface EventGalleryPageProps {
    params: Promise<{ slug: string }>;
}

export default async function EventGalleryPage({ params }: EventGalleryPageProps) {
    const { slug } = await params;

    // Fetch Album with all its photos + common layout data in parallel
    const [album, footer, navbar, contact] = await Promise.all([
        prisma.galleryAlbum.findUnique({
            where: { slug },
            include: {
                photos: {
                    orderBy: { createdAt: "desc" },
                    take: 50,
                    select: {
                        id: true,
                        image: true,
                        title: true,
                        event: true,
                        createdAt: true,
                    },
                },
            },
        }),
        prisma.footer.findUnique({ where: { id: "footer-content" } }).catch(() => null),
        prisma.navbar.findUnique({ where: { id: "navbar-settings" } }).catch(() => null),
        prisma.contact.findUnique({ where: { id: "contact-info" } }).catch(() => null),
    ]);

    let photos: any[] = album?.photos || [];
    let title = album?.title;
    let description = album?.description;
    let date = album?.date;
    let location = album?.location;

    // Fallback: check if loose photos exist with eventSlug or event name matching slug
    if (!album) {
        const loosePhotos = await prisma.gallery.findMany({
            where: {
                OR: [
                    { eventSlug: slug },
                    { event: { contains: slug.replace(/-/g, " ") } },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
                id: true,
                image: true,
                title: true,
                event: true,
                createdAt: true,
            },
        });

        if (loosePhotos.length === 0) {
            notFound();
        }

        photos = loosePhotos;
        title = loosePhotos[0].event || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    return (
        <main className="min-h-screen bg-white">
            <Navbar data={navbar as any} />

            {/* Event Hero Header */}
            <div className="pt-36 pb-16 bg-black text-white border-b border-zinc-800">
                <div className="container mx-auto px-6 md:px-12 max-w-6xl">
                    <Link
                        href="/gallery"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white uppercase tracking-wider mb-6 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back to All Albums
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                                    Event Gallery
                                </span>
                                <span className="text-xs text-white/50 font-mono">
                                    {photos.length} {photos.length === 1 ? "Photo" : "Photos"}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight text-white">
                                {title}
                            </h1>

                            {description && (
                                <p className="text-white/70 text-sm mt-3 max-w-2xl leading-relaxed font-light">
                                    {description}
                                </p>
                            )}

                            {/* Event Metadata (Date / Venue) */}
                            <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-white/60">
                                {date && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Calendar size={14} className="text-white/40" />
                                        {date}
                                    </span>
                                )}
                                {location && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <MapPin size={14} className="text-white/40" />
                                        {location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Photos Grid & Lightbox */}
            <div className="py-16">
                <div className="container mx-auto px-6 md:px-12 max-w-6xl">
                    <EventGalleryClient photos={photos} eventTitle={title || "Event Gallery"} />
                </div>
            </div>

            {footer && <Footer data={footer} contact={contact ?? undefined} />}
        </main>
    );
}
