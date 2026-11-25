"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Search, Calendar, MapPin, Play, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SchedulePage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [selectedDate, setSelectedDate] = useState("ALL");
    const [selectedStage, setSelectedStage] = useState("ALL");

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await fetch("/api/sahithyotsav/sessions");
                if (res.ok) {
                    const data = await res.json();
                    setSessions(data);
                }
            } catch (err) {
                console.error("Failed to load sessions:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, []);

    const categories = ["ALL", "Lower Primary", "Upper Primary", "High School", "Higher Secondary", "Junior", "Senior", "Campus", "General"];
    const statuses = ["ALL", "UPCOMING", "ONGOING", "COMPLETED"];

    const extractDate = (timeStr: string) => {
        if (!timeStr) return "TBD";
        const parts = timeStr.split(" - ");
        if (parts.length > 0) {
            return parts[0].trim();
        }
        return timeStr.trim();
    };

    const stages = ["ALL", ...Array.from(new Set(sessions.map((s) => s.stage).filter(Boolean)))];
    const dates = ["ALL", ...Array.from(new Set(sessions.map((s) => extractDate(s.time)).filter(Boolean)))];

    const filteredSessions = sessions.filter((s) => {
        const matchesSearch = s.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.stage.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "ALL" || s.category === selectedCategory;
        const matchesStatus = selectedStatus === "ALL" || s.status === selectedStatus;
        const matchesDate = selectedDate === "ALL" || extractDate(s.time) === selectedDate;
        const matchesStage = selectedStage === "ALL" || s.stage === selectedStage;
        return matchesSearch && matchesCategory && matchesStatus && matchesDate && matchesStage;
    });

    return (
        <main className="flex-1 pb-24 bg-slate-950">
            {/* Header Section */}
            <div className="pt-24 pb-12 bg-slate-950 text-white border-b border-slate-900 relative">
                <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="container mx-auto px-6 md:px-12">
                    <span className="inline-block tracking-[0.2em] text-[10px] font-bold text-emerald-400 uppercase mb-4">
                        Stages & Timings
                    </span>
                    <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight">
                        Program Schedule
                    </h1>
                    <p className="text-slate-400 text-sm mt-3 font-light max-w-xl">
                        Filter and search event sessions across various stages. Stay updated with real-time progress.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-6 md:px-12 py-12">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Filters Sidebar */}
                    <div className="w-full lg:w-64 space-y-8 bg-slate-900/30 border border-slate-900 rounded-2xl p-6 flex-shrink-0">
                        {/* Search */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search item or stage..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors text-white placeholder:text-slate-600"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Category filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Category</label>
                            <div className="flex flex-wrap lg:flex-col gap-1.5">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs font-medium text-left transition-colors whitespace-nowrap",
                                            selectedCategory === cat
                                                ? "bg-emerald-600 text-slate-950"
                                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                        )}
                                    >
                                        {cat === "ALL" ? "All Categories" : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Status</label>
                            <div className="flex flex-wrap lg:flex-col gap-1.5">
                                {statuses.map((stat) => (
                                    <button
                                        key={stat}
                                        onClick={() => setSelectedStatus(stat)}
                                        className={cn(
                                            "px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs font-medium text-left transition-colors whitespace-nowrap",
                                            selectedStatus === stat
                                                ? "bg-slate-800 text-white"
                                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                        )}
                                    >
                                        {stat === "ALL" ? "All Statuses" : stat.charAt(0) + stat.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Date / Day</label>
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            >
                                {dates.map((d) => (
                                    <option key={d} value={d} className="bg-slate-950">
                                        {d === "ALL" ? "All Dates" : d}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Stage filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Stage</label>
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            >
                                {stages.map((st) => (
                                    <option key={st} value={st} className="bg-slate-950">
                                        {st === "ALL" ? "All Stages" : st}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Schedule Cards Grid */}
                    <div className="flex-1 w-full">
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="animate-spin text-emerald-500" size={32} />
                            </div>
                        ) : filteredSessions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={cn(
                                            "border rounded-2xl p-6 transition-all relative overflow-hidden bg-slate-900/10",
                                            session.status === "ONGOING"
                                                ? "border-emerald-500/40 bg-emerald-950/5"
                                                : "border-slate-900 hover:border-slate-800"
                                        )}
                                    >
                                        {/* Corner Glow for Ongoing */}
                                        {session.status === "ONGOING" && (
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full blur-xl"></div>
                                        )}

                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="space-y-1">
                                                <span className="inline-block bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
                                                    {session.category}
                                                </span>
                                                <h3 className="text-lg font-display font-medium text-white pt-1.5">
                                                    {session.itemName}
                                                </h3>
                                            </div>

                                            {/* Status Badges */}
                                            {session.status === "COMPLETED" && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
                                                    <CheckCircle2 size={10} /> Completed
                                                </span>
                                            )}
                                            {session.status === "ONGOING" && (
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-800/30 px-2.5 py-1 rounded-full">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                    </span>
                                                    Ongoing
                                                </span>
                                            )}
                                            {session.status === "UPCOMING" && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/20 border border-blue-900/30 px-2.5 py-1 rounded-full">
                                                    <Clock size={10} /> Scheduled
                                                </span>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-900/60 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-400 text-xs font-light">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={12} className="text-emerald-500" />
                                                <span>{session.stage}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-emerald-500" />
                                                <span>{session.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-900/10 border border-slate-900 rounded-2xl">
                                <p className="text-slate-500 text-sm font-light italic">No matching scheduled events found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
