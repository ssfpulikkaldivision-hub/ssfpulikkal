"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Building2,
    Users,
    Phone,
    UserCheck,
    ArrowRight,
    Loader2,
    Shield,
    Calendar,
    ChevronRight,
    Search,
    Layers,
    Target,
    CheckCircle2,
    Clock,
    Droplets,
    Trophy,
    HeartHandshake
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSSF } from "@/lib/ssf-formatter";

interface UserEntity {
    id: string;
    type: "DIVISION" | "SECTOR" | "UNIT";
    name: string;
    code: string | null;
    username: string;
    sectorId?: string;
    sectorName?: string;
    notes?: string | null;
    sectorsCount?: number;
    sectors?: Array<{
        id: string;
        name: string;
        code: string | null;
        username?: string | null;
        unitsCount: number;
    }>;
    unitsCount?: number;
    units?: Array<{
        id: string;
        name: string;
        code: string | null;
        sectorName?: string;
        username?: string | null;
    }>;
}

interface CampaignItem {
    id: string;
    title: string;
    category: string;
    status: string;
    endDate: string | null;
    targetValue: number | null;
    targetUnit: string | null;
    isSubmitted: boolean;
    description: string;
    slug?: string;
    attachmentUrl?: string | null;
}

export default function PortalDashboard() {
    const [entity, setEntity] = useState<UserEntity | null>(null);
    const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [meRes, campRes] = await Promise.all([
                    fetch("/api/portal/auth/me"),
                    fetch("/api/portal/campaigns"),
                ]);

                if (meRes.ok) {
                    const data = await meRes.json();
                    setEntity(data.entity);
                }

                if (campRes.ok) {
                    const cData = await campRes.json();
                    setCampaigns(cData.campaigns || []);
                }
            } catch (err) {
                console.error("Failed to load entity details", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
                <Loader2 size={28} className="animate-spin text-emerald-600 mb-2" />
                <p className="text-xs text-gray-500 font-medium">Loading portal...</p>
            </div>
        );
    }

    if (!entity) return null;

    const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");

    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Top Welcome Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                                entity.type === "DIVISION"
                                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                                    : entity.type === "SECTOR"
                                        ? "bg-purple-100 text-purple-700"
                                        : "bg-emerald-100 text-emerald-800"
                            )}
                        >
                            {entity.type}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-sans tracking-tight">
                        Welcome, {formatSSF(entity.name)}!
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500">
                        {entity.type === "DIVISION"
                            ? "Division Headquarters administration, monitoring, and program dashboard."
                            : entity.type === "SECTOR"
                                ? "Manage your sector details, monitor affiliated units, and submit program reports."
                                : `Affiliated under ${entity.sectorName || "Pulikkal"} Sector.`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">

                    {entity.type !== "UNIT" && (
                        <Link
                            href="/portal/entities"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
                        >
                            <Building2 size={15} />
                            <span>{entity.type === "SECTOR" ? "Units" : "Entities"}</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Active Programs</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <Layers size={16} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-extrabold text-gray-900">{activeCampaigns.length}</div>
                        <p className="text-[11px] text-gray-400 mt-0.5">Open for your entity</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Submitted Reports</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-extrabold text-gray-900">
                            {campaigns.filter((c) => c.isSubmitted).length}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">Completed submissions</p>
                    </div>
                </div>

                {entity.type === "DIVISION" ? (
                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">Total Sectors</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                                <Building2 size={16} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-extrabold text-gray-900">
                                {entity.sectorsCount || entity.sectors?.length || 8}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">Sectors under Division</p>
                        </div>
                    </div>
                ) : entity.type === "SECTOR" ? (
                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">Affiliated Units</span>
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                                <Users size={16} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-extrabold text-gray-900">
                                {entity.unitsCount || entity.units?.length || 0}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">Units under {entity.name}</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">Parent Sector</span>
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                                <Building2 size={16} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-lg font-bold text-gray-900 truncate">
                                {entity.sectorName || "Pulikkal"}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">Division Jurisdiction</p>
                        </div>
                    </div>
                )}

                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Portal Username</span>
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                            <UserCheck size={16} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-sm font-mono font-bold text-gray-900 truncate">
                            {entity.username}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">Active Entity Login</p>
                    </div>
                </div>
            </div>

            {/* Active Programs Section */}
            {activeCampaigns.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-950 font-sans tracking-tight">
                            Active Programs
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Programs and campaigns available for your entity
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        {/* Dynamic Active Campaigns */}
                        {activeCampaigns.map((camp) => {
                            const href =
                                camp.attachmentUrl ||
                                (camp.slug?.includes("payasam")
                                    ? "/portal/payasam-challenge"
                                    : `/portal/campaigns/${camp.id}`);

                            const getIcon = () => {
                                const key = (camp.slug + " " + camp.title).toLowerCase();
                                if (key.includes("payasam")) return <Droplets size={20} className="text-emerald-700" />;
                                if (key.includes("sahithyotsav")) return <Trophy size={20} className="text-emerald-700" />;
                                if (key.includes("relief")) return <HeartHandshake size={20} className="text-emerald-700" />;
                                if (key.includes("membership")) return <Users size={20} className="text-emerald-700" />;
                                return <Layers size={20} className="text-emerald-700" />;
                            };

                            return (
                                <Link
                                    key={camp.id}
                                    href={href}
                                    className="bg-white rounded-2xl p-6 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col justify-between"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#ebf6ee] text-[#1b7a42] flex items-center justify-center shrink-0">
                                            {getIcon()}
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-gray-100/90 text-gray-500">
                                            {camp.category || "General"}
                                        </span>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                                            {camp.title}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-1 leading-relaxed">
                                            {camp.description}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* If Division: List of Sectors */}
            {entity.type === "DIVISION" && entity.sectors && entity.sectors.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 font-sans">
                                {formatSSF("Sectors in SSF Pulikkal Division")}
                            </h2>
                            <p className="text-xs text-gray-400">
                                {entity.sectors.length} sectors and {entity.unitsCount || 0} affiliated units
                            </p>
                        </div>
                        <Link
                            href="/portal/entities"
                            className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                            <span>View All Entities</span>
                            <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/50">
                                    <th className="py-2.5 px-3">Sector Name</th>
                                    <th className="py-2.5 px-3">Code</th>
                                    <th className="py-2.5 px-3">Units Count</th>
                                    <th className="py-2.5 px-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {entity.sectors.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50/60">
                                        <td className="py-3 px-3 font-bold text-gray-900">{s.name}</td>
                                        <td className="py-3 px-3 font-mono text-gray-500">#{s.code || s.username || "-"}</td>
                                        <td className="py-3 px-3">
                                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-700">
                                                {s.unitsCount} Units
                                            </span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                                                ACTIVE
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* If Sector: List of Units Preview */}
            {entity.type === "SECTOR" && entity.units && entity.units.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 font-sans">
                                Units in {entity.name} Sector
                            </h2>
                            <p className="text-xs text-gray-400">
                                {entity.units.length} registered units under this sector
                            </p>
                        </div>
                        <Link
                            href="/portal/entities"
                            className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                            <span>Manage All Units</span>
                            <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/50">
                                    <th className="py-2.5 px-3">Unit Name</th>
                                    <th className="py-2.5 px-3">Code</th>
                                    <th className="py-2.5 px-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {entity.units.slice(0, 5).map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/60">
                                        <td className="py-3 px-3 font-bold text-gray-900">{u.name}</td>
                                        <td className="py-3 px-3 font-mono text-gray-400">#{u.code || "-"}</td>
                                        <td className="py-3 px-3">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                                                ACTIVE
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
