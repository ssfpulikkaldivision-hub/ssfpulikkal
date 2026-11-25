"use client";

import { useState, useEffect } from "react";
import { 
    Trophy, 
    Calendar, 
    Clock, 
    MapPin, 
    Search, 
    Award, 
    Download, 
    UserCheck, 
    Play, 
    CheckCircle2, 
    Sparkles 
} from "lucide-react";
import { cn, formatUrl } from "@/lib/utils";

interface Settings {
    title: string;
    subtitle: string;
    dates: string;
    venue: string;
    mapLink: string;
    brochureUrl: string;
    registerUrl: string;
    countdownDate: string;
}

interface Session {
    id: string;
    itemName: string;
    category: string;
    stage: string;
    time: string;
    status: string;
}

interface Result {
    id: string;
    itemName: string;
    category: string;
    winnerName: string;
    unitName: string;
    position: number;
    points: number;
}

interface PortalProps {
    settings: Settings;
    sessions: Session[];
    results: Result[];
}

export function LitFestPortal({ settings, sessions, results }: PortalProps) {
    const [activeTab, setActiveTab] = useState<"schedule" | "leaderboard" | "results">("schedule");
    const [scheduleFilter, setScheduleFilter] = useState("ALL");
    const [resultsSearch, setResultsSearch] = useState("");
    const [resultsFilter, setResultsFilter] = useState("ALL");
    
    // Countdown Timer logic
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    useEffect(() => {
        const target = new Date(settings.countdownDate).getTime();
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = target - now;

            if (difference < 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const d = Math.floor(difference / (1000 * 60 * 60 * 24));
            const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [settings.countdownDate]);

    // Categories list
    const categories = ["ALL", "LP", "UP", "HS", "HSS", "General", "Campus"];

    // Leaderboard calculation
    const unitPointsMap: { [key: string]: number } = {};
    results.forEach((res) => {
        const unit = res.unitName.trim();
        unitPointsMap[unit] = (unitPointsMap[unit] || 0) + res.points;
    });

    const leaderboard = Object.keys(unitPointsMap)
        .map((unit) => ({ unitName: unit, points: unitPointsMap[unit] }))
        .sort((a, b) => b.points - a.points);

    // Schedule grouping and filtering
    const filteredSessions = sessions.filter((s) => 
        scheduleFilter === "ALL" || s.category.toLowerCase().includes(scheduleFilter.toLowerCase())
    );

    const ongoingSessions = filteredSessions.filter((s) => s.status === "ONGOING");
    const upcomingSessions = filteredSessions.filter((s) => s.status === "UPCOMING");
    const completedSessions = filteredSessions.filter((s) => s.status === "COMPLETED");

    // Results filtering and searching
    const filteredResults = results.filter((r) => {
        const matchesCategory = resultsFilter === "ALL" || r.category.toLowerCase().includes(resultsFilter.toLowerCase());
        const matchesSearch = 
            r.itemName.toLowerCase().includes(resultsSearch.toLowerCase()) || 
            r.winnerName.toLowerCase().includes(resultsSearch.toLowerCase()) ||
            r.unitName.toLowerCase().includes(resultsSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-16">
            {/* Header info card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1.5 rounded-full">
                        <Sparkles size={12} /> Live Events & Standings
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-medium text-black leading-tight tracking-tight">
                        {settings.title}
                    </h2>
                    <p className="text-gray-500 font-light text-lg">
                        {settings.subtitle}
                    </p>

                    <div className="space-y-3 pt-4 border-t border-gray-50">
                        <div className="flex items-center text-gray-600 gap-3">
                            <Calendar size={18} className="text-black" />
                            <span className="text-sm font-medium">{settings.dates}</span>
                        </div>
                        <div className="flex items-center text-gray-600 gap-3">
                            <MapPin size={18} className="text-black" />
                            <span className="text-sm font-medium">{settings.venue}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4">
                        {settings.registerUrl && (
                            <a 
                                href={formatUrl(settings.registerUrl)} 
                                target="_blank" 
                                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
                            >
                                Register Now
                            </a>
                        )}
                        {settings.brochureUrl && (
                            <a 
                                href={formatUrl(settings.brochureUrl)} 
                                target="_blank" 
                                className="inline-flex items-center gap-2 bg-white border border-gray-200 text-black px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-black transition-all"
                            >
                                <Download size={16} /> Download Brochure
                            </a>
                        )}
                    </div>
                </div>

                {/* Countdown Timer */}
                <div className="bg-black text-white rounded-xl p-8 flex flex-col items-center justify-center space-y-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Countdown to festival</p>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="bg-white/5 p-4 rounded-lg min-w-[70px]">
                            <span className="text-3xl md:text-4xl font-display font-bold block">{timeLeft.days}</span>
                            <span className="text-[10px] uppercase tracking-wider text-white/40">Days</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg min-w-[70px]">
                            <span className="text-3xl md:text-4xl font-display font-bold block">{timeLeft.hours}</span>
                            <span className="text-[10px] uppercase tracking-wider text-white/40">Hours</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg min-w-[70px]">
                            <span className="text-3xl md:text-4xl font-display font-bold block">{timeLeft.minutes}</span>
                            <span className="text-[10px] uppercase tracking-wider text-white/40">Mins</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg min-w-[70px]">
                            <span className="text-3xl md:text-4xl font-display font-bold block">{timeLeft.seconds}</span>
                            <span className="text-[10px] uppercase tracking-wider text-white/40">Secs</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="space-y-8">
                <div className="flex gap-2 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab("schedule")}
                        className={cn(
                            "px-6 py-4 text-sm font-medium border-b-2 transition-all -mb-px flex items-center gap-2 cursor-pointer",
                            activeTab === "schedule" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                        )}
                    >
                        <Clock size={16} /> Schedule & Live
                    </button>
                    <button
                        onClick={() => setActiveTab("leaderboard")}
                        className={cn(
                            "px-6 py-4 text-sm font-medium border-b-2 transition-all -mb-px flex items-center gap-2 cursor-pointer",
                            activeTab === "leaderboard" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                        )}
                    >
                        <Trophy size={16} /> Unit Leaderboard
                    </button>
                    <button
                        onClick={() => setActiveTab("results")}
                        className={cn(
                            "px-6 py-4 text-sm font-medium border-b-2 transition-all -mb-px flex items-center gap-2 cursor-pointer",
                            activeTab === "results" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                        )}
                    >
                        <Award size={16} /> Winners & Results
                    </button>
                </div>

                {/* Tab Content - Schedule */}
                {activeTab === "schedule" && (
                    <div className="space-y-12">
                        {/* Category filter pills */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setScheduleFilter(cat)}
                                    className={cn(
                                        "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer",
                                        scheduleFilter === cat
                                            ? "bg-black border-black text-white"
                                            : "bg-white border-gray-100 text-gray-400 hover:text-black hover:border-black"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Ongoing items */}
                        {ongoingSessions.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-red-500">Live Ongoing Items</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {ongoingSessions.map((s) => (
                                        <div key={s.id} className="bg-red-50/50 border border-red-100 rounded-xl p-6 flex justify-between items-center relative overflow-hidden group">
                                            <div className="space-y-2">
                                                <span className="inline-block bg-red-100 text-red-700 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                                                    {s.category}
                                                </span>
                                                <h4 className="text-lg font-medium text-black">{s.itemName}</h4>
                                                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                                    <MapPin size={12} /> {s.stage}
                                                </p>
                                            </div>
                                            <div className="text-red-500 flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg shadow-sm border border-red-50">
                                                <Play size={12} className="fill-red-500" /> Ongoing
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Schedule List: Upcoming and Completed */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Upcoming Items */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Upcoming Sessions</h3>
                                <div className="space-y-3">
                                    {upcomingSessions.length > 0 ? (
                                        upcomingSessions.map((s) => (
                                            <div key={s.id} className="bg-white border border-gray-50 rounded-xl p-5 flex justify-between items-center hover:border-black transition-all">
                                                <div className="space-y-1">
                                                    <span className="inline-block bg-gray-50 text-gray-500 text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-gray-100">
                                                        {s.category}
                                                    </span>
                                                    <h4 className="font-medium text-black text-sm">{s.itemName}</h4>
                                                    <p className="text-[11px] text-gray-400">{s.stage}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-black flex items-center gap-1"><Clock size={12} /> {s.time}</p>
                                                    <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Scheduled</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-left text-gray-400 text-sm font-light italic py-4">No upcoming items scheduled in this category.</p>
                                    )}
                                </div>
                            </div>

                            {/* Completed Items */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Completed Sessions</h3>
                                <div className="space-y-3">
                                    {completedSessions.length > 0 ? (
                                        completedSessions.map((s) => (
                                            <div key={s.id} className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 flex justify-between items-center opacity-80">
                                                <div className="space-y-1">
                                                    <span className="inline-block bg-gray-100 text-gray-600 text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                                                        {s.category}
                                                    </span>
                                                    <h4 className="font-medium text-gray-500 text-sm line-through">{s.itemName}</h4>
                                                    <p className="text-[11px] text-gray-400">{s.stage}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded">
                                                        <CheckCircle2 size={10} /> Completed
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-left text-gray-400 text-sm font-light italic py-4">No completed items in this category yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content - Leaderboard */}
                {activeTab === "leaderboard" && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="text-center space-y-2">
                            <Trophy size={48} className="mx-auto text-amber-500" />
                            <h3 className="text-2xl font-display font-medium text-black">Unit Standings</h3>
                            <p className="text-gray-400 text-sm font-light">Overall point leaderboard across all sectors and units.</p>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            {leaderboard.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {leaderboard.map((item, index) => {
                                        let rankBadge = null;
                                        if (index === 0) rankBadge = <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">🥇 1st Place</span>;
                                        else if (index === 1) rankBadge = <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">🥈 2nd Place</span>;
                                        else if (index === 2) rankBadge = <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">🥉 3rd Place</span>;
                                        else rankBadge = <span className="text-xs font-bold text-gray-400">Rank #{index + 1}</span>;

                                        return (
                                            <div key={item.unitName} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center space-x-6">
                                                    <span className="w-8 h-8 rounded-full bg-black/5 text-black font-display font-bold text-sm flex items-center justify-center">
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold text-black text-base">{item.unitName}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">SSF Pulikkal Division</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    {rankBadge}
                                                    <span className="text-2xl font-display font-bold text-black">{item.points} <span className="text-xs text-gray-400 font-sans font-normal">pts</span></span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-20 text-center text-gray-400 font-light italic">
                                    No results updated yet. Leaderboard is empty.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab Content - Results */}
                {activeTab === "results" && (
                    <div className="space-y-8">
                        {/* Search and filters bar */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-300">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-300"
                                    placeholder="Search by item, winner, or unit name..."
                                    value={resultsSearch}
                                    onChange={(e) => setResultsSearch(e.target.value)}
                                />
                            </div>
                            <select
                                className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors text-black"
                                value={resultsFilter}
                                onChange={(e) => setResultsFilter(e.target.value)}
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>{c === "ALL" ? "All Categories" : c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Results list */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredResults.length > 0 ? (
                                filteredResults.map((r) => (
                                    <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-6 space-y-4 hover:border-black transition-all relative overflow-hidden group">
                                        <div className="flex justify-between items-start">
                                            <span className="bg-black/5 text-black text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-black/5">
                                                {r.category}
                                            </span>
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-100">
                                                +{r.points} Points
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-display font-medium text-black text-lg line-clamp-1">{r.itemName}</h4>
                                            <p className="text-xs text-gray-400">Position #{r.position}</p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                                            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold">
                                                {r.position}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-black">{r.winnerName}</p>
                                                <p className="text-xs text-gray-400">{r.unitName}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-20 text-gray-400 font-light italic">
                                    No winners or results found matching your search.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
