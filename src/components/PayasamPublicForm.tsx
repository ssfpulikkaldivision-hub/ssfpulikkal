"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
    CheckCircle2,
    AlertCircle,
    Loader2,
    User,
    Phone,
    Building2,
    Layers,
    Droplets,
    Copy,
    Check,
    MessageCircle,
    PlusCircle,
    CreditCard,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    buildWhatsAppShareUrl,
    calculatePayasamAmount,
    formatLiters,
    formatRupees,
    isEnglishName,
    isTenDigitMobile,
    PAYASAM_PRICE_PER_LITER,
    sanitizeEnglishNameInput,
    sanitizeMobileInput,
} from "@/lib/payasam";

interface UnitOption {
    id: string;
    name: string;
    code: string | null;
}

interface SectorOption {
    id: string;
    name: string;
    code: string | null;
    units: UnitOption[];
}

interface SubmittedOrder {
    id: string;
    personName: string;
    mobile: string;
    liters: number;
    paymentStatus: string;
    sectorName: string;
    unitName: string;
}

const LITER_PRESETS = [1, 2, 3, 5];

export function PayasamPublicForm() {
    const searchParams = useSearchParams();
    const [sectors, setSectors] = useState<SectorOption[]>([]);
    const [loading, setLoading] = useState(true);

    const [sectorId, setSectorId] = useState("");
    const [unitId, setUnitId] = useState("");
    const [personName, setPersonName] = useState("");
    const [mobile, setMobile] = useState("");
    const [liters, setLiters] = useState("1");
    const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING">("PENDING");
    const [notes, setNotes] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrder | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchInitialData = async () => {
        try {
            const res = await fetch("/api/payasam/public");
            if (res.ok) {
                const data = await res.json();
                const loadedSectors: SectorOption[] = data.sectors || [];
                setSectors(loadedSectors);

                const qSector = searchParams.get("sectorId");
                const qUnit = searchParams.get("unitId");
                if (qSector && loadedSectors.some((s) => s.id === qSector)) {
                    setSectorId(qSector);
                    const matchedSector = loadedSectors.find((s) => s.id === qSector);
                    if (qUnit && matchedSector?.units.some((u) => u.id === qUnit)) {
                        setUnitId(qUnit);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load Payasam Challenge options:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedSector = useMemo(
        () => sectors.find((s) => s.id === sectorId) || null,
        [sectors, sectorId]
    );

    const availableUnits = useMemo(
        () => selectedSector?.units || [],
        [selectedSector]
    );

    const handleSectorChange = (newSectorId: string) => {
        setSectorId(newSectorId);
        setUnitId("");
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!sectorId || !unitId) {
            setError("Please select both Sector and Unit.");
            return;
        }
        if (!personName.trim()) {
            setError("Please enter the person's name.");
            return;
        }
        if (!isEnglishName(personName)) {
            setError("Person name must be in English letters only.");
            return;
        }
        if (!isTenDigitMobile(mobile)) {
            setError("Mobile number must be exactly 10 digits.");
            return;
        }
        const litersVal = Number(liters);
        if (!Number.isFinite(litersVal) || litersVal <= 0) {
            setError("Please enter a valid quantity in liters.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/payasam/public", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sectorId,
                    unitId,
                    personName: personName.trim(),
                    mobile: mobile.trim(),
                    liters: litersVal,
                    paymentStatus,
                    notes: notes.trim() || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to submit order.");
                setSubmitting(false);
                return;
            }

            setSubmittedOrder(data.order);
        } catch {
            setError("Network error. Please check your connection and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddAnother = () => {
        setSubmittedOrder(null);
        setPersonName("");
        setMobile("");
        setLiters("1");
        setPaymentStatus("PENDING");
        setNotes("");
        setError(null);
        setCopied(false);
    };

    const shareText = submittedOrder
        ? `*Payasam Challenge - Order Confirmation*\n\nName: ${submittedOrder.personName}\nQuantity: ${formatLiters(submittedOrder.liters)} L\nUnit: ${submittedOrder.unitName} (${submittedOrder.sectorName} Sector)\nPayment: ${submittedOrder.paymentStatus === "PAID" ? "Paid" : "Pending"}`
        : "";

    const handleCopy = () => {
        if (!submittedOrder) return;
        const shortText = `${submittedOrder.personName} - ${formatLiters(submittedOrder.liters)} L`;
        navigator.clipboard.writeText(shortText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 flex flex-col items-center justify-center shadow-sm max-w-2xl mx-auto">
                <Loader2 size={28} className="animate-spin text-emerald-600 mb-3" />
                <p className="text-sm text-gray-500 font-medium">Loading hierarchy and challenge details...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Success Confirmation Card or Entry Form */}
            {submittedOrder ? (
                <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-10 shadow-sm space-y-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={30} />
                        </div>
                        <h2 className="text-2xl font-display font-semibold text-gray-950">
                            Order Added Successfully
                        </h2>
                        <p className="text-sm text-gray-500 max-w-md">
                            This order is now recorded and immediately visible in the{" "}
                            <span className="font-semibold text-gray-800">{submittedOrder.unitName}</span>{" "}
                            Unit Portal, Sector Portal, and Division Dashboard.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
                                Hierarchy
                            </span>
                            <span className="font-semibold text-gray-900">
                                {submittedOrder.sectorName} → {submittedOrder.unitName}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
                                Person Name
                            </span>
                            <span className="font-semibold text-gray-900">{submittedOrder.personName}</span>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
                                Mobile Number
                            </span>
                            <span className="font-mono font-medium text-gray-800">{submittedOrder.mobile}</span>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
                                Quantity & Payment
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="font-bold text-emerald-700 text-base">
                                    {formatLiters(submittedOrder.liters)} L ({formatRupees(calculatePayasamAmount(submittedOrder.liters))})
                                </span>
                                <span
                                    className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase",
                                        submittedOrder.paymentStatus === "PAID"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-100 text-amber-800"
                                    )}
                                >
                                    {submittedOrder.paymentStatus === "PAID" ? "Paid" : "Pending"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                        >
                            {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                            <span>{copied ? "Copied Name & Liters!" : "Copy Name & Liters"}</span>
                        </button>

                        <a
                            href={buildWhatsAppShareUrl(shareText)}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                        >
                            <MessageCircle size={15} />
                            <span>Share on WhatsApp</span>
                        </a>

                        <button
                            type="button"
                            onClick={handleAddAnother}
                            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                            <PlusCircle size={15} />
                            <span>Add Another Order</span>
                        </button>
                    </div>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-10 shadow-sm space-y-7"
                >
                    <div className="border-b border-gray-100 pb-5 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-1.5">
                                Public Order Entry
                            </span>
                            <h2 className="text-2xl font-display font-semibold text-gray-950">
                                Submit Payasam Order
                            </h2>
                        </div>
                        <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-900 text-xs font-bold">
                            {formatRupees(PAYASAM_PRICE_PER_LITER)} / Liter
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-xs text-red-700">
                            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                            <span className="font-medium leading-relaxed">{error}</span>
                        </div>
                    )}

                    {/* Step 1: Hierarchy Selection */}
                    <div className="space-y-4">


                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Sector <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Layers size={15} />
                                    </div>
                                    <select
                                        value={sectorId}
                                        onChange={(e) => handleSectorChange(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                    >
                                        <option value="">Select Sector...</option>
                                        {sectors.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Unit <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Building2 size={15} />
                                    </div>
                                    <select
                                        value={unitId}
                                        onChange={(e) => setUnitId(e.target.value)}
                                        disabled={!sectorId || availableUnits.length === 0}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:opacity-60"
                                    >
                                        <option value="">
                                            {!sectorId
                                                ? "Select a sector first..."
                                                : availableUnits.length === 0
                                                    ? "No units available in this sector"
                                                    : "Select Unit..."}
                                        </option>
                                        {availableUnits.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Order Details */}
                    <div className="space-y-4 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                            <User size={14} className="text-emerald-700" />
                            <span>2. Order Details</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Person Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <User size={15} />
                                    </div>
                                    <input
                                        type="text"
                                        value={personName}
                                        onChange={(e) => setPersonName(sanitizeEnglishNameInput(e.target.value))}
                                        placeholder="Enter full name (English only)"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Mobile Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Phone size={15} />
                                    </div>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        minLength={10}
                                        pattern="\d{10}"
                                        value={mobile}
                                        onChange={(e) => setMobile(sanitizeMobileInput(e.target.value))}
                                        placeholder="10-digit mobile number"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 text-sm font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-gray-700">
                                        Quantity (Liters) <span className="text-red-500">*</span>
                                    </label>
                                    <span className="text-xs font-bold text-emerald-700">
                                        Amount: {formatRupees(calculatePayasamAmount(Number(liters) || 0))}
                                    </span>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Droplets size={15} />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.25"
                                        min="0.25"
                                        value={liters}
                                        onChange={(e) => setLiters(e.target.value)}
                                        placeholder="e.g. 1.5"
                                        required
                                        className="w-full pl-10 pr-12 py-2.5 text-sm font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                    />
                                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-gray-400">
                                        Liters
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {LITER_PRESETS.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setLiters(String(preset))}
                                            className={cn(
                                                "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer",
                                                Number(liters) === preset
                                                    ? "bg-emerald-700 text-white border-emerald-700"
                                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                            )}
                                        >
                                            {preset} L
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Payment Status <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentStatus("PAID")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                                            paymentStatus === "PAID"
                                                ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                        )}
                                    >
                                        <CreditCard size={14} />
                                        <span>Paid</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentStatus("PENDING")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                                            paymentStatus === "PENDING"
                                                ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                        )}
                                    >
                                        <Clock size={14} />
                                        <span>Pending</span>
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">
                                    Select whether payment has been collected for this order.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Notes (Optional)
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any delivery note or reference"
                                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-black hover:bg-gray-800 text-white text-sm font-semibold transition-all shadow-xs disabled:opacity-60 cursor-pointer"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Submitting Order...</span>
                            </>
                        ) : (
                            <>
                                <PlusCircle size={16} />
                                <span>Submit Payasam Order</span>
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
