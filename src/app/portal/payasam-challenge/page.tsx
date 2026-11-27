"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Droplets,
    Plus,
    Copy,
    Check,
    MessageCircle,
    Search,
    Trash2,
    Edit3,
    Phone,
    Loader2,
    Target,
    CreditCard,
    Clock,
    Link2,
    Building2,
    Eye,
    X,
    AlertCircle,
    CheckCircle2,
    Users,
    ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    buildSectorAnalysisText,
    buildDivisionAnalysisText,
    buildUnitNamesAndLitersText,
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

interface PayasamOrderItem {
    id: string;
    sectorId: string;
    unitId: string;
    personName: string;
    mobile: string;
    liters: number;
    paymentStatus: "PAID" | "PENDING" | string;
    handedOverToSector: boolean;
    sectorHandoverAt: string | null;
    handedOverToDivision: boolean;
    divisionHandoverAt: string | null;
    source: string;
    notes: string | null;
    createdAt: string;
    unit?: {
        id: string;
        name: string;
        code: string | null;
    };
}

interface UnitBreakdownItem {
    unitId: string;
    unitName: string;
    unitCode: string | null;
    totalLiters: number;
    totalAmount: number;
    paidLiters: number;
    paidAmount: number;
    pendingLiters: number;
    pendingAmount: number;
    sectorHandoverLiters: number;
    sectorHandoverAmount: number;
    sectorHandoverCount: number;
    divisionHandoverLiters: number;
    divisionHandoverAmount: number;
    divisionHandoverCount: number;
    ordersCount: number;
    paidCount: number;
    pendingCount: number;
    orders: PayasamOrderItem[];
}

interface UnitResponse {
    entityType: "UNIT";
    entity: {
        id: string;
        name: string;
        sectorId: string;
        sectorName: string;
    };
    summary: {
        totalOrders: number;
        totalLiters: number;
        totalAmount: number;
        paidLiters: number;
        paidAmount: number;
        pendingLiters: number;
        pendingAmount: number;
        paidCount: number;
        pendingCount: number;
        sectorHandoverLiters: number;
        sectorHandoverAmount: number;
        sectorHandoverCount: number;
        divisionHandoverLiters: number;
        divisionHandoverAmount: number;
        sectorTargetLiters: number;
        sectorAchievedLiters: number;
    };
    orders: PayasamOrderItem[];
}

interface SectorResponse {
    entityType: "SECTOR" | "DIVISION";
    entity: {
        id: string;
        name: string;
        sectorId: string;
        sectorName: string;
    };
    summary: {
        targetLiters: number;
        totalLiters: number;
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
        totalUnitsCount: number;
        activeUnitsCount: number;
    };
    unitBreakdown: UnitBreakdownItem[];
    orders: PayasamOrderItem[];
}

type PortalPayasamData = UnitResponse | SectorResponse;

const LITER_PRESETS = [0.5, 1, 1.5, 2, 3, 5];

export default function PortalPayasamChallengePage() {
    const [data, setData] = useState<PortalPayasamData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
    const [sectorTab, setSectorTab] = useState<"UNITS" | "ORDERS" | "SECTORS">("UNITS");
    const [handoverFilter, setHandoverFilter] = useState<
        "ALL" | "TO_SECTOR_PENDING" | "TO_DIVISION_PENDING" | "HANDED_DIVISION"
    >("ALL");

    // Bulk selections
    const [selectedOrderIds, setSelectedOrderIds] = useState<Record<string, boolean>>({});
    const [selectedUnitIds, setSelectedUnitIds] = useState<Record<string, boolean>>({});
    const [bulkLoading, setBulkLoading] = useState(false);

    // Copy feedback
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Order modal
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<PayasamOrderItem | null>(null);
    const [selectedUnitId, setSelectedUnitId] = useState("");
    const [personName, setPersonName] = useState("");
    const [mobile, setMobile] = useState("");
    const [liters, setLiters] = useState("1");
    const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING">("PENDING");
    const [notes, setNotes] = useState("");
    const [savingOrder, setSavingOrder] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Sector unit drill-down modal
    const [viewingUnit, setViewingUnit] = useState<UnitBreakdownItem | null>(null);

    const fetchPayasamData = async () => {
        try {
            const res = await fetch("/api/portal/payasam");
            if (!res.ok) {
                throw new Error("Failed to load Payasam Challenge data.");
            }
            const json: PortalPayasamData = await res.json();
            setData(json);
            if (viewingUnit && json.entityType !== "UNIT") {
                const updatedUnit = json.unitBreakdown.find((u) => u.unitId === viewingUnit.unitId);
                setViewingUnit(updatedUnit || null);
            }
        } catch (err: any) {
            setError(err?.message || "Failed to load Payasam Challenge data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayasamData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const copyText = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2200);
    };

    const getPublicLink = () => {
        if (typeof window === "undefined" || !data) return "/payasam-challenge";
        const base = `${window.location.origin}/payasam-challenge`;
        if (data.entityType === "UNIT") {
            return `${base}?sectorId=${encodeURIComponent(data.entity.sectorId)}&unitId=${encodeURIComponent(data.entity.id)}`;
        }
        return `${base}?sectorId=${encodeURIComponent(data.entity.id)}`;
    };

    const openCreateModal = (defaultUnitId?: string) => {
        setEditingOrder(null);
        setSelectedUnitId(defaultUnitId || "");
        setPersonName("");
        setMobile("");
        setLiters("1");
        setPaymentStatus("PENDING");
        setNotes("");
        setFormError(null);
        setIsOrderModalOpen(true);
    };

    const openEditModal = (order: PayasamOrderItem) => {
        setEditingOrder(order);
        setSelectedUnitId(order.unitId);
        setPersonName(order.personName);
        setMobile(order.mobile);
        setLiters(String(order.liters));
        setPaymentStatus(order.paymentStatus === "PAID" ? "PAID" : "PENDING");
        setNotes(order.notes || "");
        setFormError(null);
        setIsOrderModalOpen(true);
    };

    const handleSaveOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!isEnglishName(personName)) {
            setFormError("Person name must be in English letters only.");
            return;
        }
        if (!isTenDigitMobile(mobile)) {
            setFormError("Mobile number must be exactly 10 digits.");
            return;
        }

        setSavingOrder(true);

        try {
            const url = editingOrder
                ? `/api/portal/payasam/${editingOrder.id}`
                : "/api/portal/payasam";
            const method = editingOrder ? "PATCH" : "POST";

            const payload: Record<string, unknown> = {
                personName: personName.trim(),
                mobile: mobile.trim(),
                liters: Number(liters),
                paymentStatus,
                notes: notes.trim() || null,
            };
            if (!editingOrder && data?.entityType !== "UNIT") {
                payload.unitId = selectedUnitId;
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) {
                setFormError(json.error || "Failed to save order.");
                setSavingOrder(false);
                return;
            }

            setIsOrderModalOpen(false);
            await fetchPayasamData();
        } catch {
            setFormError("Network error. Please try again.");
        } finally {
            setSavingOrder(false);
        }
    };

    const handleTogglePayment = async (order: PayasamOrderItem) => {
        const nextStatus = order.paymentStatus === "PAID" ? "PENDING" : "PAID";
        try {
            const res = await fetch(`/api/portal/payasam/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentStatus: nextStatus }),
            });
            if (res.ok) await fetchPayasamData();
        } catch (err) {
            console.error("Failed to toggle payment status:", err);
        }
    };

    const handleToggleSectorHandover = async (order: PayasamOrderItem) => {
        try {
            const res = await fetch(`/api/portal/payasam/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handedOverToSector: !order.handedOverToSector }),
            });
            if (res.ok) await fetchPayasamData();
        } catch (err) {
            console.error("Failed to toggle sector handover:", err);
        }
    };

    const handleToggleDivisionHandover = async (order: PayasamOrderItem) => {
        // Prerequisite: cannot hand to Division until handed to Sector first
        if (!order.handedOverToSector && !order.handedOverToDivision) {
            alert("This order must be handed over to the Sector first before marking Division handover.");
            return;
        }
        try {
            const res = await fetch(`/api/portal/payasam/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handedOverToDivision: !order.handedOverToDivision }),
            });
            if (res.ok) await fetchPayasamData();
        } catch (err) {
            console.error("Failed to toggle division handover:", err);
        }
    };

    const handleBulkAction = async (
        action:
            | "MARK_PAID"
            | "MARK_PENDING"
            | "HANDOVER_TO_SECTOR"
            | "UNDO_SECTOR_HANDOVER"
            | "HANDOVER_TO_DIVISION"
            | "UNDO_DIVISION_HANDOVER",
        opts?: { orderIds?: string[]; unitIds?: string[] }
    ) => {
        const orderIds =
            opts?.orderIds ??
            Object.entries(selectedOrderIds)
                .filter(([, checked]) => checked)
                .map(([id]) => id);
        const unitIds =
            opts?.unitIds ??
            Object.entries(selectedUnitIds)
                .filter(([, checked]) => checked)
                .map(([id]) => id);

        if (orderIds.length === 0 && unitIds.length === 0) return;

        setBulkLoading(true);
        try {
            const res = await fetch("/api/portal/payasam", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    orderIds: orderIds.length > 0 ? orderIds : undefined,
                    unitIds: unitIds.length > 0 ? unitIds : undefined,
                }),
            });
            if (res.ok) {
                setSelectedOrderIds({});
                setSelectedUnitIds({});
                await fetchPayasamData();
            }
        } catch (err) {
            console.error("Bulk update failed:", err);
        } finally {
            setBulkLoading(false);
        }
    };

    const handleDeleteOrder = async (order: PayasamOrderItem) => {
        if (!confirm(`Delete order for "${order.personName}" (${formatLiters(order.liters)} L)?`)) {
            return;
        }
        try {
            const res = await fetch(`/api/portal/payasam/${order.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await fetchPayasamData();
            }
        } catch (err) {
            console.error("Failed to delete order:", err);
        }
    };

    const filteredUnitOrders = useMemo(() => {
        if (!data || data.entityType !== "UNIT") return [];
        const q = searchQuery.toLowerCase();
        return data.orders.filter((o) => {
            const matchesFilter =
                paymentFilter === "ALL" || o.paymentStatus === paymentFilter;
            const matchesSearch =
                !q ||
                o.personName.toLowerCase().includes(q) ||
                o.mobile.toLowerCase().includes(q);
            return matchesFilter && matchesSearch;
        });
    }, [data, searchQuery, paymentFilter]);

    const filteredSectorUnits = useMemo(() => {
        if (!data || data.entityType === "UNIT") return [];
        const q = searchQuery.toLowerCase();
        return data.unitBreakdown.filter(
            (u) =>
                !q ||
                u.unitName.toLowerCase().includes(q) ||
                (u.unitCode && u.unitCode.toLowerCase().includes(q))
        );
    }, [data, searchQuery]);

    const filteredSectorOrders = useMemo(() => {
        if (!data || data.entityType === "UNIT") return [];
        const q = searchQuery.toLowerCase();
        return data.orders.filter((o) => {
            const matchesSearch =
                !q ||
                o.personName.toLowerCase().includes(q) ||
                o.mobile.toLowerCase().includes(q) ||
                (o.unit?.name && o.unit.name.toLowerCase().includes(q));
            const matchesPayment =
                paymentFilter === "ALL" || o.paymentStatus === paymentFilter;
            const matchesHandover =
                handoverFilter === "ALL"
                    ? true
                    : handoverFilter === "TO_SECTOR_PENDING"
                    ? !o.handedOverToSector
                    : handoverFilter === "TO_DIVISION_PENDING"
                    ? !o.handedOverToDivision
                    : o.handedOverToDivision;
            return matchesSearch && matchesPayment && matchesHandover;
        });
    }, [data, searchQuery, paymentFilter, handoverFilter]);

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[380px]">
                <Loader2 size={28} className="animate-spin text-emerald-600 mb-2" />
                <p className="text-xs text-gray-500 font-medium">Loading Payasam Challenge...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8 max-w-3xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-xs text-red-700 flex items-center gap-3">
                    <AlertCircle size={18} />
                    <span>{error || "Unable to load Payasam Challenge."}</span>
                </div>
            </div>
        );
    }

    // =========================================================================
    // UNIT PORTAL VIEW
    // =========================================================================
    if (data.entityType === "UNIT") {
        const unitShareText = buildUnitNamesAndLitersText({
            unitName: data.entity.name,
            sectorName: data.entity.sectorName,
            orders: filteredUnitOrders,
        });

        const selectedIdsList = filteredUnitOrders
            .filter((o) => selectedOrderIds[o.id])
            .map((o) => o.id);
        const allSelected =
            filteredUnitOrders.length > 0 && selectedIdsList.length === filteredUnitOrders.length;

        return (
            <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                UNIT
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                                {data.entity.sectorName} Sector
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                                {formatRupees(PAYASAM_PRICE_PER_LITER)} / Liter
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-950 font-sans tracking-tight flex items-center gap-2.5">
                            <Droplets className="text-emerald-700" size={26} />
                            <span>Payasam Challenge</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500">
                            Manage orders for <span className="font-semibold text-gray-800">{data.entity.name}</span>, record payments &amp; sector handovers, and copy Name &amp; Liters for WhatsApp.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => copyText(getPublicLink(), "public-link")}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
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
                            onClick={() => openCreateModal()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                            <Plus size={15} />
                            <span>Add Order</span>
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <span className="text-xs font-semibold text-gray-500">Total Ordered</span>
                        <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
                            {formatLiters(data.summary.totalLiters)} L
                        </div>
                        <p className="text-xs font-bold text-gray-800 mt-1">
                            {formatRupees(data.summary.totalAmount)}{" "}
                            <span className="font-normal text-gray-400">
                                ({data.summary.totalOrders} orders)
                            </span>
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <span className="text-xs font-semibold text-gray-500">Paid</span>
                        <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
                            {formatRupees(data.summary.paidAmount)}
                        </div>
                        <p className="text-[11px] text-emerald-700 font-medium mt-1">
                            {formatLiters(data.summary.paidLiters)} L ({data.summary.paidCount} orders)
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <span className="text-xs font-semibold text-gray-500">Pending Payment</span>
                        <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
                            {formatRupees(data.summary.pendingAmount)}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                            {formatLiters(data.summary.pendingLiters)} L ({data.summary.pendingCount} orders)
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <span className="text-xs font-semibold text-gray-500">Handed to Sector</span>
                        <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-2">
                            {formatRupees(data.summary.sectorHandoverAmount)}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                            {formatLiters(data.summary.sectorHandoverLiters)} L ({data.summary.sectorHandoverCount} orders)
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Search size={15} />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or mobile..."
                                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                            />
                        </div>

                        <div className="inline-flex bg-gray-100 p-1 rounded-xl self-start">
                            {(["ALL", "PAID", "PENDING"] as const).map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setPaymentFilter(status)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                        paymentFilter === status
                                            ? "bg-white text-gray-900 shadow-2xs"
                                            : "text-gray-500 hover:text-gray-800"
                                    )}
                                >
                                    {status === "ALL" ? "All" : status === "PAID" ? "Paid" : "Pending"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => copyText(unitShareText, "unit-copy")}
                            disabled={filteredUnitOrders.length === 0}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {copiedKey === "unit-copy" ? (
                                <Check size={14} className="text-emerald-600" />
                            ) : (
                                <Copy size={14} />
                            )}
                            <span>
                                {copiedKey === "unit-copy"
                                    ? "Copied Name & Liters!"
                                    : "Copy Name & Liters"}
                            </span>
                        </button>

                        <a
                            href={buildWhatsAppShareUrl(unitShareText)}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                                "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors",
                                filteredUnitOrders.length === 0 && "pointer-events-none opacity-50"
                            )}
                        >
                            <MessageCircle size={14} />
                            <span>Send on WhatsApp</span>
                        </a>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIdsList.length > 0 && (
                    <div className="bg-emerald-950 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                        <div className="text-xs font-semibold">
                            {selectedIdsList.length} {selectedIdsList.length === 1 ? "order" : "orders"} selected
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                disabled={bulkLoading}
                                onClick={() => handleBulkAction("HANDOVER_TO_SECTOR", { orderIds: selectedIdsList })}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                            >
                                Mark Handed to Sector
                            </button>
                            <button
                                type="button"
                                disabled={bulkLoading}
                                onClick={() => handleBulkAction("UNDO_SECTOR_HANDOVER", { orderIds: selectedIdsList })}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                            >
                                Undo Sector Handover
                            </button>
                            <button
                                type="button"
                                disabled={bulkLoading}
                                onClick={() => handleBulkAction("MARK_PAID", { orderIds: selectedIdsList })}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                            >
                                Mark Paid
                            </button>
                            <button
                                type="button"
                                disabled={bulkLoading}
                                onClick={() => handleBulkAction("MARK_PENDING", { orderIds: selectedIdsList })}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                            >
                                Mark Pending
                            </button>
                        </div>
                    </div>
                )}

                {/* Orders Table */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
                    {filteredUnitOrders.length === 0 ? (
                        <div className="p-12 text-center space-y-2">
                            <Droplets size={34} className="mx-auto text-gray-300" />
                            <h3 className="text-sm font-bold text-gray-700">No Orders Found</h3>
                            <p className="text-xs text-gray-400">
                                Click &ldquo;Add Order&rdquo; or share your Public Order Link to start collecting orders.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/60">
                                        <th className="py-3 px-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    const next: Record<string, boolean> = {};
                                                    if (checked) {
                                                        for (const o of filteredUnitOrders) next[o.id] = true;
                                                    }
                                                    setSelectedOrderIds(next);
                                                }}
                                                className="rounded border-gray-300 accent-emerald-700 cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-3 px-3">#</th>
                                        <th className="py-3 px-4">Person Name</th>
                                        <th className="py-3 px-4">Mobile Number</th>
                                        <th className="py-3 px-4">Qty &amp; Amount</th>
                                        <th className="py-3 px-4">Payment</th>
                                        <th className="py-3 px-4">To Sector</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUnitOrders.map((order, idx) => (
                                        <tr key={order.id} className="hover:bg-gray-50/70">
                                            <td className="py-3.5 px-4">
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
                                            <td className="py-3.5 px-3 text-gray-400 font-mono">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-gray-900">
                                                    {order.personName}
                                                </div>
                                                {order.notes && (
                                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                                        {order.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <a
                                                    href={`tel:${order.mobile}`}
                                                    className="inline-flex items-center gap-1 font-mono text-emerald-700 hover:underline"
                                                >
                                                    <Phone size={11} />
                                                    <span>{order.mobile}</span>
                                                </a>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-gray-900 text-sm">
                                                    {formatLiters(order.liters)} L
                                                </div>
                                                <div className="text-[11px] font-semibold text-emerald-700">
                                                    {formatRupees(calculatePayasamAmount(order.liters))}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePayment(order)}
                                                    title="Click to toggle payment status"
                                                    className={cn(
                                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase cursor-pointer transition-colors",
                                                        order.paymentStatus === "PAID"
                                                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
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
                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSectorHandover(order)}
                                                    title="Click to record handover to Sector"
                                                    className={cn(
                                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors",
                                                        order.handedOverToSector
                                                            ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                    )}
                                                >
                                                    <ArrowUpRight size={11} />
                                                    <span>
                                                        {order.handedOverToSector ? "Handed" : "Not Handed"}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            copyText(
                                                                `${order.personName} - ${formatLiters(order.liters)} L`,
                                                                `row-${order.id}`
                                                            )
                                                        }
                                                        title="Copy Name & Liters"
                                                        className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                                    >
                                                        {copiedKey === `row-${order.id}` ? (
                                                            <Check size={14} className="text-emerald-600" />
                                                        ) : (
                                                            <Copy size={14} />
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(order)}
                                                        title="Edit Order"
                                                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteOrder(order)}
                                                        title="Delete Order"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Add / Edit Order Modal */}
                {isOrderModalOpen && (
                    <OrderModal
                        isOpen={isOrderModalOpen}
                        onClose={() => setIsOrderModalOpen(false)}
                        onSubmit={handleSaveOrder}
                        editingOrder={editingOrder}
                        isSector={false}
                        units={[]}
                        selectedUnitId={selectedUnitId}
                        setSelectedUnitId={setSelectedUnitId}
                        personName={personName}
                        setPersonName={setPersonName}
                        mobile={mobile}
                        setMobile={setMobile}
                        liters={liters}
                        setLiters={setLiters}
                        paymentStatus={paymentStatus}
                        setPaymentStatus={setPaymentStatus}
                        notes={notes}
                        setNotes={setNotes}
                        saving={savingOrder}
                        error={formError}
                    />
                )}
            </div>
        );
    }

    // =========================================================================
    // SECTOR / DIVISION PORTAL VIEW
    // =========================================================================
    const sectorAnalysisText =
        data.entityType === "DIVISION"
            ? buildDivisionAnalysisText({
                  totalTarget: data.summary.targetLiters,
                  totalAchieved: data.summary.totalLiters,
                  paidLiters: data.summary.paidLiters,
                  pendingLiters: data.summary.pendingLiters,
                  totalOrders: data.summary.totalOrders,
                  sectors: (data.sectorBreakdown || []).map((s) => ({
                      name: s.sectorName,
                      targetLiters: s.targetLiters,
                      achievedLiters: s.achievedLiters,
                      ordersCount: s.ordersCount,
                  })),
              })
            : buildSectorAnalysisText({
                  sectorName: data.entity.name,
                  targetLiters: data.summary.targetLiters,
                  achievedLiters: data.summary.totalLiters,
                  paidLiters: data.summary.paidLiters,
                  pendingLiters: data.summary.pendingLiters,
                  totalOrders: data.summary.totalOrders,
                  units: data.unitBreakdown,
              });

    const selectedUnitIdsList = filteredSectorUnits
        .filter((u) => selectedUnitIds[u.unitId])
        .map((u) => u.unitId);
    const allUnitsSelected =
        filteredSectorUnits.length > 0 && selectedUnitIdsList.length === filteredSectorUnits.length;

    const selectedOrderIdsList = filteredSectorOrders
        .filter((o) => selectedOrderIds[o.id])
        .map((o) => o.id);
    const allOrdersSelected =
        filteredSectorOrders.length > 0 && selectedOrderIdsList.length === filteredSectorOrders.length;

    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                            {data.entityType}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                            {data.summary.totalUnitsCount} Affiliated Units
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                            {formatRupees(PAYASAM_PRICE_PER_LITER)} / Liter
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-950 font-sans tracking-tight flex items-center gap-2.5">
                        <Droplets className="text-emerald-700" size={26} />
                        <span>Payasam Challenge</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500">
                        Unit-wise liter status, Division handover tracking, and WhatsApp analysis for{" "}
                        <span className="font-semibold text-gray-800">{data.entity.name}</span>.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => copyText(getPublicLink(), "public-link")}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                        {copiedKey === "public-link" ? (
                            <Check size={14} className="text-emerald-600" />
                        ) : (
                            <Link2 size={14} />
                        )}
                        <span>
                            {copiedKey === "public-link" ? "Public Link Copied!" : "Copy Public Link"}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => copyText(sectorAnalysisText, "sector-analysis")}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                        {copiedKey === "sector-analysis" ? (
                            <Check size={14} className="text-emerald-600" />
                        ) : (
                            <Copy size={14} />
                        )}
                        <span>
                            {copiedKey === "sector-analysis" ? "Analysis Copied!" : "Copy Analysis"}
                        </span>
                    </button>

                    <a
                        href={buildWhatsAppShareUrl(sectorAnalysisText)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                    >
                        <MessageCircle size={14} />
                        <span>Share Analysis on WhatsApp</span>
                    </a>

                    {data.unitBreakdown.length > 0 && (
                        <button
                            type="button"
                            onClick={() => openCreateModal(data.unitBreakdown[0]?.unitId)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                            <Plus size={14} />
                            <span>Add Order</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Sector Target</span>
                        <Target size={16} className="text-purple-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
                        {formatLiters(data.summary.targetLiters)} L
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                        {formatRupees(calculatePayasamAmount(data.summary.targetLiters))} target value
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Total Achieved</span>
                        <Droplets size={16} className="text-emerald-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
                        {formatLiters(data.summary.totalLiters)} L
                    </div>
                    <p className="text-xs font-bold text-gray-800 mt-1">
                        {formatRupees(data.summary.totalAmount)}{" "}
                        <span className="font-normal text-gray-400">
                            ({data.summary.completionPercentage}% · {data.summary.totalOrders} orders)
                        </span>
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">From Units (To Sector)</span>
                        <CreditCard size={16} className="text-purple-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-2">
                        {formatRupees(data.summary.sectorHandoverAmount)}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                        {formatLiters(data.summary.sectorHandoverLiters)} L · Paid total: {formatRupees(data.summary.paidAmount)}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Handed to Division</span>
                        <ArrowUpRight size={16} className="text-emerald-700" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-2">
                        {formatRupees(data.summary.divisionHandoverAmount)}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                        {formatLiters(data.summary.divisionHandoverLiters)} L handed to Division
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex flex-wrap bg-white border border-gray-200 p-1 rounded-xl self-start">
                    {data.entityType === "DIVISION" && (
                        <button
                            type="button"
                            onClick={() => {
                                setSectorTab("SECTORS");
                                setSelectedOrderIds({});
                                setSelectedUnitIds({});
                            }}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                                sectorTab === "SECTORS"
                                    ? "bg-emerald-700 text-white"
                                    : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            Sector-wise Status ({(data as any).sectorBreakdown?.length || 0})
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setSectorTab("UNITS");
                            setSelectedOrderIds({});
                        }}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                            sectorTab === "UNITS"
                                ? "bg-emerald-700 text-white"
                                : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        Unit-wise Status &amp; Handover ({data.unitBreakdown.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setSectorTab("ORDERS");
                            setSelectedUnitIds({});
                        }}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                            sectorTab === "ORDERS"
                                ? "bg-emerald-700 text-white"
                                : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        All Orders — Bulk Handover ({data.orders.length})
                    </button>
                </div>

                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={14} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                            sectorTab === "UNITS" ? "Search unit..." : "Search name, mobile, or unit..."
                        }
                        className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                </div>
            </div>

            {/* Bulk Action Bars */}
            {sectorTab === "UNITS" && selectedUnitIdsList.length > 0 && (
                <div className="bg-emerald-950 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div className="text-xs font-semibold">
                        {selectedUnitIdsList.length} {selectedUnitIdsList.length === 1 ? "unit" : "units"} selected
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("HANDOVER_TO_DIVISION", { unitIds: selectedUnitIdsList })}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                            title="Only orders already received from units (Sector handover done) will be marked"
                        >
                            Mark Handed Over to Division
                        </button>
                        <button
                            type="button"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("UNDO_DIVISION_HANDOVER", { unitIds: selectedUnitIdsList })}
                            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                        >
                            Undo Division Handover
                        </button>
                        <button
                            type="button"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("HANDOVER_TO_SECTOR", { unitIds: selectedUnitIdsList })}
                            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                        >
                            Mark Received from Units
                        </button>
                    </div>
                </div>
            )}

            {sectorTab === "ORDERS" && selectedOrderIdsList.length > 0 && (
                <div className="bg-emerald-950 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div className="text-xs font-semibold">
                        {selectedOrderIdsList.length} {selectedOrderIdsList.length === 1 ? "order" : "orders"} selected
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("HANDOVER_TO_DIVISION", { orderIds: selectedOrderIdsList })}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                            title="Only orders already received from units (Sector handover done) will be marked"
                        >
                            Mark Handed to Division
                        </button>
                        <button
                            type="button"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("UNDO_DIVISION_HANDOVER", { orderIds: selectedOrderIdsList })}
                            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                        >
                            Undo Division Handover
                        </button>
                        <button
                            type="button"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("HANDOVER_TO_SECTOR", { orderIds: selectedOrderIdsList })}
                            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                        >
                            Mark Received from Unit
                        </button>
                        <button
                            type="button"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("MARK_PAID", { orderIds: selectedOrderIdsList })}
                            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                        >
                            Mark Paid
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 0: SECTOR-WISE STATUS (DIVISION ONLY) */}
            {sectorTab === "SECTORS" && data.entityType === "DIVISION" && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    <th className="py-3.5 px-4">#</th>
                                    <th className="py-3.5 px-4">Sector Name</th>
                                    <th className="py-3.5 px-4">Target (L)</th>
                                    <th className="py-3.5 px-4">Achieved (L)</th>
                                    <th className="py-3.5 px-4">Orders</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {((data as any).sectorBreakdown || []).map((sec: any, idx: number) => (
                                    <tr key={sec.sectorId} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="py-3.5 px-4 text-xs text-gray-400 font-semibold">{idx + 1}</td>
                                        <td className="py-3.5 px-4 font-semibold text-gray-900">{sec.sectorName}</td>
                                        <td className="py-3.5 px-4 text-gray-600 font-medium">{formatLiters(sec.targetLiters)} L</td>
                                        <td className="py-3.5 px-4 font-bold text-emerald-700">{formatLiters(sec.achievedLiters)} L</td>
                                        <td className="py-3.5 px-4 text-gray-600">{sec.ordersCount}</td>
                                    </tr>
                                ))}
                                {(!(data as any).sectorBreakdown || (data as any).sectorBreakdown.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-sm text-gray-400">
                                            No sector data found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 1: UNIT-WISE STATUS */}
            {sectorTab === "UNITS" && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
                    {filteredSectorUnits.length === 0 ? (
                        <div className="p-10 text-center text-xs text-gray-400">
                            No units found matching your search.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/60">
                                        <th className="py-3 px-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={allUnitsSelected}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    const next: Record<string, boolean> = {};
                                                    if (checked) {
                                                        for (const u of filteredSectorUnits) next[u.unitId] = true;
                                                    }
                                                    setSelectedUnitIds(next);
                                                }}
                                                className="rounded border-gray-300 accent-emerald-700 cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-3 px-3">#</th>
                                        <th className="py-3 px-4">Unit Name</th>
                                        <th className="py-3 px-4">Orders</th>
                                        <th className="py-3 px-4">Total (L / ₹)</th>
                                        <th className="py-3 px-4">Paid (₹)</th>
                                        <th className="py-3 px-4">To Sector (₹)</th>
                                        <th className="py-3 px-4">To Division (₹)</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredSectorUnits.map((unit, idx) => (
                                        <tr key={unit.unitId} className="hover:bg-gray-50/70">
                                            <td className="py-3.5 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedUnitIds[unit.unitId]}
                                                    onChange={(e) =>
                                                        setSelectedUnitIds((prev) => ({
                                                            ...prev,
                                                            [unit.unitId]: e.target.checked,
                                                        }))
                                                    }
                                                    className="rounded border-gray-300 accent-emerald-700 cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-3.5 px-3 text-gray-400 font-mono">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-gray-900">
                                                {unit.unitName}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-gray-700">
                                                {unit.ordersCount}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-black text-gray-950 text-sm">
                                                    {formatLiters(unit.totalLiters)} L
                                                </div>
                                                <div className="text-[11px] font-semibold text-emerald-700">
                                                    {formatRupees(unit.totalAmount)}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-emerald-700">
                                                {formatRupees(unit.paidAmount)}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-purple-700">
                                                {formatRupees(unit.sectorHandoverAmount)}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-emerald-800">
                                                {formatRupees(unit.divisionHandoverAmount)}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingUnit(unit)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                                                >
                                                    <Eye size={13} />
                                                    <span>View Orders</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: ALL ORDERS BULK HANDOVER */}
            {sectorTab === "ORDERS" && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                        <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                            {(["ALL", "PAID", "PENDING"] as const).map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setPaymentFilter(status)}
                                    className={cn(
                                        "px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer",
                                        paymentFilter === status
                                            ? "bg-white text-gray-900 shadow-2xs"
                                            : "text-gray-500 hover:text-gray-800"
                                    )}
                                >
                                    {status === "ALL" ? "All Payments" : status === "PAID" ? "Paid" : "Pending"}
                                </button>
                            ))}
                        </div>

                        <select
                            value={handoverFilter}
                            onChange={(e) => setHandoverFilter(e.target.value as typeof handoverFilter)}
                            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-700"
                        >
                            <option value="ALL">All Handover States</option>
                            <option value="TO_SECTOR_PENDING">Pending from Unit (To Sector)</option>
                            <option value="TO_DIVISION_PENDING">Pending to Division</option>
                            <option value="HANDED_DIVISION">Handed to Division</option>
                        </select>
                    </div>

                    {filteredSectorOrders.length === 0 ? (
                        <div className="p-10 text-center text-xs text-gray-400">
                            No orders found matching your filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/60">
                                        <th className="py-3 px-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={allOrdersSelected}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    const next: Record<string, boolean> = {};
                                                    if (checked) {
                                                        for (const o of filteredSectorOrders) next[o.id] = true;
                                                    }
                                                    setSelectedOrderIds(next);
                                                }}
                                                className="rounded border-gray-300 accent-emerald-700 cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-3 px-4">Person &amp; Unit</th>
                                        <th className="py-3 px-4">Qty &amp; Amount</th>
                                        <th className="py-3 px-4">Payment</th>
                                        <th className="py-3 px-4">From Unit (To Sector)</th>
                                        <th className="py-3 px-4">To Division</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredSectorOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50/70">
                                            <td className="py-3.5 px-4">
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
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-gray-900">{order.personName}</div>
                                                <div className="text-[11px] text-gray-500">
                                                    {order.unit?.name || "-"} · {order.mobile}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-gray-900">
                                                    {formatLiters(order.liters)} L
                                                </div>
                                                <div className="text-[11px] font-semibold text-emerald-700">
                                                    {formatRupees(calculatePayasamAmount(order.liters))}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePayment(order)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase cursor-pointer",
                                                        order.paymentStatus === "PAID"
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-amber-100 text-amber-800"
                                                    )}
                                                >
                                                    {order.paymentStatus === "PAID" ? "Paid" : "Pending"}
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSectorHandover(order)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer",
                                                        order.handedOverToSector
                                                            ? "bg-purple-100 text-purple-800"
                                                            : "bg-gray-100 text-gray-500"
                                                    )}
                                                >
                                                    {order.handedOverToSector ? "Received" : "Pending"}
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {order.handedOverToDivision ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleDivisionHandover(order)}
                                                        className="px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer bg-emerald-700 text-white hover:bg-emerald-800"
                                                        title="Click to undo Division handover"
                                                    >
                                                        Handed to Division
                                                    </button>
                                                ) : order.handedOverToSector ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleDivisionHandover(order)}
                                                        className="px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-800"
                                                        title="Mark as handed to Division"
                                                    >
                                                        Not Handed
                                                    </button>
                                                ) : (
                                                    <span
                                                        className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-50 text-gray-300 cursor-not-allowed select-none"
                                                        title="Unit must hand over to Sector first"
                                                    >
                                                        Awaiting Sector
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Unit Drill-down Modal */}
            {viewingUnit && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                    Unit Orders
                                </span>
                                <h3 className="text-lg font-bold text-gray-950">
                                    {viewingUnit.unitName} ({formatLiters(viewingUnit.totalLiters)} L ·{" "}
                                    {formatRupees(viewingUnit.totalAmount)})
                                </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {viewingUnit.orders.length > 0 && (
                                    <>
                                        <button
                                            type="button"
                                            disabled={bulkLoading}
                                            onClick={() =>
                                                handleBulkAction("HANDOVER_TO_DIVISION", {
                                                    unitIds: [viewingUnit.unitId],
                                                })
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                                            title="Only orders already received from this unit (Sector handover done) will be marked as handed to Division"
                                        >
                                            <ArrowUpRight size={13} />
                                            <span>Hand All to Division</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                copyText(
                                                    buildUnitNamesAndLitersText({
                                                        unitName: viewingUnit.unitName,
                                                        sectorName: data.entity.name,
                                                        orders: viewingUnit.orders,
                                                    }),
                                                    "modal-unit-copy"
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                        >
                                            {copiedKey === "modal-unit-copy" ? (
                                                <Check size={13} className="text-emerald-600" />
                                            ) : (
                                                <Copy size={13} />
                                            )}
                                            <span>
                                                {copiedKey === "modal-unit-copy" ? "Copied!" : "Copy Name & Liters"}
                                            </span>
                                        </button>
                                        <a
                                            href={buildWhatsAppShareUrl(
                                                buildUnitNamesAndLitersText({
                                                    unitName: viewingUnit.unitName,
                                                    sectorName: data.entity.name,
                                                    orders: viewingUnit.orders,
                                                })
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                        >
                                            <MessageCircle size={13} />
                                            <span>WhatsApp</span>
                                        </a>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setViewingUnit(null)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1">
                            {viewingUnit.orders.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-8">
                                    No orders recorded for {viewingUnit.unitName} yet.
                                </p>
                            ) : (
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-500 font-semibold">
                                            <th className="py-2.5 px-3">#</th>
                                            <th className="py-2.5 px-3">Person Name</th>
                                            <th className="py-2.5 px-3">Mobile</th>
                                            <th className="py-2.5 px-3">Qty &amp; Amount</th>
                                            <th className="py-2.5 px-3">Payment</th>
                                            <th className="py-2.5 px-3">To Sector</th>
                                            <th className="py-2.5 px-3">To Division</th>
                                            <th className="py-2.5 px-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {viewingUnit.orders.map((order, idx) => (
                                            <tr key={order.id} className="hover:bg-gray-50/70">
                                                <td className="py-3 px-3 text-gray-400 font-mono">{idx + 1}</td>
                                                <td className="py-3 px-3 font-bold text-gray-900">{order.personName}</td>
                                                <td className="py-3 px-3 font-mono text-emerald-700">{order.mobile}</td>
                                                <td className="py-3 px-3">
                                                    <div className="font-bold text-gray-900">
                                                        {formatLiters(order.liters)} L
                                                    </div>
                                                    <div className="text-[11px] font-semibold text-emerald-700">
                                                        {formatRupees(calculatePayasamAmount(order.liters))}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePayment(order)}
                                                        className={cn(
                                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer",
                                                            order.paymentStatus === "PAID"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : "bg-amber-100 text-amber-800"
                                                        )}
                                                    >
                                                        {order.paymentStatus === "PAID" ? "Paid" : "Pending"}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleSectorHandover(order)}
                                                        className={cn(
                                                            "px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer",
                                                            order.handedOverToSector
                                                                ? "bg-purple-100 text-purple-800"
                                                                : "bg-gray-100 text-gray-500"
                                                        )}
                                                    >
                                                        {order.handedOverToSector ? "Received" : "Pending"}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-3">
                                                    {order.handedOverToDivision ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleDivisionHandover(order)}
                                                            className="px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer bg-emerald-700 text-white hover:bg-emerald-800"
                                                            title="Click to undo Division handover"
                                                        >
                                                            Handed
                                                        </button>
                                                    ) : order.handedOverToSector ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleDivisionHandover(order)}
                                                            className="px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-800"
                                                            title="Mark as handed to Division"
                                                        >
                                                            Pending
                                                        </button>
                                                    ) : (
                                                        <span
                                                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-300 cursor-not-allowed select-none"
                                                            title="Unit must hand over to Sector first"
                                                        >
                                                            Awaiting
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteOrder(order)}
                                                        className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Order Modal */}
            {isOrderModalOpen && (
                <OrderModal
                    isOpen={isOrderModalOpen}
                    onClose={() => setIsOrderModalOpen(false)}
                    onSubmit={handleSaveOrder}
                    editingOrder={editingOrder}
                    isSector={true}
                    units={data.unitBreakdown.map((u) => ({ id: u.unitId, name: u.unitName }))}
                    selectedUnitId={selectedUnitId}
                    setSelectedUnitId={setSelectedUnitId}
                    personName={personName}
                    setPersonName={setPersonName}
                    mobile={mobile}
                    setMobile={setMobile}
                    liters={liters}
                    setLiters={setLiters}
                    paymentStatus={paymentStatus}
                    setPaymentStatus={setPaymentStatus}
                    notes={notes}
                    setNotes={setNotes}
                    saving={savingOrder}
                    error={formError}
                />
            )}
        </div>
    );
}

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    editingOrder: PayasamOrderItem | null;
    isSector: boolean;
    units: Array<{ id: string; name: string }>;
    selectedUnitId: string;
    setSelectedUnitId: (val: string) => void;
    personName: string;
    setPersonName: (val: string) => void;
    mobile: string;
    setMobile: (val: string) => void;
    liters: string;
    setLiters: (val: string) => void;
    paymentStatus: "PAID" | "PENDING";
    setPaymentStatus: (val: "PAID" | "PENDING") => void;
    notes: string;
    setNotes: (val: string) => void;
    saving: boolean;
    error: string | null;
}

function OrderModal({
    onClose,
    onSubmit,
    editingOrder,
    isSector,
    units,
    selectedUnitId,
    setSelectedUnitId,
    personName,
    setPersonName,
    mobile,
    setMobile,
    liters,
    setLiters,
    paymentStatus,
    setPaymentStatus,
    notes,
    setNotes,
    saving,
    error,
}: OrderModalProps) {
    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-gray-950">
                            {editingOrder ? "Edit Order" : "Add Payasam Order"}
                        </h3>
                        <p className="text-[11px] text-emerald-700 font-semibold">
                            Rate: {formatRupees(PAYASAM_PRICE_PER_LITER)} / Liter
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-5 space-y-4 text-xs">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {isSector && !editingOrder && (
                        <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                                Unit <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Building2
                                    size={14}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <select
                                    value={selectedUnitId}
                                    onChange={(e) => setSelectedUnitId(e.target.value)}
                                    required
                                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                >
                                    <option value="">Select unit...</option>
                                    {units.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                            Person Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={personName}
                            onChange={(e) => setPersonName(sanitizeEnglishNameInput(e.target.value))}
                            placeholder="Enter full name (English only)"
                            required
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                            Mobile Number <span className="text-red-500">*</span>
                        </label>
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
                            className="w-full px-3.5 py-2.5 font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block font-semibold text-gray-700">
                                Quantity (Liters) <span className="text-red-500">*</span>
                            </label>
                            <span className="font-bold text-emerald-700">
                                Amount: {formatRupees(calculatePayasamAmount(Number(liters) || 0))}
                            </span>
                        </div>
                        <input
                            type="number"
                            step="0.25"
                            min="0.25"
                            value={liters}
                            onChange={(e) => setLiters(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {LITER_PRESETS.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setLiters(String(preset))}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer",
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
                        <label className="block font-semibold text-gray-700 mb-1">
                            Payment Status <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentStatus("PAID")}
                                className={cn(
                                    "py-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer",
                                    paymentStatus === "PAID"
                                        ? "bg-emerald-700 text-white border-emerald-700"
                                        : "bg-gray-50 text-gray-600 border-gray-200"
                                )}
                            >
                                <CreditCard size={13} />
                                <span>Paid</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentStatus("PENDING")}
                                className={cn(
                                    "py-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer",
                                    paymentStatus === "PENDING"
                                        ? "bg-amber-500 text-white border-amber-500"
                                        : "bg-gray-50 text-gray-600 border-gray-200"
                                )}
                            >
                                <Clock size={13} />
                                <span>Pending</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                            Notes (Optional)
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional note"
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            <span>{editingOrder ? "Save Changes" : "Add Order"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
