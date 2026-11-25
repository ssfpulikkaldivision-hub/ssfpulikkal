import prisma from "@/lib/prisma";
import { Camera, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GallerySection } from "@/components/GallerySection";

export const dynamic = "force-dynamic";

export default async function SahithyotsavGalleryPage() {
    let galleryItems: any[] = [];
    try {
        galleryItems = await prisma.gallery.findMany({
            orderBy: { createdAt: "desc" },
        });
    } catch (err) {
        console.warn("Could not load gallery items in SahithyotsavGalleryPage:", err);
    }

    // Filter images that are tagged with "Sahithyotsav" or "Literary Festival" (case-insensitive)
    const filteredItems = galleryItems.filter(item => {
        const eventName = (item.event || "").toLowerCase();
        return eventName.includes("sahithyotsav") || eventName.includes("literary") || eventName.includes("festival") || eventName.includes("litfest");
    });

    // If there are no specific Sahithyotsav images, we fall back to showing all gallery items to keep it populated
    const displayItems = filteredItems.length > 0 ? filteredItems : galleryItems;

    return (
        <main className="flex-1 pb-24 bg-slate-950">
            {/* Header Section */}
            <div className="pt-24 pb-12 bg-slate-950 text-white border-b border-slate-900 relative">
                <div className="absolute top-0 right-1/3 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="container mx-auto px-6 md:px-12">
                    <span className="inline-block tracking-[0.2em] text-[10px] font-bold text-emerald-400 uppercase mb-4">
                        Captured Memories
                    </span>
                    <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight">
                        Festival Gallery
                    </h1>
                    <p className="text-slate-400 text-sm mt-3 font-light max-w-xl">
                        A visual chronicle of the creative and literary expressions of Pulikkal Division Sahithyotsav.
                    </p>
                </div>
            </div>

            {/* Gallery Wrapper with Dark override */}
            <div className="container mx-auto px-6 md:px-12 py-12">
                {displayItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {displayItems.map((item) => (
                            <div
                                key={item.id}
                                className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-900 border border-slate-900/50 cursor-pointer shadow-lg hover:border-emerald-500/30 transition-all duration-300"
                            >
                                <img
                                    src={item.image}
                                    alt={item.title || "Gallery Item"}
                                    className="w-full h-full object-cover grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-left">
                                    {item.event && (
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
                                            {item.event}
                                        </span>
                                    )}
                                    {item.title && (
                                        <h3 className="text-white text-sm font-semibold leading-tight line-clamp-2">
                                            {item.title}
                                        </h3>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-slate-900/10 border border-slate-900 rounded-3xl max-w-xl mx-auto space-y-4">
                        <Camera className="mx-auto text-slate-700" size={40} />
                        <h3 className="text-lg font-medium text-white">No images uploaded yet</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                            Images of the festival will appear here once the event begins and photographers upload files.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
