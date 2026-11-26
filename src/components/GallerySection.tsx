"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryItem {
    id: string;
    image: string;
    title: string | null;
    event?: string | null;
}

interface GallerySectionProps {
    images: GalleryItem[];
}

export function GallerySection({ images }: GallerySectionProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeEvent, setActiveEvent] = useState("All");

    const events = ["All", ...Array.from(new Set(images.map((img) => img.event).filter((evt): evt is string => !!evt)))];

    const filteredImages = activeEvent === "All"
        ? images
        : images.filter((img) => img.event === activeEvent);

    return (
        <section id="gallery" className="py-32 bg-white">
            <div className="container mx-auto px-6 md:px-12">
                <div className="mb-20">
                    <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 mb-6 font-sans">Visual Discovery</h2>
                    <h3 className="text-5xl md:text-7xl font-display font-medium text-black">Gallery</h3>
                </div>

                {/* Event Category Filters */}
                {events.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-12">
                        {events.map((evt) => (
                            <button
                                key={evt}
                                onClick={() => setActiveEvent(evt)}
                                className={cn(
                                    "px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer",
                                    activeEvent === evt
                                        ? "bg-black border-black text-white"
                                        : "bg-white border-gray-100 text-gray-400 hover:text-black hover:border-black"
                                )}
                            >
                                {evt}
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredImages.length > 0 ? (
                        filteredImages.map((img) => (
                            <div
                                key={img.id}
                                className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100 group"
                                onClick={() => setSelectedImage(img.image)}
                            >
                                <img
                                    src={img.image}
                                    alt={img.title || "Gallery Image"}
                                    className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        target.style.display = "none";
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 text-left">
                                    {img.event && <span className="text-white/60 text-[9px] uppercase tracking-widest font-bold mb-1">{img.event}</span>}
                                    {img.title && <p className="text-white text-sm font-medium line-clamp-2">{img.title}</p>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-left py-10 text-gray-400 font-light italic">
                            No images matching this category.
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 transition-all">
                    <button
                        className="absolute top-6 right-6 text-white hover:text-primary transition-colors p-2"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={40} />
                    </button>
                    <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={selectedImage}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        alt="Expanded gallery image"
                    />
                </div>
            )}
        </section>
    );
}
