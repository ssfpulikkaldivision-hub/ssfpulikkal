"use client";

import { useState } from "react";
import { Calendar, MapPin, Clock, Search, ExternalLink, Sparkles, ArrowRight } from "lucide-react";
import { cn, formatUrl } from "@/lib/utils";
import Link from "next/link";

interface Event {
    id: string;
    title: string;
    slug?: string;
    description: string;
    date: string;
    time?: string;
    venue: string;
    image?: string;
    category: string;
    status: string;
    registerUrl?: string;
    registerButtonText?: string;
}

interface EventsPortalProps {
    events: Event[];
}

export function EventsPortal({ events }: EventsPortalProps) {
    const [statusFilter, setStatusFilter] = useState<"UPCOMING" | "COMPLETED">("UPCOMING");
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");

    // Extract unique categories
    const categories = ["ALL", ...Array.from(new Set(events.map((e) => e.category)))];

    // Filter logic
    const filteredEvents = events.filter((e) => {
        const matchesStatus = e.status === statusFilter;
        const matchesCategory = categoryFilter === "ALL" || e.category === categoryFilter;
        const matchesSearch = 
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.venue.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-12">
            {/* Header info */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1.5 rounded-full">
                    <Sparkles size={12} /> Pulikkal Division Events
                </div>
                <h2 className="text-4xl font-display font-medium text-black tracking-tight">
                    Events Calendar
                </h2>
                <p className="text-gray-500 font-light text-base leading-relaxed">
                    Keep up to date with meetings, seminars, campaigns, and cultural events happening under SSF Pulikkal Division.
                </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
                {/* Status Toggle (Upcoming vs Completed) */}
                <div className="flex gap-2 border-b border-gray-100 pb-4">
                    <button
                        onClick={() => setStatusFilter("UPCOMING")}
                        className={cn(
                            "px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px flex items-center gap-2 cursor-pointer",
                            statusFilter === "UPCOMING" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                        )}
                    >
                        Upcoming Events
                    </button>
                    <button
                        onClick={() => setStatusFilter("COMPLETED")}
                        className={cn(
                            "px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px flex items-center gap-2 cursor-pointer",
                            statusFilter === "COMPLETED" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                        )}
                    >
                        Past Events
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-300">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-300 text-black"
                            placeholder="Search events by title, description or venue..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Category Dropdown */}
                    <select
                        className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors text-black min-w-[160px]"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c === "ALL" ? "All Categories" : c}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                        <div 
                            key={event.id} 
                            className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-black transition-all group"
                        >
                            {/* Card Media Header */}
                            <div className="h-48 bg-gradient-to-br from-gray-900 to-black relative flex items-center justify-center p-6 text-center overflow-hidden">
                                {event.image ? (
                                    <img 
                                        src={event.image} 
                                        alt={event.title} 
                                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#333,#111)]" />
                                )}
                                <div className="relative z-10 space-y-2">
                                    <span className="inline-block bg-white/10 backdrop-blur-md text-white text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded">
                                        {event.category}
                                    </span>
                                    <h3 className="text-white font-display font-medium text-lg leading-snug line-clamp-2 px-4">
                                        <Link href={`/events/${event.slug || event.id}`} className="hover:underline">
                                            {event.title}
                                        </Link>
                                    </h3>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                                <p className="text-gray-500 font-light text-sm line-clamp-3">
                                    {event.description}
                                </p>

                                <div className="space-y-3 pt-4 border-t border-gray-50 text-xs">
                                    <div className="flex items-center text-gray-600 gap-2">
                                        <Calendar size={14} className="text-black" />
                                        <span>{event.date}</span>
                                    </div>
                                    {event.time && (
                                        <div className="flex items-center text-gray-600 gap-2">
                                            <Clock size={14} className="text-black" />
                                            <span>{event.time}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center text-gray-600 gap-2">
                                        <MapPin size={14} className="text-black" />
                                        <span className="line-clamp-1">{event.venue}</span>
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center gap-2">
                                    {statusFilter === "UPCOMING" && Boolean(event.registerUrl && event.registerUrl.trim()) && (() => {
                                        const rawUrl = (event.registerUrl ?? "").trim();
                                        if (!rawUrl) return null;
                                        const isInternal = rawUrl.startsWith("/");
                                        const targetUrl = isInternal ? rawUrl : formatUrl(rawUrl);
                                        const btnText = event.registerButtonText?.trim() || "Register";

                                        return isInternal ? (
                                            <Link
                                                href={targetUrl}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-black text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-900 transition-colors"
                                            >
                                                {btnText} <ExternalLink size={12} />
                                            </Link>
                                        ) : (
                                            <a
                                                href={targetUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-black text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-900 transition-colors"
                                            >
                                                {btnText} <ExternalLink size={12} />
                                            </a>
                                        );
                                    })()}
                                    <Link
                                        href={`/events/${event.slug || event.id}`}
                                        className={cn(
                                            "inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:text-black hover:border-black transition-colors",
                                            (!event.registerUrl || !event.registerUrl.trim() || statusFilter !== "UPCOMING") && "w-full"
                                        )}
                                    >
                                        Details <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full bg-white border border-gray-100 rounded-xl py-20 text-center text-gray-400 italic font-light">
                        No events found matching your filter criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
