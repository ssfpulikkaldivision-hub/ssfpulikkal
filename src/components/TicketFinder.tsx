"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
    Search,
    Ticket,
    Calendar,
    Clock,
    MapPin,
    CheckCircle2,
    Share2,
    Printer,
    Download,
    ArrowLeft,
    Phone,
    User,
    Building2,
    ShieldCheck,
    Loader2,
    AlertCircle,
    RotateCcw,
    Sparkles,
} from "lucide-react";
import { formatMobile } from "@/lib/councillor-utils";

interface DelegateTicket {
    id: string;
    ticketNumber: string;
    name: string;
    mobile: string;
    sector: string;
    unit: string;
    designation?: string | null;
    isAdmitted: boolean;
    admittedAt?: string | null;
    qrCode: string;
    event: {
        title: string;
        date: string;
        time: string;
        venue: string;
        image?: string;
    };
}

export function TicketFinder() {
    const searchParams = useSearchParams();
    const [mobile, setMobile] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [delegates, setDelegates] = useState<DelegateTicket[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);
    const ticketRef = useRef<HTMLDivElement | null>(null);

    // If query string has ?mobile= or ?ticket=, auto search
    useEffect(() => {
        const queryMobile = searchParams.get("mobile");
        const queryTicket = searchParams.get("ticket") || searchParams.get("code");
        if (queryMobile) {
            setMobile(queryMobile);
            performLookup({ mobile: queryMobile });
        } else if (queryTicket) {
            performLookup({ ticket: queryTicket });
        }
    }, [searchParams]);

    const performLookup = async (params: { mobile?: string; ticket?: string }) => {
        setLoading(true);
        setError(null);
        setHasSearched(true);
        try {
            const query = new URLSearchParams();
            if (params.mobile) query.set("mobile", params.mobile);
            if (params.ticket) query.set("ticket", params.ticket);

            const res = await fetch(`/api/tickets/lookup?${query.toString()}`);
            const data = await res.json();

            if (res.ok && data.found && data.delegates?.length > 0) {
                setDelegates(data.delegates);
                setSelectedIdx(0);
            } else {
                setDelegates([]);
                setError(
                    data.message ||
                        "No delegate ticket found for this mobile number. Please check if you entered the registered 10-digit number."
                );
            }
        } catch (err: any) {
            setError(err.message || "Failed to search ticket. Please try again.");
            setDelegates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const cleaned = mobile.trim();
        if (!cleaned) {
            setError("Please enter your 10-digit mobile number");
            return;
        }
        performLookup({ mobile: cleaned });
    };

    const currentTicket = delegates[selectedIdx] || null;

    // Handle Print
    const handlePrint = () => {
        window.print();
    };

    // Handle WhatsApp Share
    const handleWhatsAppShare = () => {
        if (!currentTicket) return;
        const text = `*SSF Pulikkal Division Students' Council 2026 - Delegate Pass*\n\n` +
            `*Name:* ${currentTicket.name}\n` +
            `*Sector:* ${currentTicket.sector}\n` +
            `*Unit:* ${currentTicket.unit}\n` +
            `*Ticket No:* ${currentTicket.ticketNumber}\n` +
            `*Date:* ${currentTicket.event.date}\n` +
            `*Venue:* ${currentTicket.event.venue}\n\n` +
            `View Pass: ${window.location.origin}/tickets?ticket=${currentTicket.ticketNumber}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
            {/* Header Section */}
            <div className="text-center space-y-3 mb-8 sm:mb-12 print:hidden">
                <div className="inline-flex items-center gap-2 bg-black/5 text-black px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
                    <Sparkles size={13} className="text-amber-500" /> Official Ticket Portal
                </div>
                <h1 className="text-3xl sm:text-5xl font-display font-medium text-black tracking-tight">
                    Find Your Council Ticket
                </h1>
                <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto leading-relaxed">
                    Enter your registered 10-digit mobile number to view and download your official Students' Council 2026 Delegate Pass.
                </p>
            </div>

            {/* Mobile Number Search Form */}
            <div className="max-w-md mx-auto mb-10 print:hidden">
                <form
                    onSubmit={handleSearch}
                    className="bg-white border border-gray-200/80 rounded-2xl p-2.5 sm:p-3 shadow-md hover:shadow-lg transition-shadow"
                >
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm font-semibold">
                                +91
                            </span>
                            <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="Enter 10-digit mobile number"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-transparent text-black text-sm font-mono placeholder:text-gray-400 focus:outline-none"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !mobile.trim()}
                            className="bg-black text-white hover:bg-gray-800 disabled:opacity-50 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm"
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Search size={16} />
                            )}
                            Find Ticket
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-50/80 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                        <div>
                            <p className="font-semibold text-sm">Ticket Not Found</p>
                            <p className="mt-0.5 leading-relaxed text-red-600">{error}</p>
                            <p className="mt-2 text-[11px] text-gray-500">
                                If you need assistance, please contact the council registration helpline.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Multiple Tickets Selector (if 1 mobile has multiple councillors) */}
            {delegates.length > 1 && (
                <div className="mb-6 max-w-md mx-auto print:hidden">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 text-center">
                        Multiple Passes Found ({delegates.length})
                    </p>
                    <div className="flex gap-2 justify-center">
                        {delegates.map((d, i) => (
                            <button
                                key={d.id}
                                onClick={() => setSelectedIdx(i)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                                    selectedIdx === i
                                        ? "bg-black text-white border-black shadow-sm"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-black"
                                }`}
                            >
                                {d.name} ({d.ticketNumber})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* THE TICKET PASS CARD */}
            {currentTicket && (
                <div className="space-y-6">
                    {/* Visual Card */}
                    <div
                        ref={ticketRef}
                        className="max-w-md mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 transition-all text-black relative"
                    >
                        {/* Ticket Pass Top Ribbon */}
                        <div className="bg-black text-white p-6 relative overflow-hidden">
                            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-white text-black font-black text-[10px] rounded flex items-center justify-center ssf-font">
                                            SSF
                                        </div>
                                        <span className="text-[11px] font-bold tracking-[0.2em] text-white/80 uppercase">
                                            Pulikkal Division
                                        </span>
                                    </div>
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                                        Delegate Pass
                                    </span>
                                </div>

                                <h2 className="text-2xl font-display font-medium text-white tracking-tight">
                                    {currentTicket.event.title}
                                </h2>
                                <p className="text-xs text-white/60 font-medium mt-1">
                                    Official Students' Council 2026 Entry Ticket
                                </p>
                            </div>
                        </div>

                        {/* Middle Section: QR Code & Verification */}
                        <div className="p-6 text-center space-y-6">
                            {/* QR Code Container */}
                            <div className="relative inline-block">
                                <div className="p-3 bg-white border border-gray-200 rounded-3xl shadow-inner inline-block">
                                    <img
                                        src={currentTicket.qrCode}
                                        alt={`QR Code for ${currentTicket.ticketNumber}`}
                                        className="w-48 h-48 sm:w-52 sm:h-52 mx-auto object-contain"
                                    />
                                </div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-2">
                                    Scan at Entrance for Admission
                                </p>
                            </div>

                            {/* Ticket Number */}
                            <div className="bg-gray-50 border border-gray-100 py-2.5 px-4 rounded-xl inline-block">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block">
                                    Ticket Number
                                </span>
                                <span className="text-base font-mono font-bold text-black tracking-wider">
                                    {currentTicket.ticketNumber}
                                </span>
                            </div>

                            {/* Delegate Name & Role */}
                            <div className="border-t border-b border-gray-100 py-4 space-y-1">
                                <h3 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                                    {currentTicket.name}
                                </h3>
                                {currentTicket.designation && (
                                    <p className="text-xs text-gray-500 font-medium">
                                        {currentTicket.designation}
                                    </p>
                                )}
                                <p className="text-xs font-mono text-gray-400">
                                    {formatMobile(currentTicket.mobile)}
                                </p>
                            </div>

                            {/* Sector & Unit Grid */}
                            <div className="grid grid-cols-2 gap-3 text-left">
                                <div className="bg-gray-50/80 border border-gray-100 p-3.5 rounded-2xl">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                                        Sector
                                    </span>
                                    <span className="text-sm font-bold text-black">
                                        {currentTicket.sector}
                                    </span>
                                </div>
                                <div className="bg-gray-50/80 border border-gray-100 p-3.5 rounded-2xl">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                                        Unit
                                    </span>
                                    <span className="text-sm font-bold text-black">
                                        {currentTicket.unit}
                                    </span>
                                </div>
                            </div>

                            {/* Event Schedule Info */}
                            <div className="bg-black text-white p-4 rounded-2xl text-left space-y-2 text-xs">
                                <div className="flex items-center gap-2.5">
                                    <Calendar size={14} className="text-gray-400 shrink-0" />
                                    <span className="font-medium">{currentTicket.event.date}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Clock size={14} className="text-gray-400 shrink-0" />
                                    <span className="font-medium">{currentTicket.event.time}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <MapPin size={14} className="text-gray-400 shrink-0" />
                                    <span className="font-medium">{currentTicket.event.venue}</span>
                                </div>
                            </div>

                            {/* Admission Status Badge */}
                            <div>
                                {currentTicket.isAdmitted ? (
                                    <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2 rounded-full">
                                        <CheckCircle2 size={15} className="text-emerald-600" />
                                        <span>ADMITTED AT ENTRANCE</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 rounded-full">
                                        <ShieldCheck size={15} className="text-gray-500" />
                                        <span>CONFIRMED DELEGATE PASS</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card Footer Bar */}
                        <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 text-center">
                            <p className="text-[10px] text-gray-400 font-medium">
                                Please show this pass at the registration desk for instant entry.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="max-w-md mx-auto flex flex-wrap gap-2.5 justify-center print:hidden">
                        <button
                            onClick={handlePrint}
                            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 bg-black text-white py-3 px-4 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                        >
                            <Printer size={15} /> Print / Save PDF
                        </button>

                        <button
                            onClick={handleWhatsAppShare}
                            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 px-4 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            <Share2 size={15} /> WhatsApp Share
                        </button>

                        <button
                            onClick={() => {
                                setDelegates([]);
                                setMobile("");
                                setHasSearched(false);
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                        >
                            <RotateCcw size={14} /> Search Another Mobile Number
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
