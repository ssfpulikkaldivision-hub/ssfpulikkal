"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Share2, Check, Download, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
    id: string;
    image: string;
    title: string | null;
    event?: string | null;
}

interface EventGalleryClientProps {
    photos: Photo[];
    eventTitle: string;
    albumSlug?: string;
    totalCount?: number;
}

export function EventGalleryClient({ photos: initialPhotos, eventTitle, albumSlug, totalCount }: EventGalleryClientProps) {
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const total = totalCount ?? photos.length;
    const hasMore = photos.length < total && !!albumSlug;

    const handleLoadMore = async () => {
        if (!albumSlug || loadingMore) return;
        setLoadingMore(true);
        setLoadError(null);
        try {
            const res = await fetch(`/api/gallery/albums/${encodeURIComponent(albumSlug)}?skip=${photos.length}&take=16`);
            if (!res.ok) throw new Error("Failed to load more photos");
            const data = await res.json();
            if (Array.isArray(data.photos) && data.photos.length > 0) {
                setPhotos((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const next = data.photos.filter((p: Photo) => !existingIds.has(p.id));
                    return [...prev, ...next];
                });
            }
        } catch (err: any) {
            setLoadError(err?.message || "Could not load more photos");
        } finally {
            setLoadingMore(false);
        }
    };

    const handleShare = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const nextImage = () => {
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex + 1) % photos.length);
        }
    };

    const prevImage = () => {
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
        }
    };

    return (
        <div className="space-y-8">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="text-xs text-gray-400 font-mono">
                    Showing all {photos.length} {photos.length === 1 ? "photo" : "photos"}
                </span>

                <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                    {copied ? (
                        <>
                            <Check size={14} className="text-emerald-600" />
                            Link Copied!
                        </>
                    ) : (
                        <>
                            <Share2 size={14} />
                            Share Album
                        </>
                    )}
                </button>
            </div>

            {/* Photo Grid */}
            {photos.length > 0 ? (
                <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                        <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.4) }}
                            className="group relative bg-gray-100 rounded-xl overflow-hidden aspect-square cursor-pointer shadow-sm border border-gray-100 hover:border-black transition-all"
                            onClick={() => setLightboxIndex(index)}
                        >
                            <img
                                src={photo.image}
                                alt={photo.title || eventTitle}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                                decoding="async"
                            />

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                {photo.title && (
                                    <p className="text-white text-xs font-medium line-clamp-2 leading-tight">
                                        {photo.title}
                                    </p>
                                )}
                                <div className="flex items-center justify-between text-white/70 text-[10px] pt-2 mt-1 border-t border-white/20">
                                    <span>Click to view</span>
                                    <ZoomIn size={12} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                {hasMore && (
                    <div className="flex flex-col items-center gap-2 pt-4">
                        {loadError && <p className="text-xs text-red-500">{loadError}</p>}
                        <button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-6 py-2.5 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {loadingMore ? "Loading..." : `Load More (${total - photos.length} remaining)`}
                        </button>
                    </div>
                )}
                </>
            ) : (
                <div className="py-24 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    <p className="text-sm text-gray-500 font-medium">No photos in this album yet.</p>
                </div>
            )}

            {/* Lightbox Modal */}
            <AnimatePresence>
                {lightboxIndex !== null && photos[lightboxIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-8 select-none"
                        onClick={() => setLightboxIndex(null)}
                    >
                        {/* Top Bar */}
                        <div
                            className="flex items-center justify-between text-white z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-0.5">
                                <p className="text-xs uppercase tracking-wider text-white/50 font-bold">
                                    {eventTitle}
                                </p>
                                {photos[lightboxIndex].title && (
                                    <p className="text-sm font-medium text-white">
                                        {photos[lightboxIndex].title}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-white/50">
                                    {lightboxIndex + 1} / {photos.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setLightboxIndex(null)}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Image Viewer with Navigation */}
                        <div
                            className="relative flex-1 flex items-center justify-center p-2 my-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {photos.length > 1 && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        prevImage();
                                    }}
                                    className="absolute left-2 md:left-6 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                            )}

                            <motion.img
                                key={photos[lightboxIndex].id}
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                src={photos[lightboxIndex].image}
                                alt={photos[lightboxIndex].title || eventTitle}
                                className="max-h-[75vh] max-w-[90vw] md:max-w-[80vw] object-contain rounded-lg shadow-2xl"
                            />

                            {photos.length > 1 && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        nextImage();
                                    }}
                                    className="absolute right-2 md:right-6 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110 cursor-pointer"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            )}
                        </div>

                        {/* Bottom Bar */}
                        <div
                            className="flex items-center justify-center text-xs text-white/40 font-mono z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span>Use arrows or click buttons to navigate photos</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
