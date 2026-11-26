import prisma from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { Calendar, ArrowRight, Layers, Image as ImageIcon } from "lucide-react";

export const revalidate = 60;

export default async function GalleryPage() {
    let albums: any[] = [];
    let standalonePhotos: any[] = [];
    let footer = null;
    let navbar = null;
    let contact = null;

    try {
        [albums, standalonePhotos, footer, navbar, contact] = await Promise.all([
            prisma.galleryAlbum.findMany({
                include: {
                    photos: {
                        take: 1,
                        orderBy: { createdAt: "desc" },
                        select: { image: true },
                    },
                    _count: {
                        select: { photos: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.gallery.findMany({
                where: {
                    albumId: null,
                },
                take: 12,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    image: true,
                    title: true,
                    event: true,
                    createdAt: true,
                },
            }),
            prisma.footer.findUnique({ where: { id: "footer-content" } }).catch(() => null),
            prisma.navbar.findUnique({ where: { id: "navbar-settings" } }).catch(() => null),
            prisma.contact.findUnique({ where: { id: "contact-info" } }).catch(() => null),
        ]);
    } catch (err) {
        console.warn("Could not load GalleryPage data:", err);
    }

    return (
        <main className="min-h-screen bg-white">
            <Navbar data={navbar as any} />

            {/* Header Section */}
            <div className="pt-40 pb-20 bg-black text-white">
                <div className="container mx-auto px-6 md:px-12 max-w-6xl">
                    <span className="inline-block tracking-[0.2em] text-[10px] font-bold text-white/40 uppercase mb-4 font-mono">
                        Visual Discovery & Media
                    </span>
                    <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight">
                        Event Gallery
                    </h1>
                    <p className="text-white/60 text-sm md:text-base mt-3 max-w-xl font-light">
                        Browse albums and photo collections from SSF Pulikkal Division and Sector events.
                    </p>
                </div>
            </div>

            {/* Event Albums Grid */}
            <div className="py-20">
                <div className="container mx-auto px-6 md:px-12 max-w-6xl">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-10">
                        <div>
                            <h2 className="text-2xl font-display font-medium text-black">
                                Event Albums
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Browse albums by event
                            </p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700">
                            {albums.length} {albums.length === 1 ? "Album" : "Albums"}
                        </span>
                    </div>

                    {albums.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {albums.map((album) => {
                                const cover = album.coverImage || album.photos[0]?.image || "/placeholder.jpg";
                                const photoCount = album._count?.photos || 0;

                                return (
                                    <Link
                                        key={album.id}
                                        href={`/gallery/${album.slug}`}
                                        className="group flex flex-col bg-white border border-gray-100 hover:border-black rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300"
                                    >
                                        {/* Cover Image */}
                                        <div className="relative aspect-16/10 bg-zinc-100 overflow-hidden">
                                            {cover ? (
                                                <img
                                                    src={cover}
                                                    alt={album.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-300">
                                                    <ImageIcon size={40} />
                                                </div>
                                            )}

                                            {/* Photo Count Badge */}
                                            <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
                                                <Layers size={12} />
                                                {photoCount} {photoCount === 1 ? "Photo" : "Photos"}
                                            </div>

                                            {/* Date Badge */}
                                            {album.date && (
                                                <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5">
                                                    <Calendar size={11} />
                                                    {album.date}
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                            <div>
                                                <h3 className="text-xl font-display font-medium text-black group-hover:text-zinc-700 transition-colors tracking-tight line-clamp-1">
                                                    {album.title}
                                                </h3>
                                                {album.description && (
                                                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                                                        {album.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-black group-hover:translate-x-1 transition-transform">
                                                <span>View Album Photos</span>
                                                <ArrowRight size={14} />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-24 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-700 font-medium text-sm">No Event Albums Created Yet</p>
                            <p className="text-gray-400 text-xs mt-1">
                                Photos will appear grouped under their respective events once added from admin.
                            </p>
                        </div>
                    )}

                    {/* Standalone / Recent Photos section if any exist without an album */}
                    {standalonePhotos.length > 0 && (
                        <div className="mt-24 pt-16 border-t border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-xl font-display font-medium text-black">
                                    Recent Highlights
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Other featured photographs from Pulikkal Division
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {standalonePhotos.map((photo) => (
                                    <div
                                        key={photo.id}
                                        className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 group shadow-2xs border border-gray-100"
                                    >
                                        <img
                                            src={photo.image}
                                            alt={photo.title || "Gallery photo"}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        {photo.event && (
                                            <span className="absolute top-2 left-2 bg-black/70 text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                                                {photo.event}
                                            </span>
                                        )}
                                        {photo.title && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                <p className="text-white text-xs font-medium line-clamp-2">
                                                    {photo.title}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {footer && <Footer data={footer} contact={contact ?? undefined} />}
        </main>
    );
}
