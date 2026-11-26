import Link from "next/link";
import { Calendar, MapPin, ArrowRight, Clock } from "lucide-react";

interface Event {
    id: string;
    title: string;
    slug?: string;
    description: string;
    date: string;
    time?: string;
    venue: string;
    category: string;
}

interface UpcomingEventsProps {
    events: Event[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
    return (
        <section className="py-24 bg-black text-white relative overflow-hidden">
            {/* Ambient background blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 md:px-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                    {/* Left Column: Heading & Link */}
                    <div className="space-y-6">
                        <span className="inline-block tracking-[0.2em] text-[10px] font-bold text-white/40 uppercase">
                            Schedule & Programs
                        </span>
                        <h2 className="text-3xl font-display font-medium leading-tight tracking-tight">
                            Upcoming Events
                        </h2>
                        <div className="pt-2">
                            <Link href="/events" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-white/70 transition-colors group">
                                View Events Calendar <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Right Columns: Upcoming Events Cards */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {events.length > 0 ? (
                            events.slice(0, 3).map((e) => (
                                <Link
                                    key={e.id}
                                    href={`/events/${e.slug || e.id}`}
                                    className="bg-white/5 border border-white/10 hover:border-white/30 transition-all rounded-xl p-6 flex flex-col justify-between h-[220px] group"
                                >
                                    <div className="space-y-2">
                                        <span className="inline-block bg-white/10 text-white/80 text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                                            {e.category}
                                        </span>
                                        <h4 className="font-semibold text-white text-base line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
                                            {e.title}
                                        </h4>
                                    </div>
                                    <div className="space-y-1.5 pt-4 border-t border-white/5">
                                        <p className="text-[11px] text-white/50 flex items-center gap-1.5"><Calendar size={12} /> {e.date}</p>
                                        <p className="text-[11px] text-white/50 flex items-center gap-1.5"><Clock size={12} /> {e.time || "Scheduled"}</p>
                                        <p className="text-[11px] text-white/50 flex items-center gap-1.5"><MapPin size={12} /> {e.venue}</p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full bg-white/5 border border-white/10 rounded-xl p-8 text-center italic text-white/40 text-sm font-light">
                                No upcoming events scheduled yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
