"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Ticket,
    Users,
    CheckCircle2,
    Clock,
    Search,
    Plus,
    Upload,
    Download,
    Printer,
    Edit2,
    Trash2,
    RotateCcw,
    Check,
    X,
    QrCode,
    Camera,
    Sparkles,
    Phone,
    MapPin,
    AlertCircle,
    Loader2,
    ArrowUpDown,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMobile } from "@/lib/councillor-utils";

interface Councillor {
    id: string;
    ticketNumber: string;
    name: string;
    mobile: string;
    sector: string;
    unit: string;
    designation?: string | null;
    isAdmitted: boolean;
    admittedAt?: string | null;
    notes?: string | null;
    createdAt: string;
}

interface SectorStat {
    name: string;
    total: number;
    admitted: number;
    pending: number;
}

interface Stats {
    total: number;
    admitted: number;
    pending: number;
    admittedPercentage: number;
    sectors: SectorStat[];
}

export default function AdminCouncillorsPage() {
    const [councillors, setCouncillors] = useState<Councillor[]>([]);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        admitted: 0,
        pending: 0,
        admittedPercentage: 0,
        sectors: [],
    });
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedSector, setSelectedSector] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ADMITTED" | "PENDING">("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Quick Admit
    const [quickCode, setQuickCode] = useState("");
    const [admitLoading, setAdmitLoading] = useState(false);
    const [admitAlert, setAdmitAlert] = useState<{
        type: "success" | "warning" | "error";
        message: string;
        councillor?: Councillor;
    } | null>(null);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingCouncillor, setEditingCouncillor] = useState<Councillor | null>(null);
    const [viewTicketCouncillor, setViewTicketCouncillor] = useState<Councillor | null>(null);
    const [ticketQR, setTicketQR] = useState<string>("");

    // Form State
    const [form, setForm] = useState({
        name: "",
        mobile: "",
        sector: "",
        unit: "",
        designation: "",
        notes: "",
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [isCustomUnit, setIsCustomUnit] = useState(false);

    // Bulk Import State
    const [bulkText, setBulkText] = useState("");
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState<any>(null);

    // Dynamic Entities Sectors & Units from Database
    const [entitiesSectors, setEntitiesSectors] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/entities")
            .then((r) => r.json())
            .then((d) => {
                if (d.sectors) setEntitiesSectors(d.sectors);
            })
            .catch(() => {});
    }, []);

    // Camera scanner
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const quickInputRef = useRef<HTMLInputElement | null>(null);

    // Fetch data
    const fetchData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (selectedSector && selectedSector !== "ALL") {
                queryParams.set("sector", selectedSector);
            }
            if (statusFilter && statusFilter !== "ALL") {
                queryParams.set("status", statusFilter);
            }
            if (searchQuery.trim()) {
                queryParams.set("search", searchQuery.trim());
            }

            const res = await fetch(`/api/councillors?${queryParams.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setCouncillors(data.councillors || []);
                setStats(data.stats || {
                    total: 0,
                    admitted: 0,
                    pending: 0,
                    admittedPercentage: 0,
                    sectors: [],
                });
            }
        } catch (err) {
            console.error("Failed to load councillors:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedSector, statusFilter]);

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Quick Admit Handler
    const handleQuickAdmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const code = quickCode.trim();
        if (!code) return;

        setAdmitLoading(true);
        setAdmitAlert(null);
        try {
            const res = await fetch("/api/councillors/admit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                if (data.alreadyAdmitted) {
                    setAdmitAlert({
                        type: "warning",
                        message: `Already Admitted: ${data.councillor.name} (${data.councillor.sector}) was admitted earlier!`,
                        councillor: data.councillor,
                    });
                } else {
                    setAdmitAlert({
                        type: "success",
                        message: `Admitted: ${data.councillor.name} (${data.councillor.sector} - ${data.councillor.unit})`,
                        councillor: data.councillor,
                    });
                }
                setQuickCode("");
                fetchData();
            } else {
                setAdmitAlert({
                    type: "error",
                    message: data.error || `Could not find any delegate matching "${code}"`,
                });
            }
        } catch (err: any) {
            setAdmitAlert({
                type: "error",
                message: err.message || "Failed to process admission",
            });
        } finally {
            setAdmitLoading(false);
            if (quickInputRef.current) {
                quickInputRef.current.focus();
            }
        }
    };

    // Toggle Admission Status
    const toggleAdmit = async (c: Councillor) => {
        try {
            const newStatus = !c.isAdmitted;
            const res = await fetch(`/api/councillors/${c.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isAdmitted: newStatus }),
            });

            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error("Failed to toggle admission:", err);
        }
    };

    // Delete Councillor
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete councillor "${name}"?`)) return;
        try {
            const res = await fetch(`/api/councillors/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error("Failed to delete councillor:", err);
        }
    };

    // Add or Update Councillor
    const handleSaveCouncillor = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError("");

        try {
            const isEditing = !!editingCouncillor;
            const url = isEditing
                ? `/api/councillors/${editingCouncillor.id}`
                : "/api/councillors";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (res.ok) {
                setShowAddModal(false);
                setEditingCouncillor(null);
                setForm({
                    name: "",
                    mobile: "",
                    sector: "",
                    unit: "",
                    designation: "",
                    notes: "",
                });
                fetchData();
            } else {
                setFormError(data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to save councillor"));
            }
        } catch (err: any) {
            setFormError(err.message || "Failed to save councillor");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle Bulk Import
    const handleBulkImport = async (e: React.FormEvent) => {
        e.preventDefault();
        setBulkLoading(true);
        setBulkResult(null);

        try {
            const res = await fetch("/api/councillors/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rawText: bulkText }),
            });

            const data = await res.json();
            if (res.ok) {
                setBulkResult(data);
                setBulkText("");
                fetchData();
            } else {
                setBulkResult({ error: data.error || "Bulk import failed" });
            }
        } catch (err: any) {
            setBulkResult({ error: err.message || "Bulk import failed" });
        } finally {
            setBulkLoading(false);
        }
    };

    // View Ticket Modal & Generate QR
    const handleViewTicket = async (c: Councillor) => {
        setViewTicketCouncillor(c);
        try {
            const res = await fetch(`/api/councillors/${c.id}`);
            const data = await res.json();
            if (res.ok && data.councillor) {
                setTicketQR(data.councillor.qrCode || "");
            }
        } catch (err) {
            console.error("Failed to load QR code:", err);
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (c: Councillor) => {
        setEditingCouncillor(c);
        setForm({
            name: c.name,
            mobile: c.mobile,
            sector: c.sector,
            unit: c.unit,
            designation: c.designation || "",
            notes: c.notes || "",
        });
        const matched = entitiesSectors.find(
            (s) => s.name.toLowerCase() === c.sector.trim().toLowerCase()
        );
        const knownUnits = matched?.units ? matched.units.map((u: any) => u.name) : [];
        setIsCustomUnit(knownUnits.length > 0 && !knownUnits.includes(c.unit));
        setFormError("");
        setShowAddModal(true);
    };

    // Export CSV
    const exportCSV = () => {
        const headers = ["Ticket No", "Name", "Mobile", "Sector", "Unit", "Designation", "Status", "Admitted Time"];
        const rows = councillors.map((c) => [
            c.ticketNumber,
            `"${c.name.replace(/"/g, '""')}"`,
            c.mobile,
            `"${c.sector.replace(/"/g, '""')}"`,
            `"${c.unit.replace(/"/g, '""')}"`,
            `"${(c.designation || "").replace(/"/g, '""')}"`,
            c.isAdmitted ? "ADMITTED" : "PENDING",
            c.admittedAt ? new Date(c.admittedAt).toLocaleTimeString() : "-",
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `councillors-${selectedSector !== "ALL" ? selectedSector : "all"}-${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print Attendance List
    const handlePrintList = () => {
        window.print();
    };

    // Camera QR Scanner Toggle
    const startCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err) {
            alert("Could not access camera. Please allow camera permission or use manual code entry.");
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    // Auto-extract sector list for autocomplete suggestions (merged from entities DB and councillor stats)
    const existingSectors = useMemo(() => {
        const set = new Set<string>();
        entitiesSectors.forEach((s) => set.add(s.name));
        stats.sectors.forEach((s) => set.add(s.name));
        return Array.from(set).sort();
    }, [entitiesSectors, stats.sectors]);

    const unitsForSelectedFormSector = useMemo(() => {
        if (!form.sector) return [];
        const matched = entitiesSectors.find(
            (s) => s.name.toLowerCase() === form.sector.trim().toLowerCase()
        );
        return matched?.units ? matched.units.map((u: any) => u.name) : [];
    }, [form.sector, entitiesSectors]);

    return (
        <div className="space-y-8 pb-16 font-sans">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 print:hidden">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-black text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded">
                            Students' Council 2026
                        </span>
                        <span className="text-gray-400 text-xs">• SSF Pulikkal Division</span>
                    </div>
                    <h1 className="text-3xl font-display font-medium text-black tracking-tight">
                        Councillors & Admission Manager
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage delegate registrations, QR tickets, and entrance admissions
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => {
                            setEditingCouncillor(null);
                            setForm({
                                name: "",
                                mobile: "",
                                sector: selectedSector !== "ALL" ? selectedSector : "",
                                unit: "",
                                designation: "",
                                notes: "",
                            });
                            setIsCustomUnit(false);
                            setFormError("");
                            setShowAddModal(true);
                        }}
                        className="inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        <Plus size={15} /> Add Councillor
                    </button>

                    <button
                        onClick={() => {
                            setBulkResult(null);
                            setShowBulkModal(true);
                        }}
                        className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Upload size={14} /> Bulk Import
                    </button>

                    <button
                        onClick={exportCSV}
                        className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                        title="Download CSV Spreadsheet"
                    >
                        <Download size={14} /> CSV
                    </button>

                    <button
                        onClick={handlePrintList}
                        className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                        title="Print List"
                    >
                        <Printer size={14} /> Print
                    </button>

                    <a
                        href="/tickets"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors"
                        title="Open Public Ticket Finder"
                    >
                        Public Finder <ExternalLink size={12} />
                    </a>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block mb-6 border-b border-black pb-4 text-center">
                <h2 className="text-2xl font-bold uppercase tracking-tight">SSF PULIKKAL DIVISION</h2>
                <h3 className="text-lg font-semibold">Students' Council 2026 - Delegates Attendance Sheet</h3>
                <p className="text-xs text-gray-600 mt-1">
                    Sector: {selectedSector !== "ALL" ? selectedSector : "All Sectors"} • Total: {stats.total} • Admitted: {stats.admitted}
                </p>
            </div>

            {/* Live Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center justify-between">
                        <span>Total Delegates</span>
                        <Users size={15} className="text-gray-400" />
                    </p>
                    <p className="text-3xl font-display font-medium text-black">{stats.total}</p>
                    <p className="text-xs text-gray-400 mt-1">Registered delegates</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1 flex items-center justify-between">
                        <span>Admitted</span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                    </p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-display font-medium text-emerald-600">{stats.admitted}</p>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {stats.admittedPercentage}%
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Admitted at entrance</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-1 flex items-center justify-between">
                        <span>Pending</span>
                        <Clock size={15} className="text-amber-500" />
                    </p>
                    <p className="text-3xl font-display font-medium text-amber-600">{stats.pending}</p>
                    <p className="text-xs text-gray-400 mt-1">Pending admission</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center justify-between">
                        <span>Sectors</span>
                        <MapPin size={15} className="text-gray-400" />
                    </p>
                    <p className="text-3xl font-display font-medium text-black">{stats.sectors.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Active sectors</p>
                </div>
            </div>

            {/* Quick Admit Station */}
            <div className="bg-black text-white rounded-2xl p-6 sm:p-7 shadow-lg relative overflow-hidden print:hidden">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-3xl">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <Sparkles size={14} /> Rapid Admission Station
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-medium text-white mb-2">
                        Scan QR Code or Enter Ticket / Mobile
                    </h2>
                    <p className="text-xs text-white/60 mb-5">
                        Scan delegate ticket QR code or enter mobile / ticket number to verify and admit entrance.
                    </p>

                    <form onSubmit={handleQuickAdmit} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <input
                                ref={quickInputRef}
                                type="text"
                                placeholder="Enter Ticket No (e.g. DSC-26-0001) or 10-digit Mobile..."
                                value={quickCode}
                                onChange={(e) => setQuickCode(e.target.value)}
                                className="w-full bg-white/10 text-white placeholder:text-white/40 border border-white/20 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-emerald-400 focus:bg-white/15 transition-all font-mono"
                                autoFocus
                            />
                            {quickCode && (
                                <button
                                    type="button"
                                    onClick={() => setQuickCode("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={admitLoading || !quickCode.trim()}
                                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
                            >
                                {admitLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                Admit Delegate
                            </button>

                            <button
                                type="button"
                                onClick={showCamera ? stopCamera : startCamera}
                                className={cn(
                                    "px-4 py-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0",
                                    showCamera
                                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                                        : "bg-white/10 hover:bg-white/20 text-white border-white/20"
                                )}
                                title="Toggle Camera Scanner"
                            >
                                <Camera size={16} />
                                <span className="hidden sm:inline">{showCamera ? "Stop Cam" : "Scan Cam"}</span>
                            </button>
                        </div>
                    </form>

                    {/* Camera Scanner Viewport */}
                    {showCamera && (
                        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl max-w-sm">
                            <p className="text-xs text-white/70 mb-2 font-medium flex items-center gap-1.5">
                                <QrCode size={13} className="text-emerald-400" /> Hold delegate's QR pass in front of camera
                            </p>
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/20">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                            </div>
                            <p className="text-[10px] text-white/40 mt-1.5">
                                Camera feed active. Enter code manually if camera lighting is low.
                            </p>
                        </div>
                    )}

                    {/* Quick Admit Result Feedback */}
                    {admitAlert && (
                        <div
                            className={cn(
                                "mt-4 p-4 rounded-xl border text-xs flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2",
                                admitAlert.type === "success" && "bg-emerald-950/80 border-emerald-500/50 text-emerald-200",
                                admitAlert.type === "warning" && "bg-amber-950/80 border-amber-500/50 text-amber-200",
                                admitAlert.type === "error" && "bg-red-950/80 border-red-500/50 text-red-200"
                            )}
                        >
                            <div className="flex items-start gap-2.5">
                                {admitAlert.type === "success" && <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />}
                                {admitAlert.type === "warning" && <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />}
                                {admitAlert.type === "error" && <X size={18} className="text-red-400 shrink-0 mt-0.5" />}
                                <div>
                                    <p className="font-semibold text-sm">{admitAlert.message}</p>
                                    {admitAlert.councillor && (
                                        <div className="mt-1 text-[11px] opacity-80 flex flex-wrap gap-x-4 gap-y-0.5">
                                            <span>Ticket: <strong>{admitAlert.councillor.ticketNumber}</strong></span>
                                            <span>Mobile: <strong>{formatMobile(admitAlert.councillor.mobile)}</strong></span>
                                            <span>Sector: <strong>{admitAlert.councillor.sector}</strong></span>
                                            <span>Unit: <strong>{admitAlert.councillor.unit}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setAdmitAlert(null)} className="opacity-60 hover:opacity-100 p-1">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sector Tabs Bar */}
            <div className="space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Filter by Sector
                    </p>
                    <span className="text-xs text-gray-500">
                        Showing: {selectedSector === "ALL" ? "All Sectors" : selectedSector} ({councillors.length})
                    </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => setSelectedSector("ALL")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border shrink-0",
                            selectedSector === "ALL"
                                ? "bg-black text-white border-black shadow-sm"
                                : "bg-white text-gray-600 border-gray-200 hover:border-black"
                        )}
                    >
                        All Sectors ({stats.total})
                    </button>

                    {existingSectors.map((secName) => {
                        const s = stats.sectors.find((item) => item.name.toLowerCase() === secName.toLowerCase());
                        return (
                            <button
                                key={secName}
                                onClick={() => setSelectedSector(secName)}
                                className={cn(
                                    "px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-2 shrink-0 cursor-pointer",
                                    selectedSector === secName
                                        ? "bg-black text-white border-black shadow-sm"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-black"
                                )}
                            >
                                <span>{secName}</span>
                                <span
                                    className={cn(
                                        "px-1.5 py-0.2 rounded text-[10px] font-bold",
                                        selectedSector === secName
                                            ? "bg-white/20 text-white"
                                            : "bg-gray-100 text-gray-600"
                                    )}
                                >
                                    {s ? `${s.admitted}/${s.total}` : "0"}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Search and Status Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm print:hidden">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Name, Mobile, Unit, Ticket No..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-0.5"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    {(["ALL", "ADMITTED", "PENDING"] as const).map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                                statusFilter === st
                                    ? "bg-black text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                        >
                            {st === "ALL" && "All Status"}
                            {st === "ADMITTED" && "Admitted Only"}
                            {st === "PENDING" && "Pending Only"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Table / Delegates List */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                        <Loader2 size={24} className="animate-spin text-black" />
                        <p className="text-xs font-medium">Loading councillors...</p>
                    </div>
                ) : councillors.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                        <Ticket size={36} className="text-gray-300 stroke-[1.5]" />
                        <p className="text-sm font-medium text-gray-600">No councillors found</p>
                        <p className="text-xs text-gray-400">
                            {searchQuery || selectedSector !== "ALL" || statusFilter !== "ALL"
                                ? "Try adjusting your filters or search query"
                                : "Click 'Add Councillor' to create the first delegate"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-3.5 px-4">Ticket No</th>
                                    <th className="py-3.5 px-4">Delegate Name</th>
                                    <th className="py-3.5 px-4">Mobile</th>
                                    <th className="py-3.5 px-4">Sector</th>
                                    <th className="py-3.5 px-4">Unit</th>
                                    <th className="py-3.5 px-4">Admission</th>
                                    <th className="py-3.5 px-4 text-right print:hidden">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {councillors.map((c) => (
                                    <tr
                                        key={c.id}
                                        className={cn(
                                            "hover:bg-gray-50/50 transition-colors group",
                                            c.isAdmitted && "bg-emerald-50/20"
                                        )}
                                    >
                                        {/* Ticket No */}
                                        <td className="py-3.5 px-4 font-mono font-medium text-black">
                                            <button
                                                onClick={() => handleViewTicket(c)}
                                                className="hover:underline flex items-center gap-1.5 text-left"
                                                title="View QR & Ticket"
                                            >
                                                <QrCode size={14} className="text-gray-400 group-hover:text-black shrink-0" />
                                                <span>{c.ticketNumber}</span>
                                            </button>
                                        </td>

                                        {/* Name */}
                                        <td className="py-3.5 px-4 font-medium text-black">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{c.name}</span>
                                                {c.designation && (
                                                    <span className="text-[10px] text-gray-400 font-normal">
                                                        {c.designation}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Mobile */}
                                        <td className="py-3.5 px-4 font-mono">
                                            <a
                                                href={`tel:${c.mobile}`}
                                                className="text-gray-600 hover:text-black hover:underline flex items-center gap-1"
                                            >
                                                <Phone size={11} className="text-gray-400" />
                                                {formatMobile(c.mobile)}
                                            </a>
                                        </td>

                                        {/* Sector */}
                                        <td className="py-3.5 px-4">
                                            <span className="inline-block bg-gray-100 text-gray-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                                                {c.sector}
                                            </span>
                                        </td>

                                        {/* Unit */}
                                        <td className="py-3.5 px-4 font-medium text-black">{c.unit}</td>

                                        {/* Admission Status */}
                                        <td className="py-3.5 px-4">
                                            {c.isAdmitted ? (
                                                <div className="flex items-center gap-1.5 text-emerald-700">
                                                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                                    <div>
                                                        <span className="font-bold text-[11px]">Admitted</span>
                                                        {c.admittedAt && (
                                                            <p className="text-[9px] text-gray-400">
                                                                {new Date(c.admittedAt).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-gray-400 text-[11px]">
                                                    <Clock size={13} /> Pending
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-right print:hidden">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* Admit / Undo Button */}
                                                <button
                                                    onClick={() => toggleAdmit(c)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1",
                                                        c.isAdmitted
                                                            ? "bg-gray-100 hover:bg-gray-200 text-gray-600"
                                                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                    )}
                                                    title={c.isAdmitted ? "Undo Admission" : "Mark Admitted"}
                                                >
                                                    {c.isAdmitted ? (
                                                        <>
                                                            <RotateCcw size={11} /> Undo
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check size={12} /> Admit
                                                        </>
                                                    )}
                                                </button>

                                                {/* View Ticket & QR */}
                                                <button
                                                    onClick={() => handleViewTicket(c)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                                                    title="View Pass & QR"
                                                >
                                                    <QrCode size={15} />
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => handleOpenEdit(c)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                                                    title="Edit Councillor"
                                                >
                                                    <Edit2 size={14} />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(c.id, c.name)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Delete Councillor"
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

            {/* ================= MODAL: ADD / EDIT COUNCILLOR ================= */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-lg font-display font-medium text-black">
                                    {editingCouncillor ? "Edit Councillor Details" : "Add New Councillor"}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {editingCouncillor
                                        ? `Editing ${editingCouncillor.ticketNumber}`
                                        : "Enter delegate registration details"}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingCouncillor(null);
                                }}
                                className="text-gray-400 hover:text-black p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                                <AlertCircle size={15} className="shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveCouncillor} className="space-y-4 text-xs">
                            {/* Name */}
                            <div>
                                <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Ameen Ahsan"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-black"
                                />
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Mobile Number *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="e.g. 9846001122"
                                    value={form.mobile}
                                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-black font-mono"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Delegates use this 10-digit mobile number to access their ticket pass.
                                </p>
                            </div>

                            {/* Sector & Unit */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block font-bold text-gray-600 uppercase tracking-wider">
                                            Sector *
                                        </label>
                                        <span className="text-[10px] text-emerald-600 font-semibold">
                                            {entitiesSectors.length} in entities
                                        </span>
                                    </div>
                                    <select
                                        required
                                        value={form.sector}
                                        onChange={(e) => {
                                            const newSec = e.target.value;
                                            const matched = entitiesSectors.find(
                                                (s) => s.name.toLowerCase() === newSec.trim().toLowerCase()
                                            );
                                            const validUnits = matched?.units ? matched.units.map((u: any) => u.name) : [];
                                            const keepUnit = validUnits.includes(form.unit) ? form.unit : "";
                                            setForm({ ...form, sector: newSec, unit: keepUnit });
                                            setIsCustomUnit(false);
                                        }}
                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                                    >
                                        <option value="">-- Select Sector --</option>
                                        {existingSectors.map((s) => (
                                            <option key={s} value={s}>
                                                {s} Sector
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block font-bold text-gray-600 uppercase tracking-wider">
                                            Unit *
                                        </label>
                                        {unitsForSelectedFormSector.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsCustomUnit(!isCustomUnit);
                                                    if (!isCustomUnit) setForm({ ...form, unit: "" });
                                                }}
                                                className="text-[10px] font-semibold text-zinc-500 hover:text-black underline cursor-pointer"
                                            >
                                                {isCustomUnit ? "← From Sector Units" : "+ Custom Unit"}
                                            </button>
                                        )}
                                    </div>

                                    {!form.sector ? (
                                        <select
                                            disabled
                                            className="w-full border border-gray-100 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                                        >
                                            <option>Select Sector First</option>
                                        </select>
                                    ) : unitsForSelectedFormSector.length > 0 && !isCustomUnit ? (
                                        <select
                                            required
                                            value={form.unit}
                                            onChange={(e) => {
                                                if (e.target.value === "__CUSTOM__") {
                                                    setIsCustomUnit(true);
                                                    setForm({ ...form, unit: "" });
                                                } else {
                                                    setForm({ ...form, unit: e.target.value });
                                                }
                                            }}
                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                                        >
                                            <option value="">-- Select Unit --</option>
                                            {unitsForSelectedFormSector.map((u: string) => (
                                                <option key={u} value={u}>
                                                    {u}
                                                </option>
                                            ))}
                                            <option value="__CUSTOM__">+ Other / Enter Unit Name...</option>
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            required
                                            placeholder="Enter unit name"
                                            value={form.unit}
                                            onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-black"
                                        />
                                    )}
                                </div>
                            </div>

                            {form.sector && (
                                <div className="flex items-center justify-between text-[11px] text-zinc-500 -mt-2">
                                    <span>
                                        Connected to Entities:{" "}
                                        <strong className="text-zinc-800 font-medium">
                                            {unitsForSelectedFormSector.length} units
                                        </strong>{" "}
                                        available under {form.sector}.
                                    </span>
                                    <a
                                        href="/admin/entities"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-zinc-600 hover:text-black font-semibold underline"
                                    >
                                        Manage Entities ↗
                                    </a>
                                </div>
                            )}

                            {/* Designation */}
                            <div>
                                <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Designation / Role (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Unit President, General Secretary, Delegate"
                                    value={form.designation}
                                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-black"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Notes (optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Any additional remarks..."
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-black"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingCouncillor(null);
                                    }}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-5 py-2.5 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {formLoading && <Loader2 size={14} className="animate-spin" />}
                                    {editingCouncillor ? "Save Changes" : "Create Councillor"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL: BULK IMPORT ================= */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-lg font-display font-medium text-black">
                                    Bulk Import Councillors
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Paste Excel or CSV data to import delegates in bulk
                                </p>
                            </div>
                            <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-black p-1">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-2">
                            <div>
                                <p className="font-bold text-gray-700">Instructions / Format:</p>
                                <p className="text-gray-500 font-mono text-[11px]">
                                    Each line: <strong>Name, Mobile, Sector, Unit, Designation</strong>
                                </p>
                                <p className="text-gray-400 text-[10px]">
                                    (Copy columns directly from Excel or spreadsheet - supports Tab or Comma separation)
                                </p>
                            </div>
                            {entitiesSectors.length > 0 && (
                                <div className="border-t border-gray-200/80 pt-2 text-[11px] text-zinc-600">
                                    <span className="font-semibold text-black">Available Sectors in Entities: </span>
                                    {entitiesSectors.map((s) => s.name).join(", ")}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleBulkImport} className="space-y-4">
                            <textarea
                                required
                                rows={8}
                                placeholder={`Ameen Ahsan, 9846001122, Pulikkal, Valiyaparamba, President\nMuhammed Rashid, 9745112233, Cherukavu, Muthuparamba, Secretary\nSalmanul Faris, 9633221100, Kondotty, Melangadi, Delegate`}
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-black"
                            />

                            {bulkResult && (
                                <div
                                    className={cn(
                                        "p-3.5 rounded-xl border text-xs",
                                        bulkResult.error
                                            ? "bg-red-50 border-red-200 text-red-700"
                                            : "bg-emerald-50 border-emerald-200 text-emerald-800"
                                    )}
                                >
                                    {bulkResult.error ? (
                                        <p className="font-semibold">{bulkResult.error}</p>
                                    ) : (
                                        <div>
                                            <p className="font-bold text-sm">✓ Import Completed!</p>
                                            <p className="mt-1">
                                                Successfully imported <strong>{bulkResult.imported}</strong> of{" "}
                                                {bulkResult.totalProcessed} delegates.
                                                {bulkResult.skipped > 0 && ` (${bulkResult.skipped} skipped)`}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkLoading || !bulkText.trim()}
                                    className="px-5 py-2.5 rounded-xl bg-black text-white font-semibold text-xs hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {bulkLoading && <Loader2 size={14} className="animate-spin" />}
                                    Process & Import
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL: VIEW TICKET PASS & QR ================= */}
            {viewTicketCouncillor && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 border border-gray-100">
                        {/* Ticket Pass Header */}
                        <div className="bg-black text-white p-6 relative">
                            <button
                                onClick={() => {
                                    setViewTicketCouncillor(null);
                                    setTicketQR("");
                                }}
                                className="absolute right-4 top-4 text-white/60 hover:text-white p-1"
                            >
                                <X size={18} />
                            </button>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-white/20 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                                    SSF Pulikkal Division
                                </span>
                            </div>
                            <h3 className="text-xl font-display font-medium text-white">
                                Students' Council 2026
                            </h3>
                            <p className="text-xs text-white/60 mt-0.5">Official Delegate Pass</p>
                        </div>

                        {/* Delegate Badge Info */}
                        <div className="p-6 space-y-5 text-center">
                            {/* QR Code */}
                            <div className="inline-block p-3 bg-white rounded-2xl border border-gray-200 shadow-md">
                                {ticketQR ? (
                                    <img
                                        src={ticketQR}
                                        alt="Ticket QR Code"
                                        className="w-44 h-44 mx-auto object-contain"
                                    />
                                ) : (
                                    <div className="w-44 h-44 flex items-center justify-center">
                                        <Loader2 size={24} className="animate-spin text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Ticket Number */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    Ticket Number
                                </p>
                                <p className="text-lg font-mono font-bold text-black tracking-wide">
                                    {viewTicketCouncillor.ticketNumber}
                                </p>
                            </div>

                            {/* Delegate Name & Role */}
                            <div className="border-t border-b border-gray-100 py-3 space-y-1">
                                <h4 className="text-lg font-bold text-black">{viewTicketCouncillor.name}</h4>
                                {viewTicketCouncillor.designation && (
                                    <p className="text-xs text-gray-500 font-medium">
                                        {viewTicketCouncillor.designation}
                                    </p>
                                )}
                                <p className="text-xs font-mono text-gray-500">
                                    {formatMobile(viewTicketCouncillor.mobile)}
                                </p>
                            </div>

                            {/* Sector & Unit */}
                            <div className="grid grid-cols-2 gap-2 text-left bg-gray-50 p-3 rounded-xl text-xs">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Sector</span>
                                    <span className="font-semibold text-black">{viewTicketCouncillor.sector}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Unit</span>
                                    <span className="font-semibold text-black">{viewTicketCouncillor.unit}</span>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                {viewTicketCouncillor.isAdmitted ? (
                                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
                                        <CheckCircle2 size={14} /> ADMITTED AT ENTRANCE
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">
                                        <Clock size={14} /> READY FOR ADMISSION
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    toggleAdmit(viewTicketCouncillor);
                                    setViewTicketCouncillor({
                                        ...viewTicketCouncillor,
                                        isAdmitted: !viewTicketCouncillor.isAdmitted,
                                    });
                                }}
                                className={cn(
                                    "w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors",
                                    viewTicketCouncillor.isAdmitted
                                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                                )}
                            >
                                {viewTicketCouncillor.isAdmitted ? "Undo Admission" : "Admit Delegate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
