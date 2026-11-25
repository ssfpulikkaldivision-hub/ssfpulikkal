"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatSSF } from "@/lib/ssf-formatter";
import { cn } from "@/lib/utils";

interface HeroProps {
    data: {
        bannerImage: string;
        bannerImages?: string | null;
        title: string;
        subtitle: string;
        btn1Text?: string;
        btn1Link?: string;
        btn2Text?: string;
        btn2Link?: string;
        showBtn1?: boolean | null;
        showBtn2?: boolean | null;
    };
}

export function Hero({ data }: HeroProps) {
    const hasBtn1 = data.showBtn1 !== false && !!data.btn1Text?.trim();
    const hasBtn2 = data.showBtn2 !== false && !!data.btn2Text?.trim();

    // Extract images list (fallback to single bannerImage)
    const images = useMemo(() => {
        if (data.bannerImages) {
            try {
                const parsed = JSON.parse(data.bannerImages);
                if (Array.isArray(parsed)) {
                    const filtered = parsed.filter(
                        (img) => typeof img === "string" && img.trim().length > 0
                    );
                    if (filtered.length > 0) return filtered;
                }
            } catch (e) {
                console.error("Failed to parse bannerImages JSON", e);
            }
        }
        return data.bannerImage?.trim() ? [data.bannerImage] : [];
    }, [data.bannerImages, data.bannerImage]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Ensure valid index if images change
    useEffect(() => {
        if (currentIndex >= images.length) {
            setCurrentIndex(0);
        }
    }, [images.length, currentIndex]);

    // Auto-advance slideshow every 5 seconds
    useEffect(() => {
        if (images.length <= 1 || isHovered) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [images.length, isHovered]);

    const goToPrev = useCallback(() => {
        if (images.length <= 1) return;
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    const goToNext = useCallback(() => {
        if (images.length <= 1) return;
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const goToSlide = (idx: number) => {
        setCurrentIndex(idx);
    };

    return (
        <section
            className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-black"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Slides with smooth Ken-Burns style crossfade */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {images.map((img, idx) => (
                    <motion.div
                        key={img + idx}
                        initial={false}
                        animate={{
                            opacity: idx === currentIndex ? 1 : 0,
                            scale: idx === currentIndex ? 1.05 : 1.15,
                        }}
                        transition={{
                            opacity: { duration: 1.2, ease: "easeInOut" },
                            scale: { duration: 7, ease: "easeOut" },
                        }}
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat grayscale-[0.15]"
                        style={{ backgroundImage: `url("${img}")` }}
                    />
                ))}
                {/* Fallback if no images provided */}
                {images.length === 0 && (
                    <div className="absolute inset-0 bg-zinc-900" />
                )}

                {/* Dark Gradient Overlay for optimal readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30 pointer-events-none" />
            </div>

            {/* Slider Controls (shown only when multiple images exist) */}
            {images.length > 1 && (
                <>
                    {/* Previous Button */}
                    <button
                        type="button"
                        onClick={goToPrev}
                        aria-label="Previous slide"
                        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/35 hover:bg-black/70 text-white/80 hover:text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                    >
                        <ChevronLeft size={22} />
                    </button>

                    {/* Next Button */}
                    <button
                        type="button"
                        onClick={goToNext}
                        aria-label="Next slide"
                        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/35 hover:bg-black/70 text-white/80 hover:text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                    >
                        <ChevronRight size={22} />
                    </button>

                    {/* Slide Indicators & Counter */}
                    <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
                        <div className="flex items-center gap-1.5">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => goToSlide(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                                        idx === currentIndex
                                            ? "w-7 bg-white shadow-sm"
                                            : "w-2 bg-white/40 hover:bg-white/70"
                                    )}
                                />
                            ))}
                        </div>
                        <span className="text-[11px] font-mono tracking-widest text-white/70 pl-2 border-l border-white/20 select-none">
                            {String(currentIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
                        </span>
                    </div>
                </>
            )}

            {/* Content Container */}
            <div className="container mx-auto px-6 md:px-12 relative z-10 pointer-events-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-4xl"
                >
                    <span className="inline-block tracking-[0.2em] text-[10px] font-bold text-white/60 uppercase mb-8">
                        Established 1973
                    </span>
                    <h1 className="text-6xl md:text-8xl text-white mb-8 leading-[1.1] font-display font-medium tracking-tight">
                        {formatSSF(data.title)}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl font-light leading-relaxed">
                        {formatSSF(data.subtitle)}
                    </p>
                    {(hasBtn1 || hasBtn2) && (
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                            {hasBtn1 && (
                                <Link href={data.btn1Link || "#"} className="btn-primary w-full sm:w-auto">
                                    {data.btn1Text}
                                </Link>
                            )}
                            {hasBtn2 && (
                                <Link
                                    href={data.btn2Link || "#"}
                                    className="btn-secondary w-full sm:w-auto bg-transparent border-white/30 text-white hover:bg-white hover:text-black"
                                >
                                    {data.btn2Text}
                                </Link>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
