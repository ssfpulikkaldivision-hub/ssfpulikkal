"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    Layers,
    Plus,
    Search,
    Trash2,
    Edit3,
    Eye,
    Calendar,
    Target,
    Users,
    Building2,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    Loader2,
    X,
    Bell,
    AlertCircle,
    FileSpreadsheet,
    MessageCircle,
    Sparkles,
    Globe,
    Check,
    Filter,
    ArrowUpRight,
    Droplets,
    Trophy,
    HeartHandshake,
    Settings2,
    Power
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignItem {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    targetAudience: string; // "ALL" | "SECTOR_ONLY" | "UNIT_ONLY"
    startDate: string | null;
    endDate: string | null;
    status: string; // "ACTIVE" | "INACTIVE" | "COMPLETED" | "ARCHIVED"
    bannerImage: string | null; // Icon key ("Droplets", "Trophy", "Heart", "Users", "Target", "Layers")
    attachmentUrl: string | null; // Route URL (e.g. "/portal/payasam-challenge")
    createdAt: string;
}

const PRESET_CAMPAIGNS = [
    {
        title: "Payasam Challenge 2026",
        slug: "payasam-challenge",
        path: "/portal/payasam-challenge",
        adminPath: "/admin/payasam-challenge",
        category: "Challenge",
        icon: "Droplets",
        description: "Enables Sectors and Units to record orders, collections, and delivery status directly.",
    },
    {
        title: "Ramadan Relief Drive",
        slug: "ramadan-relief",
        path: "/portal/campaigns/ramadan-relief",
        adminPath: "/admin/campaigns",
        category: "Relief",
        icon: "Heart",
        description: "Coordination and reporting for Ramadan food kit collection and distribution.",
    },
    {
        title: "Membership Campaign 2026",
        slug: "membership-drive",
        path: "/portal/campaigns/membership",
        adminPath: "/admin/campaigns",
        category: "Membership",
        icon: "Users",
        description: "Annual cadre and general membership intake reporting and analytics.",
    },
];

export default function AdminCampaignsPage() {
    const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [audienceFilter, setAudienceFilter] = useState<"ALL_AUDIENCE" | "ALL" | "SECTOR_ONLY" | "UNIT_ONLY">("ALL_AUDIENCE");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE">("ALL");

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Form inputs for campaign module
    const [cTitle, setCTitle] = useState("");
    const [cPath, setCPath] = useState("/portal/payasam-challenge");
    const [cIcon, setCIcon] = useState("Droplets");
    const [cDescription, setCDescription] = useState("");
    const [cCategory, setCCategory] = useState("Challenge");
    const [cAudience, setCAudience] = useState("ALL");
    const [cStatus, setCStatus] = useState("ACTIVE");
    const [savingCampaign, setSavingCampaign] = useState(false);

    const fetchAllCampaigns = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/campaigns");
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data.campaigns || []);
            }
        } catch (err) {
            console.error("Failed to load campaigns", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllCampaigns();
    }, []);

    const resetForm = () => {
        setEditingCampaign(null);
        setCTitle("");
        setCPath("/portal/payasam-challenge");
        setCIcon("Droplets");
        setCDescription("");
        setCCategory("Challenge");
        setCAudience("ALL");
        setCStatus("ACTIVE");
    };

    const handleSelectPreset = (preset: typeof PRESET_CAMPAIGNS[0]) => {
        setCTitle(preset.title);
        setCPath(preset.path);
        setCIcon(preset.icon);
        setCDescription(preset.description);
        setCCategory(preset.category);
    };

    const handleOpenEdit = (camp: CampaignItem) => {
        setEditingCampaign(camp);
        setCTitle(camp.title);
        setCPath(camp.attachmentUrl || `/portal/campaigns/${camp.id}`);
        setCIcon(camp.bannerImage || "Target");
        setCDescription(camp.description || "");
        setCCategory(camp.category || "Challenge");
        setCAudience(camp.targetAudience || "ALL");
        setCStatus(camp.status || "ACTIVE");
        setIsAddModalOpen(true);
    };

    // Quick toggle sidebar visibility (ACTIVE vs INACTIVE)
    const handleToggleStatus = async (camp: CampaignItem) => {
        const newStatus = camp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        setActionLoadingId(camp.id);
        try {
            const res = await fetch(`/api/admin/campaigns/${camp.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: camp.title,
                    description: camp.description,
                    category: camp.category,
                    targetAudience: camp.targetAudience,
                    attachmentUrl: camp.attachmentUrl,
                    bannerImage: camp.bannerImage,
                    status: newStatus,
                }),
            });
            if (res.ok) {
                setCampaigns((prev) =>
                    prev.map((c) => (c.id === camp.id ? { ...c, status: newStatus } : c))
                );
            }
        } catch (err) {
            console.error("Failed to toggle status", err);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Quick change target audience
    const handleAudienceChange = async (camp: CampaignItem, newAudience: string) => {
        setActionLoadingId(camp.id);
        try {
            const res = await fetch(`/api/admin/campaigns/${camp.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: camp.title,
                    description: camp.description,
                    category: camp.category,
                    targetAudience: newAudience,
                    attachmentUrl: camp.attachmentUrl,
                    bannerImage: camp.bannerImage,
                    status: camp.status,
                }),
            });
            if (res.ok) {
                setCampaigns((prev) =>
                    prev.map((c) => (c.id === camp.id ? { ...c, targetAudience: newAudience } : c))
                );
            }
        } catch (err) {
            console.error("Failed to change audience", err);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSaveCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingCampaign(true);

        const payload = {
            title: cTitle.trim(),
            description: cDescription.trim() || cTitle.trim(),
            category: cCategory,
            targetAudience: cAudience,
            attachmentUrl: cPath.trim(),
            bannerImage: cIcon,
            status: cStatus,
        };

        try {
            const url = editingCampaign
                ? `/api/admin/campaigns/${editingCampaign.id}`
                : `/api/admin/campaigns`;
            const method = editingCampaign ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setIsAddModalOpen(false);
                resetForm();
                fetchAllCampaigns();
            } else {
                alert("Failed to save campaign. Please try again.");
            }
        } catch {
            alert("Network error. Please check your connection and retry.");
        } finally {
            setSavingCampaign(false);
        }
    };

    const handleDeleteCampaign = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to remove "${title}" from the portal?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
            if (res.ok) {
                setCampaigns((prev) => prev.filter((c) => c.id !== id));
            } else {
                alert("Failed to remove campaign.");
            }
        } catch {
            alert("Network error.");
        }
    };

    const renderIconPreview = (iconKey?: string | null, slug?: string) => {
        const k = (iconKey || "").toLowerCase();
        const s = (slug || "").toLowerCase();
        if (k === "droplets" || s.includes("payasam")) {
            return <Droplets size={20} className="text-amber-600" />;
        }
        if (k === "trophy" || s.includes("sahithyotsav")) {
            return <Trophy size={20} className="text-purple-600" />;
        }
        if (k === "heart" || s.includes("relief")) {
            return <HeartHandshake size={20} className="text-rose-600" />;
        }
        if (k === "users" || s.includes("membership")) {
            return <Users size={20} className="text-blue-600" />;
        }
        return <Target size={20} className="text-emerald-600" />;
    };

    // Audience counts
    const audienceCounts = useMemo(() => {
        return {
            total: campaigns.length,
            both: campaigns.filter((c) => c.targetAudience === "ALL").length,
            sectorOnly: campaigns.filter((c) => c.targetAudience === "SECTOR_ONLY").length,
            unitOnly: campaigns.filter((c) => c.targetAudience === "UNIT_ONLY").length,
            activeInSidebar: campaigns.filter((c) => c.status === "ACTIVE").length,
        };
    }, [campaigns]);

    const filteredCampaigns = useMemo(() => {
        return campaigns.filter((c) => {
            const matchesSearch =
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.attachmentUrl && c.attachmentUrl.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            if (audienceFilter !== "ALL_AUDIENCE" && c.targetAudience !== audienceFilter) {
                return false;
            }

            if (statusFilter === "ACTIVE" && c.status !== "ACTIVE") {
                return false;
            }

            return true;
        });
    }, [campaigns, searchQuery, audienceFilter, statusFilter]);

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" />
                <p className="text-sm text-gray-500 font-medium">Loading portal campaigns...</p>
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight font-display flex items-center gap-2.5">
                        <Layers className="text-emerald-600" size={26} />
                        <span>Portal Campaigns & Modules</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Manage active campaigns, challenges, and programs visible in the Sector & Unit Portal sidebar
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/portal"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-2xs transition-colors"
                    >
                        <ExternalLink size={14} />
                        <span>Visit Portal</span>
                    </Link>

                    <button
                        onClick={() => {
                            resetForm();
                            setIsAddModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all active:scale-[0.99]"
                    >
                        <Plus size={16} />
                        <span>+ Add Campaign to Portal</span>
                    </button>
                </div>
            </div>



            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Target Audience Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setAudienceFilter("ALL_AUDIENCE")}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                            audienceFilter === "ALL_AUDIENCE"
                                ? "bg-gray-900 text-white shadow-xs"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        All Campaigns ({campaigns.length})
                    </button>
                    <button
                        onClick={() => setAudienceFilter("ALL")}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
                            audienceFilter === "ALL"
                                ? "bg-emerald-700 text-white shadow-xs"
                                : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
                        )}
                    >
                        <Users size={13} />
                        <span>Both Units & Sectors ({audienceCounts.both})</span>
                    </button>
                    <button
                        onClick={() => setAudienceFilter("SECTOR_ONLY")}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
                            audienceFilter === "SECTOR_ONLY"
                                ? "bg-purple-700 text-white shadow-xs"
                                : "bg-white text-purple-800 border border-purple-200 hover:bg-purple-50"
                        )}
                    >
                        <Building2 size={13} />
                        <span>Sectors Only ({audienceCounts.sectorOnly})</span>
                    </button>
                    <button
                        onClick={() => setAudienceFilter("UNIT_ONLY")}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
                            audienceFilter === "UNIT_ONLY"
                                ? "bg-amber-700 text-white shadow-xs"
                                : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
                        )}
                    >
                        <Layers size={13} />
                        <span>Units Only ({audienceCounts.unitOnly})</span>
                    </button>
                </div>

                {/* Search bar & status toggle */}
                <div className="flex items-center gap-2 max-w-md w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Search size={15} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search campaigns..."
                            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        />
                    </div>

                    <button
                        onClick={() => setStatusFilter(statusFilter === "ALL" ? "ACTIVE" : "ALL")}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                            statusFilter === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        {statusFilter === "ACTIVE" ? "Sidebar Active Only ✓" : "Status: All"}
                    </button>
                </div>
            </div>

            {/* Campaigns Cards List */}
            {filteredCampaigns.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-2xs">
                    <Layers size={44} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="font-bold text-gray-800 text-base">No campaigns found matching this filter</h3>
                    <p className="text-xs text-gray-400 mt-1">Click the button below to add a new campaign module to the portal.</p>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsAddModalOpen(true);
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                    >
                        <Plus size={15} />
                        <span>Add Campaign to Portal</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCampaigns.map((camp) => {
                        const portalHref = camp.attachmentUrl || (camp.slug.includes("payasam") ? "/portal/payasam-challenge" : `/portal/campaigns/${camp.id}`);
                        const adminHref = camp.slug.includes("payasam") ? "/admin/payasam-challenge" : `/admin/campaigns`;
                        const isActionLoading = actionLoadingId === camp.id;

                        return (
                            <div
                                key={camp.id}
                                className={cn(
                                    "bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 relative group",
                                    camp.status === "ACTIVE"
                                        ? "border-emerald-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300"
                                        : "border-gray-200/60 opacity-80 bg-gray-50/50"
                                )}
                            >
                                <div className="space-y-3">
                                    {/* Top Bar: Icon, Title & Sidebar Status Toggle */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                                {renderIconPreview(camp.bannerImage, camp.slug)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 font-display text-base leading-snug">
                                                    {camp.title}
                                                </h3>
                                                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                                                    {portalHref}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Toggle Active Button */}
                                        <button
                                            onClick={() => handleToggleStatus(camp)}
                                            disabled={isActionLoading}
                                            className={cn(
                                                "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border",
                                                camp.status === "ACTIVE"
                                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                                            )}
                                            title="Click to toggle portal sidebar visibility"
                                        >
                                            {isActionLoading ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <span className={camp.status === "ACTIVE" ? "w-2 h-2 rounded-full bg-emerald-500 animate-pulse" : "w-2 h-2 rounded-full bg-gray-400"}></span>
                                            )}
                                            <span>{camp.status === "ACTIVE" ? "Sidebar Active" : "Hidden"}</span>
                                        </button>
                                    </div>



                                    {/* Target Audience Quick Selector */}
                                    <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1.5 text-xs">
                                        <div className="flex items-center justify-between text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                                            <span>Target Audience</span>
                                            <span>Click to change</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <button
                                                onClick={() => handleAudienceChange(camp, "ALL")}
                                                className={cn(
                                                    "py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all text-center",
                                                    camp.targetAudience === "ALL"
                                                        ? "bg-emerald-600 text-white shadow-2xs"
                                                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                                                )}
                                            >
                                                Both (ALL)
                                            </button>
                                            <button
                                                onClick={() => handleAudienceChange(camp, "SECTOR_ONLY")}
                                                className={cn(
                                                    "py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all text-center",
                                                    camp.targetAudience === "SECTOR_ONLY"
                                                        ? "bg-purple-600 text-white shadow-2xs"
                                                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                                                )}
                                            >
                                                Sectors Only
                                            </button>
                                            <button
                                                onClick={() => handleAudienceChange(camp, "UNIT_ONLY")}
                                                className={cn(
                                                    "py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all text-center",
                                                    camp.targetAudience === "UNIT_ONLY"
                                                        ? "bg-amber-600 text-white shadow-2xs"
                                                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                                                )}
                                            >
                                                Units Only
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        {adminHref && (
                                            <Link
                                                href={adminHref}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-2xs"
                                            >
                                                <Settings2 size={13} />
                                                <span>Admin Page</span>
                                            </Link>
                                        )}

                                        <Link
                                            href={portalHref}
                                            target="_blank"
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
                                            title="Open Portal Page"
                                        >
                                            <ExternalLink size={12} />
                                            <span>Portal View</span>
                                        </Link>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenEdit(camp)}
                                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Edit details"
                                        >
                                            <Edit3 size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCampaign(camp.id, camp.title)}
                                            className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove from portal"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Campaign Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-display">
                                    {editingCampaign ? "Edit Portal Campaign" : "Add Campaign to Portal"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Configure how this campaign appears in the Sector & Unit portal sidebar
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Presets buttons (only when creating new) */}
                        {!editingCampaign && (
                            <div className="space-y-2 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                                    Quick Presets (Click to Auto-fill):
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {PRESET_CAMPAIGNS.map((p) => (
                                        <button
                                            key={p.slug}
                                            type="button"
                                            onClick={() => handleSelectPreset(p)}
                                            className="p-2 bg-white rounded-xl border border-emerald-200/80 hover:border-emerald-400 text-left transition-all text-xs group cursor-pointer"
                                        >
                                            <span className="block font-bold text-gray-900 truncate group-hover:text-emerald-700">
                                                {p.title}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono block truncate">
                                                {p.path}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSaveCampaign} className="space-y-5 text-xs">
                            {/* Target Audience 3 Cards */}
                            <div className="space-y-2">
                                <label className="block font-bold text-gray-800 text-xs">
                                    Portal Availability (Who should see it in their sidebar?) *
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Option 1: ALL */}
                                    <div
                                        onClick={() => setCAudience("ALL")}
                                        className={cn(
                                            "cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between",
                                            cAudience === "ALL"
                                                ? "border-emerald-600 bg-emerald-50/60 shadow-xs"
                                                : "border-gray-200 hover:border-gray-300 bg-white"
                                        )}
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center",
                                                    cAudience === "ALL" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                                                )}>
                                                    <Users size={16} />
                                                </div>
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                                    Recommended
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-xs pt-1">
                                                Both Units & Sectors
                                            </h4>
                                            <p className="text-[11px] text-gray-500 leading-snug">
                                                Visible to all Sectors and Units in their sidebar (e.g. <strong>Payasam Challenge</strong>).
                                            </p>
                                        </div>
                                        <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                                            {cAudience === "ALL" && <Check size={14} />}
                                            <span>{cAudience === "ALL" ? "Selected" : "Select"}</span>
                                        </div>
                                    </div>

                                    {/* Option 2: SECTOR_ONLY */}
                                    <div
                                        onClick={() => setCAudience("SECTOR_ONLY")}
                                        className={cn(
                                            "cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between",
                                            cAudience === "SECTOR_ONLY"
                                                ? "border-purple-600 bg-purple-50/60 shadow-xs"
                                                : "border-gray-200 hover:border-gray-300 bg-white"
                                        )}
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center",
                                                    cAudience === "SECTOR_ONLY" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"
                                                )}>
                                                    <Building2 size={16} />
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-xs pt-1">
                                                Sectors Only
                                            </h4>
                                            <p className="text-[11px] text-gray-500 leading-snug">
                                                Visible only in Sector sidebars. Units will not see this in their sidebar.
                                            </p>
                                        </div>
                                        <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
                                            {cAudience === "SECTOR_ONLY" && <Check size={14} />}
                                            <span>{cAudience === "SECTOR_ONLY" ? "Selected" : "Select"}</span>
                                        </div>
                                    </div>

                                    {/* Option 3: UNIT_ONLY */}
                                    <div
                                        onClick={() => setCAudience("UNIT_ONLY")}
                                        className={cn(
                                            "cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between",
                                            cAudience === "UNIT_ONLY"
                                                ? "border-amber-600 bg-amber-50/60 shadow-xs"
                                                : "border-gray-200 hover:border-gray-300 bg-white"
                                        )}
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center",
                                                    cAudience === "UNIT_ONLY" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600"
                                                )}>
                                                    <Layers size={16} />
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-xs pt-1">
                                                Units Only
                                            </h4>
                                            <p className="text-[11px] text-gray-500 leading-snug">
                                                Visible only in Unit sidebars.
                                            </p>
                                        </div>
                                        <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                                            {cAudience === "UNIT_ONLY" && <Check size={14} />}
                                            <span>{cAudience === "UNIT_ONLY" ? "Selected" : "Select"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">
                                    Campaign Title *
                                </label>
                                <input
                                    type="text"
                                    value={cTitle}
                                    onChange={(e) => setCTitle(e.target.value)}
                                    placeholder="e.g. Payasam Challenge 2026 or Sahithyotsav"
                                    required
                                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-sans"
                                />
                            </div>

                            {/* Path and Icon */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Portal Route Path *
                                    </label>
                                    <input
                                        type="text"
                                        value={cPath}
                                        onChange={(e) => setCPath(e.target.value)}
                                        placeholder="e.g. /portal/payasam-challenge"
                                        required
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl font-mono text-emerald-800"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Sidebar Icon
                                    </label>
                                    <select
                                        value={cIcon}
                                        onChange={(e) => setCIcon(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        <option value="Droplets">🍯 Droplets (Payasam Challenge)</option>
                                        <option value="Trophy">🏆 Trophy (Sahithyotsav)</option>
                                        <option value="Heart">❤️ Heart (Relief Drive)</option>
                                        <option value="Users">👥 Users (Membership)</option>
                                        <option value="Target">🎯 Target (Challenges / Goals)</option>
                                        <option value="Layers">📑 Layers (General)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Category & Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={cCategory}
                                        onChange={(e) => setCCategory(e.target.value)}
                                        placeholder="e.g. Challenge, Relief, Sahithyotsav"
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Sidebar Status</label>
                                    <select
                                        value={cStatus}
                                        onChange={(e) => setCStatus(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        <option value="ACTIVE">🟢 Active (Visible in Portal Sidebar)</option>
                                        <option value="INACTIVE">⚪ Inactive (Hidden from Sidebar)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">
                                    Description & Guidelines
                                </label>
                                <textarea
                                    rows={3}
                                    value={cDescription}
                                    onChange={(e) => setCDescription(e.target.value)}
                                    placeholder="Brief description or guidelines for this campaign..."
                                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-sans"
                                />
                            </div>

                            {/* Footer Buttons */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingCampaign}
                                    className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    {savingCampaign && <Loader2 size={14} className="animate-spin" />}
                                    <span>{savingCampaign ? "Saving..." : "Save to Portal"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
