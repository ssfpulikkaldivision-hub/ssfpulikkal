import prisma from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Clock, ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatUrl } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let event = null;
    let footer = null;
    let navbar = null;
    let contact = null;

    try {
        event = await prisma.event.findFirst({
            where: {
                OR: [
                    { slug },
                    { id: slug },
                ],
            },
        });
        footer = await prisma.footer.findUnique({ where: { id: "footer-content" } });
        navbar = await prisma.navbar.findUnique({ where: { id: "navbar-settings" } });
        contact = await prisma.contact.findUnique({ where: { id: "contact-info" } });
    } catch (err) {
        console.warn("Could not load EventDetailPage data:", err);
    }

    if (!event || event.status === "DRAFT") notFound();

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col justify-between">
            <div>
                <Navbar data={navbar as any} />

                {/* Banner Section */}
                <div className="pt-36 md:pt-40 pb-16 md:pb-20 bg-black text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#222,transparent)] opacity-60 pointer-events-none" />
                    <div className="container mx-auto px-6 md:px-12 relative z-10">
                        <div className="flex items-center space-x-3 mb-6">
                            <Link
                                href="/events"
                                className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
                            >
                                <ArrowLeft size={13} /> All Events
                            </Link>
                            <span className="text-white/20">•</span>
                            <span className="bg-white/10 text-white text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded">
                                {event.category}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-medium text-white tracking-tight max-w-4xl">
                            {event.title}
                        </h1>
                    </div>
                </div>

                {/* Details Section */}
                <div className="container mx-auto px-6 md:px-12 py-12">
                    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Main Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {event.image && (
                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 shadow-xl border border-gray-100">
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-6 shadow-sm">
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">About the Event</h2>
                                <p className="text-gray-700 font-light text-base leading-relaxed whitespace-pre-wrap">
                                    {event.description}
                                </p>
                            </div>
                        </div>

                        {/* Meta Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Event Info</h3>

                                <div className="space-y-4 text-sm">
                                    <div className="flex items-start gap-3 text-gray-700">
                                        <Calendar size={18} className="text-black shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</p>
                                            <p className="font-medium text-black">{event.date}</p>
                                        </div>
                                    </div>

                                    {event.time && (
                                        <div className="flex items-start gap-3 text-gray-700">
                                            <Clock size={18} className="text-black shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time</p>
                                                <p className="font-medium text-black">{event.time}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3 text-gray-700">
                                        <MapPin size={18} className="text-black shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Venue</p>
                                            <p className="font-medium text-black">{event.venue}</p>
                                        </div>
                                    </div>
                                </div>

                                {event.status === "UPCOMING" && Boolean(event.registerUrl && event.registerUrl.trim()) && (
                                    <div className="pt-4 border-t border-gray-100">
                                        {(() => {
                                            const rawUrl = (event.registerUrl ?? "").trim();
                                            if (!rawUrl) return null;
                                            const isTicket = event.registerButtonText?.toLowerCase().includes("ticket") || rawUrl.includes("ticket");
                                            const isInternal = rawUrl.startsWith("/");
                                            const targetUrl = isInternal ? rawUrl : formatUrl(rawUrl);
                                            const defaultText = isTicket ? "Find Your Ticket" : "Register for Event";
                                            const buttonText = event.registerButtonText?.trim() || defaultText;

                                            return isInternal ? (
                                                <Link
                                                    href={targetUrl}
                                                    className="w-full inline-flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl text-xs font-semibold hover:bg-gray-900 transition-colors shadow-sm"
                                                >
                                                    {buttonText} <ExternalLink size={14} />
                                                </Link>
                                            ) : (
                                                <a
                                                    href={targetUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full inline-flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl text-xs font-semibold hover:bg-gray-900 transition-colors shadow-sm"
                                                >
                                                    {buttonText} <ExternalLink size={14} />
                                                </a>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {footer && <Footer data={footer} contact={contact ?? undefined} />}
        </main>
    );
}
