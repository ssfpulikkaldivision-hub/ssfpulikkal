"use client";

import { Fragment, useEffect, useState, useMemo } from "react";
import {
    Droplets,
    Target,
    Save,
    Copy,
    Check,
    MessageCircle,
    Link2,
    Search,
    Trash2,
    Download,
    Loader2,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Clock,
    CreditCard,
    Layers,
    AlertCircle,
    ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    buildDivisionAnalysisText,
    buildSectorAnalysisText,
    buildWhatsAppShareUrl,
    calculatePayasamAmount,
    formatLiters,
    formatRupees,
    PAYASAM_PRICE_PER_LITER,
} from "@/lib/payasam";

interface UnitStatus {
    id: string;
    name: string;
    code: string | null;
    sectorId: string;
    sectorName: string;
    totalLiters: number;
    totalAmount: number;
    paidLiters: number;
    paidAmount: number;
    pendingLiters: number;
    pendingAmount: number;
    sectorHandoverLiters: number;
    sectorHandoverAmount: number;
    divisionHandoverLiters: number;
    divisionHandoverAmount: number;
    ordersCount: number;
}

interface SectorStatus {
    id: string;
    name: string;
    code: string | null;
    secretaryName: string | null;
    secretaryMobile: string | null;
    targetLiters: number;
    achievedLiters: number;
    totalAmount: number;
    remainingLiters: number;
    completionPercentage: number;
    paidLiters: number;
    paidAmount: number;
    pendingLiters: number;
    pendingAmount: number;
    sectorHandoverLiters: number;
    sectorHandoverAmount: number;
    divisionHandoverLiters: number;
    divisionHandoverAmount: number;
    ordersCount: number;
    unitsCount: number;
    activeUnitsCount: number;
    units: UnitStatus[];
}

interface OrderRecord {
    id: string;
    sectorId: string;
    sectorName: string;
    unitId: string;
    unitName: string;
    personName: string;
    mobile: string;
    liters: number;
    paymentStatus: string;
    handedOverToSector: boolean;
    handedOverToDivision: boolean;
    source: string;
    notes: string | null;
    createdAt: string;
}

interface DivisionOverviewResponse {
    summary: {
        totalTarget: number;
        totalAchieved: number;
        totalAmount: number;
        remainingLiters: number;
        completionPercentage: number;
        paidLiters: number;
        paidAmount: number;
        pendingLiters: number;
        pendingAmount: number;
        sectorHandoverLiters: number;
        sectorHandoverAmount: number;
        divisionHandoverLiters: number;
        divisionHandoverAmount: number;
        totalOrders: number;
        totalSectorsCount: number;
        activeSectorsCount: number;
        totalUnitsCount: number;
        activeUnitsCount: number;
    };
    sectors: SectorStatus[];
    orders: OrderRecord[];
}

export default function AdminPayasamChallengePage() {
    const [data, setData] = useState<DivisionOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<"SECTORS" | "UNITS" | "ORDERS">("SECTORS");
    const [targetDrafts, setTargetDrafts] = useState<Record<string, string>>({});
    const [savingTargets, setSavingTargets] = useState(false);
    const [targetFeedback, setTargetFeedback] = useState<string | null>(null);

    const [expandedSectorIds, setExpandedSectorIds] = useState<Record<string, boolean>>({});
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Filters & Bulk
    const [searchQuery, setSearchQuery] = useState("");
    const [sectorFilter, setSectorFilter] = useState("ALL");
    const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
    const [selectedOrderIds, setSelectedOrderIds] = useState<Record<string, boolean>>({});
    const [bulkLoading, setBulkLoading] = useState(false);

    const fetchOverview = async () => {
        try {
            const res = await fetch("/api/admin/payasam");
            if (!res.ok) throw new Error("Failed to load Payasam Challenge overview.");
            const json: DivisionOverviewResponse = await res.json();
            setData(json);

            const drafts: Record<string, string> = {};
            for (const s of json.sectors) {
                drafts[s.id] = String(s.targetLiters || 0);
            }
            setTargetDrafts(drafts);
        } catch (err: any) {
            setError(err?.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    const copyText = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2200);
    };

    const getPublicLink = () => {
        if (typeof window === "undefined") return "/payasam-challenge";
        return `${window.location.origin}/payasam-challenge`;
    };

    const hasUnsavedTargets = useMemo(() => {
        if (!data) return false;
        return data.sectors.some(
            (s) => Number(targetDrafts[s.id] || 0) !== (s.targetLiters || 0)
        );
    }, [data, targetDrafts]);

    const handleSaveTargets = async () => {
        if (!data) return;
        setSavingTargets(true);
        setTargetFeedback(null);

        try {
            const targets = data.sectors.map((s) => ({
                sectorId: s.id,
                targetLiters: Math.max(0, Number(targetDrafts[s.id] || 0)),
            }));

            const res = await fetch("/api/admin/payasam/targets", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targets }),
            });

            if (!res.ok) {
                const json = await res.json();
                alert(json.error || "Failed to save sector targets.");
                setSavingTargets(false);
                return;
            }

            setTargetFeedback("Sector targets saved successfully.");
            await fetchOverview();
            setTimeout(() => setTargetFeedback(null), 3000);
        } catch {
            alert("Network error while saving targets.");
        } finally {
            setSavingTargets(false);
        }
    };

    const handleTogglePayment = async (order: OrderRecord) => {
        const nextStatus = order.paymentStatus === "PAID" ? "PENDING" : "PAID";
        try {
            const res = await fetch(`/api/admin/payasam/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentStatus: nextStatus }),
            });
            if (res.ok) await fetchOverview();
        } catch (err) {
            console.error("Failed to update payment status:", err);
        }
    };

    const handleToggleDivisionHandover = async (order: OrderRecord) => {
        try {
            const res = await fetch(`/api/admin/payasam/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handedOverToDivision: !order.handedOverToDivision }),
            });
            if (res.ok) await fetchOverview();
        } catch (err) {
            console.error("Failed to update division handover:", err);
        }
    };

    const handleBulkAction = async (
        action:
            | "MARK_PAID"
            | "MARK_PENDING"
            | "HANDOVER_TO_SECTOR"
            | "HANDOVER_TO_DIVISION"
            | "UNDO_DIVISION_HANDOVER"
    ) => {
        const orderIds = Object.entries(selectedOrderIds)
            .filter(([, v]) => v)
            .map(([id]) => id);
        if (orderIds.length === 0) return;

        setBulkLoading(true);
        try {
            const res = await fetch("/api/admin/payasam", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, orderIds }),
            });
            if (res.ok) {
                setSelectedOrderIds({});
                await fetchOverview();
            }
        } catch (err) {
            console.error("Bulk update failed:", err);
        } finally {
            setBulkLoading(false);
        }
    };

    const handleDeleteOrder = async (order: OrderRecord) => {
        if (
            !confirm(
                `Delete order for "${order.personName}" (${formatLiters(order.liters)} L) in ${order.unitName}?`
            )
        ) {
            return;
        }
        try {
            const res = await fetch(`/api/admin/payasam/orders/${order.id}`, {
                method: "DELETE",
            });
            if (res.ok) await fetchOverview();
        } catch (err) {
            console.error("Failed to delete order:", err);
        }
    };

    const allUnits = useMemo(() => {
        if (!data) return [];
        const list = data.sectors.flatMap((s) => s.units);
        const q = searchQuery.toLowerCase();
        return list
            .filter((u) => {
                const matchSector = sectorFilter === "ALL" || u.sectorId === sectorFilter;
                const matchQuery =
                    !q ||
                    u.name.toLowerCase().includes(q) ||
                    u.sectorName.toLowerCase().includes(q);
                return matchSector && matchQuery;
            })
            .sort((a, b) => b.totalLiters - a.totalLiters || a.name.localeCompare(b.name));
    }, [data, searchQuery, sectorFilter]);

    const filteredOrders = useMemo(() => {
        if (!data) return [];
        const q = searchQuery.toLowerCase();
        return data.orders.filter((o) => {
            const matchSector = sectorFilter === "ALL" || o.sectorId === sectorFilter;
            const matchPayment = paymentFilter === "ALL" || o.paymentStatus === paymentFilter;
            const matchQuery =
                !q ||
                o.personName.toLowerCase().includes(q) ||
                o.mobile.toLowerCase().includes(q) ||
                o.unitName.toLowerCase().includes(q) ||
                o.sectorName.toLowerCase().includes(q);
            return matchSector && matchPayment && matchQuery;
        });
    }, [data, searchQuery, sectorFilter, paymentFilter]);

    const handleExportCsv = () => {
        const headers = [
            "Sector",
            "Unit",
            "Person Name",
            "Mobile",
            "Liters",
            "Amount (INR)",
            "Payment Status",
            "Handed to Sector",
            "Handed to Division",
            "Source",
            "Notes",
            "Created At",
        ];
        const escape = (v: string | number | boolean | null | undefined) =>
            `"${String(v ?? "").replace(/"/g, '""')}"`;

        const rows = filteredOrders.map((o) =>
            [
                o.sectorName,
                o.unitName,
                o.personName,
                o.mobile,
                formatLiters(o.liters),
                calculatePayasamAmount(o.liters),
                o.paymentStatus,
                o.handedOverToSector ? "Yes" : "No",
                o.handedOverToDivision ? "Yes" : "No",
                o.source,
                o.notes || "",
                new Date(o.createdAt).toLocaleString("en-IN"),
            ]
                .map(escape)
                .join(",")
        );

        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "payasam-challenge-orders.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center">
                <Loader2 size={28} className="animate-spin text-black mb-3" />
                <p className="text-xs text-gray-500 font-medium">Loading Payasam Challenge...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-xs text-red-700 flex items-center gap-3">
                <AlertCircle size={18} />
                <span>{error || "Unable to load Payasam Challenge data."}</span>
            </div>
        );
    }

    const divisionAnalysisText = buildDivisionAnalysisText({
        totalTarget: data.summary.totalTarget,
        totalAchieved: data.summary.totalAchieved,
        paidLiters: data.summary.paidLiters,
        pendingLiters: data.summary.pendingLiters,
        totalOrders: data.summary.totalOrders,
        sectors: data.sectors,
    });

    const selectedIdsList = filteredOrders
        .filter((o) => selectedOrderIds[o.id])
        .map((o) => o.id);
    const allOrdersSelected =
        filteredOrders.length > 0 && selectedIdsList.length === filteredOrders.length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="border-b border-gray-100 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                            Division Campaign Control
                        </p>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                            {formatRupees(PAYASAM_PRICE_PER_LITER)} / Liter
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-display font-medium text-black tracking-tight flex items-center gap-3">
                        <Droplets className="text-emerald-700" size={30} />
                        <span>Payasam Challenge</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Assign Sector liter targets, track Unit → Sector → Division payment handovers, and share Division status.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => copyText(getPublicLink(), "public-link")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                        {copiedKey === "public-link" ? (
                            <Check size={14} className="text-emerald-600" />
                        ) : (
                            <Link2 size={14} />
                        )}
                        <span>
                            {copiedKey === "public-link" ? "Public Link Copied!" : "Copy Public Order Link"}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => copyText(divisionAnalysisText, "division-copy")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                        {copiedKey === "division-copy" ? (
                            <Check size={14} className="text-emerald-600" />
                        ) : (
                            <Copy size={14} />
                        )}
                        <span>
                            {copiedKey === "division-copy" ? "Status Copied!" : "Copy Division Status"}
                        </span>
                    </button>

                    <a
                        href={buildWhatsAppShareUrl(divisionAnalysisText)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                    >
                        <MessageCircle size={14} />
                        <span>Share on WhatsApp</span>
                    </a>
                </div>
            </div>

            {/* Division Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs font-bold uppercase tracking-widest">Division Target</span>
                        <Target size={18} className="text-purple-600" />
                    </div>
                    <p className="text-3xl font-display font-medium text-black mt-3">
                        {formatLiters(data.summary.totalTarget)} L
                    </p>
                    <p className="text-xs text-gray-500 font-semibold mt-1">
                        {formatRupees(calculatePayasamAmount(data.summary.totalTarget))} across{" "}
                        {data.summary.totalSectorsCount} sectors
                    </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs font-bold uppercase tracking-widest">Total Achieved</span>
                        <Droplets size={18} className="text-emerald-700" />
                    </div>
                    <p className="text-3xl font-display font-medium text-emerald-700 mt-3">
                        {formatLiters(data.summary.totalAchieved)} L
                    </p>
                    <p className="text-xs font-bold text-gray-800 mt-1">
                        {formatRupees(data.summary.totalAmount)}{" "}
                        <span className="font-normal text-gray-400">
                            ({data.summary.completionPercentage}% · {data.summary.totalOrders} orders)
                        </span>
                    </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs font-bold uppercase tracking-widest">Payments</span>
                        <CreditCard size={18} className="text-emerald-600" />
                    </div>
                    <p className="text-2xl font-display font-medium text-black mt-3">
                        {formatRupees(data.summary.paidAmount)}{" "}
                        <span className="text-xs font-semibold text-emerald-700">Paid</span>
                    </p>
                    <p className="text-xs font-medium text-amber-700 mt-1">
                        {formatRupees(data.summary.pendingAmount)} Pending ({formatLiters(data.summary.pendingLiters)} L)
                    </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs font-bold uppercase tracking-widest">Handed to Division</span>
                        <ArrowUpRight size={18} className="text-emerald-700" />
                    </div>
                    <p className="text-3xl font-display font-medium text-emerald-800 mt-3">
                        {formatRupees(data.summary.divisionHandoverAmount)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        To Sector: {formatRupees(data.summary.sectorHandoverAmount)}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("SECTORS")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                            activeTab === "SECTORS"
                                ? "bg-black text-white"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        Sector Targets &amp; Status ({data.sectors.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("UNITS")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                            activeTab === "UNITS"
                                ? "bg-black text-white"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        Unit-wise Breakdown ({data.summary.totalUnitsCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("ORDERS")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                            activeTab === "ORDERS"
                                ? "bg-black text-white"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        All Orders ({data.orders.length})
                    </button>
                </div>

                {activeTab === "SECTORS" && (
                    <div className="flex items-center gap-3">
                        {targetFeedback && (
                            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 size={14} />
                                {targetFeedback}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleSaveTargets}
                            disabled={savingTargets || !hasUnsavedTargets}
                            className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                hasUnsavedTargets
                                    ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {savingTargets ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Save size={14} />
                            )}
                            <span>{savingTargets ? "Saving Targets..." : "Save Sector Targets"}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* TAB 1: SECTORS & TARGET ASSIGNMENT */}
            {activeTab === "SECTORS" && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/60">
                                    <th className="py-3.5 px-4 w-8"></th>
                                    <th className="py-3.5 px-4">Sector</th>
                                    <th className="py-3.5 px-4 w-36">Target (L)</th>
                                    <th className="py-3.5 px-4">Achieved (L / ₹)</th>
                                    <th className="py-3.5 px-4">Progress</th>
                                    <th className="py-3.5 px-4">To Sector (₹)</th>
                                    <th className="py-3.5 px-4">To Division (₹)</th>
                                    <th className="py-3.5 px-4">Units</th>
                                    <th className="py-3.5 px-4 text-right">Share</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.sectors.map((sector) => {
                                    const isExpanded = !!expandedSectorIds[sector.id];
                                    const sectorText = buildSectorAnalysisText({
                                        sectorName: sector.name,
                                        targetLiters: sector.targetLiters,
                                        achievedLiters: sector.achievedLiters,
                                        paidLiters: sector.paidLiters,
                                        pendingLiters: sector.pendingLiters,
                                        totalOrders: sector.ordersCount,
                                        units: sector.units.map((u) => ({
                                            unitName: u.name,
                                            totalLiters: u.totalLiters,
                                            ordersCount: u.ordersCount,
                                        })),
                                    });

                                    return (
                                        <Fragment key={sector.id}>
                                            <tr className="hover:bg-gray-50/70">
                                                <td className="py-3.5 px-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedSectorIds((prev) => ({
                                                                ...prev,
                                                                [sector.id]: !prev[sector.id],
                                                            }))
                                                        }
                                                        className="p-1 rounded-md text-gray-400 hover:text-black hover:bg-gray-100 cursor-pointer"
                                                        title="Toggle unit breakdown"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown size={15} />
                                                        ) : (
                                                            <ChevronRight size={15} />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-gray-950 text-sm">
                                                        {sector.name}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400">
                                                        {sector.ordersCount} orders
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={targetDrafts[sector.id] ?? "0"}
                                                            onChange={(e) =>
                                                                setTargetDrafts((prev) => ({
                                                                    ...prev,
                                                                    [sector.id]: e.target.value,
                                                                }))
                                                            }
                                                            className="w-20 px-2.5 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                                        />
                                                        <span className="text-[11px] text-gray-400 font-semibold">
                                                            L
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-emerald-700 text-sm">
                                                        {formatLiters(sector.achievedLiters)} L
                                                    </div>
                                                    <div className="text-[11px] font-semibold text-gray-700">
                                                        {formatRupees(sector.totalAmount)}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-600 rounded-full"
                                                                style={{
                                                                    width: `${Math.min(
                                                                        100,
                                                                        sector.completionPercentage
                                                                    )}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] font-bold text-gray-600">
                                                            {sector.completionPercentage}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 font-semibold text-purple-700">
                                                    {formatRupees(sector.sectorHandoverAmount)}
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-emerald-800">
                                                    {formatRupees(sector.divisionHandoverAmount)}
                                                </td>
                                                <td className="py-3.5 px-4 font-medium text-gray-700">
                                                    {sector.activeUnitsCount} / {sector.unitsCount}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                copyText(sectorText, `sec-${sector.id}`)
                                                            }
                                                            title="Copy sector analysis"
                                                            className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 cursor-pointer"
                                                        >
                                                            {copiedKey === `sec-${sector.id}` ? (
                                                                <Check size={14} className="text-emerald-600" />
                                                            ) : (
                                                                <Copy size={14} />
                                                            )}
                                                        </button>
                                                        <a
                                                            href={buildWhatsAppShareUrl(sectorText)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Share sector analysis on WhatsApp"
                                                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50"
                                                        >
                                                            <MessageCircle size={14} />
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-50/70">
                                                    <td colSpan={9} className="px-8 py-4">
                                                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                                                            Units in {sector.name} Sector
                                                        </div>
                                                        {sector.units.length === 0 ? (
                                                            <p className="text-xs text-gray-400">
                                                                No units registered under this sector.
                                                            </p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                                {sector.units.map((u) => (
                                                                    <div
                                                                        key={u.id}
                                                                        className="bg-white border border-gray-200/80 rounded-lg px-3.5 py-2.5 flex items-center justify-between"
                                                                    >
                                                                        <div>
                                                                            <div className="font-semibold text-gray-900 text-xs">
                                                                                {u.name}
                                                                            </div>
                                                                            <div className="text-[11px] text-gray-400">
                                                                                {u.ordersCount} orders · To Div:{" "}
                                                                                {formatRupees(u.divisionHandoverAmount)}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-sm font-bold text-emerald-700">
                                                                                {formatLiters(u.totalLiters)} L
                                                                            </div>
                                                                            <div className="text-[11px] font-semibold text-gray-600">
                                                                                {formatRupees(u.totalAmount)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2 & 3 SHARED FILTER BAR */}
            {activeTab !== "SECTORS" && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={
                                    activeTab === "UNITS"
                                        ? "Search unit or sector..."
                                        : "Search name, mobile, unit, or sector..."
                                }
                                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-gray-400" />
                            <select
                                value={sectorFilter}
                                onChange={(e) => setSectorFilter(e.target.value)}
                                className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-hidden"
                            >
                                <option value="ALL">All Sectors</option>
                                {data.sectors.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {activeTab === "ORDERS" && (
                            <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                                {(["ALL", "PAID", "PENDING"] as const).map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setPaymentFilter(status)}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-xs font-semibold cursor-pointer",
                                            paymentFilter === status
                                                ? "bg-white text-black shadow-2xs"
                                                : "text-gray-500 hover:text-black"
                                        )}
                                    >
                                        {status === "ALL" ? "All" : status === "PAID" ? "Paid" : "Pending"}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {activeTab === "ORDERS" && (
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={filteredOrders.length === 0}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 disabled:opacity-50 cursor-pointer"
                        >
                            <Download size={14} />
                            <span>Export CSV</span>
                        </button>
                    )}
                </div>
            )}

            {/* BULK BAR FOR ADMIN ORDERS */}
            {activeTab === "ORDERS" && selectedIdsList.length > 0 && (
                <div className="bg-black text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-semibold">{selectedIdsList.length} orders selected</span>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("HANDOVER_TO_DIVISION")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold cursor-pointer"
                        >
                            Mark Handed to Division
                        </button>
                        <button
                            type="button"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("UNDO_DIVISION_HANDOVER")}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
                        >
                            Undo Division Handover
                        </button>
                        <button
                            type="button"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("HANDOVER_TO_SECTOR")}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
                        >
                            Mark Handed to Sector
                        </button>
                        <button
                            type="button"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("MARK_PAID")}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
                        >
                            Mark Paid
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 2: UNIT-WISE BREAKDOWN */}
            {activeTab === "UNITS" && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/60">
                                    <th className="py-3 px-4">#</th>
                                    <th className="py-3 px-4">Unit</th>
                                    <th className="py-3 px-4">Sector</th>
                                    <th className="py-3 px-4">Orders</th>
                                    <th className="py-3 px-4">Total (L / ₹)</th>
                                    <th className="py-3 px-4">Paid (₹)</th>
                                    <th className="py-3 px-4">To Sector (₹)</th>
                                    <th className="py-3 px-4">To Division (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {allUnits.map((u, idx) => (
                                    <tr key={u.id} className="hover:bg-gray-50/70">
                                        <td className="py-3 px-4 text-gray-400 font-mono">{idx + 1}</td>
                                        <td className="py-3 px-4 font-bold text-gray-900">{u.name}</td>
                                        <td className="py-3 px-4 text-gray-600">{u.sectorName}</td>
                                        <td className="py-3 px-4 font-semibold">{u.ordersCount}</td>
                                        <td className="py-3 px-4">
                                            <div className="font-black text-gray-950 text-sm">
                                                {formatLiters(u.totalLiters)} L
                                            </div>
                                            <div className="text-[11px] font-semibold text-emerald-700">
                                                {formatRupees(u.totalAmount)}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-emerald-700 font-semibold">
                                            {formatRupees(u.paidAmount)}
                                        </td>
                                        <td className="py-3 px-4 text-purple-700 font-semibold">
                                            {formatRupees(u.sectorHandoverAmount)}
                                        </td>
                                        <td className="py-3 px-4 text-emerald-800 font-bold">
                                            {formatRupees(u.divisionHandoverAmount)}
                                        </td>
                                    </tr>
                                ))}
                                {allUnits.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-10 text-center text-gray-400">
                                            No units found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: ALL ORDERS */}
            {activeTab === "ORDERS" && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/60">
                                    <th className="py-3 px-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={allOrdersSelected}
                                            onChange={(e) => {
                                                const next: Record<string, boolean> = {};
                                                if (e.target.checked) {
                                                    for (const o of filteredOrders) next[o.id] = true;
                                                }
                                                setSelectedOrderIds(next);
                                            }}
                                            className="rounded border-gray-300 accent-emerald-700 cursor-pointer"
                                        />
                                    </th>
                                    <th className="py-3 px-4">Person Name</th>
                                    <th className="py-3 px-4">Unit &amp; Sector</th>
                                    <th className="py-3 px-4">Qty &amp; Amount</th>
                                    <th className="py-3 px-4">Payment</th>
                                    <th className="py-3 px-4">To Sector</th>
                                    <th className="py-3 px-4">To Division</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/70">
                                        <td className="py-3 px-4">
                                            <input
                                                type="checkbox"
                                                checked={!!selectedOrderIds[order.id]}
                                                onChange={(e) =>
                                                    setSelectedOrderIds((prev) => ({
                                                        ...prev,
                                                        [order.id]: e.target.checked,
                                                    }))
                                                }
                                                className="rounded border-gray-300 accent-emerald-700 cursor-pointer"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-gray-900">{order.personName}</div>
                                            <div className="text-[11px] font-mono text-emerald-700">
                                                {order.mobile}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-gray-800">{order.unitName}</div>
                                            <div className="text-[11px] text-gray-400">
                                                {order.sectorName} Sector
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-gray-950 text-sm">
                                                {formatLiters(order.liters)} L
                                            </div>
                                            <div className="text-[11px] font-semibold text-emerald-700">
                                                {formatRupees(calculatePayasamAmount(order.liters))}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                type="button"
                                                onClick={() => handleTogglePayment(order)}
                                                className={cn(
                                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase cursor-pointer",
                                                    order.paymentStatus === "PAID"
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-amber-100 text-amber-800"
                                                )}
                                            >
                                                {order.paymentStatus === "PAID" ? (
                                                    <CheckCircle2 size={11} />
                                                ) : (
                                                    <Clock size={11} />
                                                )}
                                                <span>
                                                    {order.paymentStatus === "PAID" ? "Paid" : "Pending"}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={cn(
                                                    "px-2.5 py-1 rounded-full text-[11px] font-bold",
                                                    order.handedOverToSector
                                                        ? "bg-purple-100 text-purple-800"
                                                        : "bg-gray-100 text-gray-500"
                                                )}
                                            >
                                                {order.handedOverToSector ? "Handed" : "Pending"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleDivisionHandover(order)}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer",
                                                    order.handedOverToDivision
                                                        ? "bg-emerald-700 text-white"
                                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                )}
                                            >
                                                {order.handedOverToDivision ? "Handed" : "Pending"}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteOrder(order)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                                title="Delete Order"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-10 text-center text-gray-400">
                                            No orders found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
