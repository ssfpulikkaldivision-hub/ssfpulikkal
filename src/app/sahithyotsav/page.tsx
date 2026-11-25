import Link from "next/link";
import prisma from "@/lib/prisma";
import { Countdown } from "@/components/Countdown";
import { Calendar, MapPin, Award, BookOpen, Download, Users, FileText, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SahithyotsavHome() {
    let settings = null;
    let sessions: any[] = [];
    let results: any[] = [];

    try {
        settings = await prisma.litFestSettings.findUnique({
            where: { id: "litfest-settings" },
        });
        sessions = await prisma.litFestSession.findMany();
        results = await prisma.litFestResult.findMany();
    } catch (err) {
        console.warn("Could not load Sahithyotsav home data:", err);
    }

    const title = settings?.title || "Pulikkal Division Sahithyotsav 2026";
    const subtitle = settings?.subtitle || "The Ultimate Cultural & Literary Festival";
    const dates = settings?.dates || "August 28, 29, 30";
    const venue = settings?.venue || "Cherukavu, Pulikkal";
    const mapLink = settings?.mapLink || "";
    const registerUrl = settings?.registerUrl || "";
    const brochureUrl = settings?.brochureUrl || "";
    const countdownDateStr = settings?.countdownDate
        ? new Date(settings.countdownDate).toISOString()
        : new Date().toISOString();

    // Stats
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === "COMPLETED").length;
    const ongoingSessions = sessions.filter(s => s.status === "ONGOING").length;
    
    // Unique sectors/units participating
    const distinctUnits = Array.from(new Set(results.map(r => r.unitName)));
    const unitCount = distinctUnits.length || 6; // fallback to 6 sectors/units

    return (
        <main className="flex-1 pb-24 relative overflow-hidden bg-slate-950">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Hero Section */}
            <section className="pt-20 pb-16 md:py-32 relative z-10">
                <div className="container mx-auto px-6 md:px-12 text-center">
                    <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
                        <Award size={12} /> Literary Festival 2026
                    </span>

                    <h1 className="text-5xl md:text-8xl font-display font-medium text-white tracking-tight leading-tight max-w-4xl mx-auto">
                        {title}
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 font-light mt-6 max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>

                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-12 text-slate-300">
                        <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-900 rounded-xl px-5 py-2.5">
                            <Calendar className="text-emerald-500" size={18} />
                            <span className="text-sm font-medium">{dates}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-900 rounded-xl px-5 py-2.5">
                            <MapPin className="text-emerald-500" size={18} />
                            <span className="text-sm font-medium">{venue}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Countdown Section */}
            <section className="pb-16 relative z-10">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Festival Starts In</p>
                    <Countdown targetDate={countdownDateStr} />
                </div>
            </section>

            {/* Stats / Metric Dashboard Grid */}
            <section className="py-12 relative z-10">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 flex items-center justify-between group hover:border-slate-800 transition-colors">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Items</p>
                                <p className="text-4xl font-display font-bold text-white">{totalSessions || "40+"}</p>
                            </div>
                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-500 border border-slate-800">
                                <BookOpen size={20} />
                            </div>
                        </div>

                        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 flex items-center justify-between group hover:border-slate-800 transition-colors">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Sectors / Units</p>
                                <p className="text-4xl font-display font-bold text-white">{unitCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-500 border border-slate-800">
                                <Users size={20} />
                            </div>
                        </div>

                        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 flex items-center justify-between group hover:border-slate-800 transition-colors">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Ongoing Sessions</p>
                                <p className="text-4xl font-display font-bold text-emerald-500">{ongoingSessions}</p>
                            </div>
                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-500 border border-slate-800">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 flex items-center justify-between group hover:border-slate-800 transition-colors">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Items Completed</p>
                                <p className="text-4xl font-display font-bold text-white">{completedSessions}</p>
                            </div>
                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-500 border border-slate-800">
                                <Award size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Portal Access Section */}
            <section className="py-12 relative z-10">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Schedule Access */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/20 border border-slate-900 rounded-3xl p-8 flex flex-col justify-between group hover:border-emerald-500/20 transition-all">
                            <div>
                                <h3 className="text-2xl font-display font-bold text-white mb-2">Programs & Schedules</h3>
                                <p className="text-slate-400 text-sm font-light leading-relaxed">
                                    Browse the complete schedule of cultural items across different stages and categories. Filter events by Stage, LP, UP, HS, HSS, Campus, and General categories.
                                </p>
                            </div>
                            <div className="mt-8 flex items-center justify-between">
                                <Link
                                    href="/sahithyotsav/schedule"
                                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
                                >
                                    View Schedule <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>

                        {/* Results Access */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/20 border border-slate-900 rounded-3xl p-8 flex flex-col justify-between group hover:border-emerald-500/20 transition-all">
                            <div>
                                <h3 className="text-2xl font-display font-bold text-white mb-2">Live Scores & Results</h3>
                                <p className="text-slate-400 text-sm font-light leading-relaxed">
                                    Check live sector points leaderboard and track individual event winners in real time. Keep up with the ranking of your favorite sector teams!
                                </p>
                            </div>
                            <div className="mt-8 flex items-center justify-between">
                                <Link
                                    href="/sahithyotsav/results"
                                    className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all"
                                >
                                    Check Leaderboard <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Brochure & Registration Section */}
            <section className="py-16 relative z-10 border-t border-slate-900 bg-slate-950/40">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-6 space-y-6">
                            <h2 className="text-3xl md:text-5xl font-display font-medium text-white tracking-tight">
                                Official Festival Brochure
                            </h2>
                            <p className="text-slate-400 text-sm md:text-base font-light leading-relaxed">
                                Download the official festival brochure to access the general guidelines, item regulations, stage schedules, and organizational details of Pulikkal Division Sahithyotsav 2026.
                            </p>
                            
                            {brochureUrl ? (
                                <div className="flex flex-wrap gap-4 pt-2">
                                    <a
                                        href={brochureUrl}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-6 py-3 rounded-full text-sm font-medium transition-colors"
                                    >
                                        <Download size={16} /> Download Brochure PDF
                                    </a>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-900/30 border border-slate-900/50 rounded-2xl flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Brochure Coming Soon</p>
                                        <p className="text-xs text-slate-400 mt-1">The official brochure will be published here shortly. Stay tuned!</p>
                                    </div>
                                </div>
                            )}

                            {registerUrl && (
                                <div className="border-t border-slate-900 pt-6">
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Registration</p>
                                    <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-white">Online Registration Active</p>
                                            <p className="text-xs text-slate-400 mt-1">Register participants for Sahithyotsav 2026.</p>
                                        </div>
                                        <a
                                            href={registerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors w-full sm:w-auto text-center"
                                        >
                                            Register Now
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Interactive Visual Element */}
                        <div className="lg:col-span-6 flex justify-center">
                            <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl bg-slate-900/30 border border-slate-900/50 p-8 flex flex-col justify-between overflow-hidden shadow-2xl group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-emerald-500">
                                        <Award size={22} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-900/30">
                                        SSF Sahithyotsav
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Pulikkal Division</p>
                                    <h4 className="text-2xl md:text-3xl font-display font-medium text-white tracking-tight leading-tight">
                                        Upholding spiritual and cultural values.
                                    </h4>
                                    <p className="text-slate-400 text-xs font-light">
                                        Discover and nurture the artistic talent of students, shaping a generation of moral excellence.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Venue & Location Section */}
            <section className="py-16 relative z-10 border-t border-slate-900">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-5 space-y-6">
                            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Location Details</p>
                            <h2 className="text-3xl md:text-4xl font-display font-medium text-white tracking-tight">
                                Festival Venue
                            </h2>
                            <p className="text-slate-400 text-sm font-light leading-relaxed">
                                Join us at the designated venue for Pulikkal Division Sahithyotsav 2026. Explore the beautiful cultural presentations and sessions. Check out the coordinates below.
                            </p>

                            <div className="space-y-4 text-slate-300">
                                <div className="flex gap-4">
                                    <MapPin className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-sm font-medium text-white">Address</p>
                                        <p className="text-xs text-slate-400 mt-1">{venue}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Google Map */}
                        <div className="lg:col-span-7">
                            {mapLink ? (
                                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-900 bg-slate-900/20 shadow-xl">
                                    <iframe
                                        src={mapLink}
                                        className="w-full h-full border-0 filter grayscale invert contrast-125 opacity-70 hover:opacity-90 transition-opacity"
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                </div>
                            ) : (
                                <div className="aspect-video w-full rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 flex flex-col items-center justify-center text-slate-500 gap-2">
                                    <MapPin size={28} />
                                    <p className="text-xs">Location Map not configured</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
