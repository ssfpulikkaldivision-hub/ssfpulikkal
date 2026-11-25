"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Search, Trophy, Medal, SearchCode, Sparkles, Loader2, ChevronDown, ChevronUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface Result {
    id: string;
    itemName: string;
    category: string;
    winnerName: string;
    unitName: string;
    position: number;
    points: number;
}

interface LeaderboardItem {
    unitName: string;
    points: number;
}

export default function ResultsPage() {
    const [results, setResults] = useState<Result[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
    const [campusLeaderboard, setCampusLeaderboard] = useState<LeaderboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await fetch("/api/sahithyotsav/results");
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);

                    // Compute leaderboard points separately for General vs Campus
                    const generalMap: Record<string, number> = {};
                    const campusMap: Record<string, number> = {};
                    
                    data.forEach((r: Result) => {
                        const pts = r.points || 0;
                        if (r.category === "Campus") {
                            campusMap[r.unitName] = (campusMap[r.unitName] || 0) + pts;
                        } else {
                            generalMap[r.unitName] = (generalMap[r.unitName] || 0) + pts;
                        }
                    });

                    const generalLeaderboardData = Object.entries(generalMap)
                        .map(([unitName, points]) => ({ unitName, points }))
                        .sort((a, b) => b.points - a.points);

                    const campusLeaderboardData = Object.entries(campusMap)
                        .map(([unitName, points]) => ({ unitName, points }))
                        .sort((a, b) => b.points - a.points);

                    setLeaderboard(generalLeaderboardData);
                    setCampusLeaderboard(campusLeaderboardData);
                }
            } catch (err) {
                console.error("Failed to load results:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, []);

    const categories = ["ALL", "Lower Primary", "Upper Primary", "High School", "Higher Secondary", "Junior", "Senior", "Campus", "General"];

    const filteredResults = results.filter((r) => {
        const matchesSearch = r.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.winnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.unitName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "ALL" || r.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const toggleGroup = (key: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // Grouping results by Item Name & Category
    const groupedMap: Record<string, {
        key: string;
        itemName: string;
        category: string;
        winners: {
            winnerName: string;
            unitName: string;
            position: number;
        }[];
    }> = {};

    filteredResults.forEach((r) => {
        const key = `${r.category}-${r.itemName}`;
        if (!groupedMap[key]) {
            groupedMap[key] = {
                key,
                itemName: r.itemName,
                category: r.category,
                winners: [],
            };
        }
        groupedMap[key].winners.push({
            winnerName: r.winnerName,
            unitName: r.unitName,
            position: r.position,
        });
    });

    // Sort winners inside each group (1st, 2nd, 3rd)
    Object.values(groupedMap).forEach((group) => {
        group.winners.sort((a, b) => a.position - b.position);
    });

    const groupedList = Object.values(groupedMap);

    const getPositionBadge = (pos: number) => {
        if (pos === 1) {
            return (
                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Trophy size={10} /> 1st Place
                </span>
            );
        }
        if (pos === 2) {
            return (
                <span className="inline-flex items-center gap-1 bg-slate-300/10 text-slate-300 border border-slate-300/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Medal size={10} /> 2nd Place
                </span>
            );
        }
        if (pos === 3) {
            return (
                <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Medal size={10} /> 3rd Place
                </span>
            );
        }
        return (
            <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full text-xs">
                {pos}th Place
            </span>
        );
    };

    const maxLeaderboardPoints = leaderboard.length > 0 ? leaderboard[0].points : 1;
    const maxCampusPoints = campusLeaderboard.length > 0 ? campusLeaderboard[0].points : 1;

    return (
        <main className="flex-1 pb-24 bg-slate-950">
            {/* Header Section */}
            <div className="pt-24 pb-12 bg-slate-950 text-white border-b border-slate-900 relative">
                <div className="absolute top-0 left-1/3 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="container mx-auto px-6 md:px-12">
                    <span className="inline-flex items-center gap-1.5 tracking-[0.2em] text-[10px] font-bold text-emerald-400 uppercase mb-4">
                        <Sparkles size={10} /> Live Standings
                    </span>
                    <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight">
                        Scores & Results
                    </h1>
                    <p className="text-slate-400 text-sm mt-3 font-light max-w-xl">
                        Monitor the overall sector leaderboard and search item-wise winners. Updates in real-time as judges post results.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-6 md:px-12 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Leaderboard Card (lg:col-span-5) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Sector Standings */}
                        <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                            
                            <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                                <Trophy size={18} className="text-amber-500" /> Sector Standings
                            </h2>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="animate-spin text-emerald-500" size={24} />
                                </div>
                            ) : leaderboard.length > 0 ? (
                                <div className="space-y-6">
                                    {leaderboard.map((item, index) => {
                                        const percentage = (item.points / maxLeaderboardPoints) * 100;
                                        return (
                                            <div key={item.unitName} className="space-y-2">
                                                <div className="flex justify-between items-end text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn(
                                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border",
                                                            index === 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                                                            index === 1 ? "bg-slate-300/10 text-slate-300 border-slate-300/30" :
                                                            index === 2 ? "bg-orange-500/10 text-orange-400 border-orange-500/30" :
                                                            "bg-slate-900 text-slate-500 border-slate-800"
                                                        )}>
                                                            {index + 1}
                                                        </span>
                                                        <span className="font-medium text-white">{item.unitName}</span>
                                                    </div>
                                                    <span className="font-bold text-emerald-400">{item.points} pts</span>
                                                </div>
                                                {/* Bar */}
                                                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-900">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-slate-500 text-sm font-light italic">
                                    No points registered yet. Results will appear once completed.
                                </div>
                            )}
                        </div>

                        {/* Campus Standings */}
                        <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                            
                            <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                                <Award size={18} className="text-emerald-500" /> Campus Standings
                            </h2>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="animate-spin text-emerald-500" size={24} />
                                </div>
                            ) : campusLeaderboard.length > 0 ? (
                                <div className="space-y-6">
                                    {campusLeaderboard.map((item, index) => {
                                        const percentage = (item.points / maxCampusPoints) * 100;
                                        return (
                                            <div key={item.unitName} className="space-y-2">
                                                <div className="flex justify-between items-end text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn(
                                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border",
                                                            index === 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                                                            index === 1 ? "bg-slate-300/10 text-slate-300 border-slate-300/30" :
                                                            index === 2 ? "bg-orange-500/10 text-orange-400 border-orange-500/30" :
                                                            "bg-slate-900 text-slate-500 border-slate-800"
                                                        )}>
                                                            {index + 1}
                                                        </span>
                                                        <span className="font-medium text-white">{item.unitName}</span>
                                                    </div>
                                                    <span className="font-bold text-emerald-400">{item.points} pts</span>
                                                </div>
                                                {/* Bar */}
                                                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-900">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-slate-500 text-sm font-light italic">
                                    No campus points registered yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Item Results Table (lg:col-span-7) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Filters & Search */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/20 border border-slate-900 rounded-2xl p-4">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search item, winner, unit..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors text-white placeholder:text-slate-600"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-1 overflow-x-auto w-full sm:w-auto">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                                            selectedCategory === cat
                                                ? "bg-emerald-600 text-slate-950"
                                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Results list */}
                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-24 bg-slate-900/10 border border-slate-900 rounded-3xl">
                                    <Loader2 className="animate-spin text-emerald-500" size={28} />
                                </div>
                            ) : groupedList.length > 0 ? (
                                groupedList.map((group) => {
                                    const isOpen = !!expandedGroups[group.key];
                                    return (
                                        <div
                                            key={group.key}
                                            className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden hover:border-slate-800 transition-all"
                                        >
                                            {/* Accordion Trigger Header */}
                                            <button
                                                onClick={() => toggleGroup(group.key)}
                                                className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-900/30 transition-colors"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-slate-800 text-slate-400 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border border-slate-700 uppercase">
                                                            {group.category}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base font-semibold text-white pt-1">
                                                        {group.itemName}
                                                    </h3>
                                                </div>
                                                <div className="text-slate-400 p-1">
                                                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                            </button>

                                            {/* Accordion Content Body */}
                                            {isOpen && (
                                                <div className="border-t border-slate-900/60 bg-slate-950/40 p-5 divide-y divide-slate-900/40">
                                                    {group.winners.map((w, idx) => (
                                                        <div key={idx} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div className="flex items-center gap-3">
                                                                {getPositionBadge(w.position)}
                                                                <span className="font-medium text-white text-sm">{w.winnerName}</span>
                                                            </div>
                                                            <span className="text-xs text-slate-500">
                                                                Sector: <span className="text-slate-300 font-semibold">{w.unitName}</span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-20 text-slate-500 text-sm font-light italic bg-slate-900/10 border border-slate-900 rounded-3xl">
                                    No results found matching your search.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
