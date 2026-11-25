"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Building2,
    Search,
    Loader2,
    Copy,
    Check,
    Layers,
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    MessageCircle,
    Eye,
    EyeOff,
    X,
    Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildWhatsAppShareUrl } from "@/lib/payasam";
import { formatSSF } from "@/lib/ssf-formatter";

interface UnitItem {
    id: string;
    name: string;
    code: string | null;
    username: string | null;
    password?: string | null;
    presidentName?: string | null;
    presidentMobile?: string | null;
    secretaryName?: string | null;
    secretaryMobile?: string | null;
    sectorId?: string;
    sectorName?: string;
    notes?: string | null;
}

interface SectorItem {
    id: string;
    name: string;
    code: string | null;
    username?: string | null;
    password?: string | null;
    presidentName?: string | null;
    presidentMobile?: string | null;
    secretaryName?: string | null;
    secretaryMobile?: string | null;
    unitsCount: number;
}

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
    sectors?: SectorItem[];
    unitsCount?: number;
    units?: UnitItem[];
}

export default function PortalEntitiesPage() {
    const router = useRouter();
    const [entity, setEntity] = useState<UserEntity | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
    const [viewingUnit, setViewingUnit] = useState<UnitItem | null>(null);

    useEffect(() => {
        async function fetchEntities() {
            try {
                const res = await fetch("/api/portal/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    if (data.entity?.type === "UNIT") {
                        router.replace("/portal");
                        return;
                    }
                    setEntity(data.entity);

                    if (data.entity?.type === "DIVISION" && typeof window !== "undefined") {
                        const params = new URLSearchParams(window.location.search);
                        const sec = params.get("sectorId");
                        if (sec) setSelectedSectorId(sec);
                    }
                }
            } catch (err) {
                console.error("Failed to load entity details", err);
            } finally {
                setLoading(false);
            }
        }

        fetchEntities();

        const handlePopState = () => {
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                setSelectedSectorId(params.get("sectorId"));
            }
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [router]);

    const handleSelectSector = (id: string | null) => {
        setSelectedSectorId(id);
        setSearchQuery("");
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (id) {
                url.searchParams.set("sectorId", id);
            } else {
                url.searchParams.delete("sectorId");
            }
            window.history.pushState({}, "", url.toString());
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const togglePassword = (id: string) => {
        setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const getOrigin = () =>
        typeof window !== "undefined" ? window.location.origin : "";

    const buildUnitDetailsText = (unit: UnitItem, sectorDisplayName: string) => {
        const origin = getOrigin();
        const portalUrl = origin ? `${origin}/portal/login` : "/portal/login";

        const lines = [
            `*SSF Pulikkal Division - Unit Details*`,
            `Unit: *${unit.name}*`,
            `Sector: ${sectorDisplayName} Sector`,
            unit.code ? `Code: #${unit.code}` : null,
            ``,
            `*Portal Login:*`,
            `URL: ${portalUrl}`,
            unit.username ? `Username: \`${unit.username}\`` : null,
            unit.password ? `Password: \`${unit.password}\`` : null,
        ].filter((l) => l !== null);

        return lines.join("\n");
    };

    const buildSectorDetailsText = (sector: SectorItem) => {
        const origin = getOrigin();
        const portalUrl = origin ? `${origin}/portal/login` : "/portal/login";
        const lines = [
            `*SSF Pulikkal Division - Sector Details*`,
            `Sector: *${sector.name}*`,
            sector.code ? `Code: #${sector.code}` : null,
            `Affiliated Units: ${sector.unitsCount}`,
            ``,
            `*Portal Login:*`,
            `URL: ${portalUrl}`,
            sector.username ? `Username: \`${sector.username}\`` : null,
            sector.password ? `Password: \`${sector.password}\`` : null,
        ].filter((l) => l !== null);

        return lines.join("\n");
    };

    const buildUnitsListShareText = (units: UnitItem[], sectorDisplayName: string) => {
        const lines = units.map((u, idx) => {
            const creds = u.username
                ? ` (User: ${u.username}${u.password ? ` / Pass: ${u.password}` : ""})`
                : "";
            return `${idx + 1}. *${u.name}*${creds}`;
        });

        return [
            `*${sectorDisplayName} Sector - Units List*`,
            `Total Units: ${units.length}`,
            ``,
            ...(lines.length > 0 ? lines : ["No units registered yet."]),
        ].join("\n");
    };

    const filteredSectors = useMemo(() => {
        if (!entity?.sectors) return [];
        const query = searchQuery.toLowerCase().trim();
        return entity.sectors.filter((s) => {
            if (!query) return true;
            return (
                s.name.toLowerCase().includes(query) ||
                (s.code && s.code.toLowerCase().includes(query)) ||
                (s.username && s.username.toLowerCase().includes(query))
            );
        });
    }, [entity?.sectors, searchQuery]);

    const activeSector = useMemo(() => {
        if (!entity) return null;
        if (entity.type === "SECTOR") {
            return entity.sectors?.[0] || { id: entity.id, name: entity.name, code: entity.code, unitsCount: entity.units?.length || 0 };
        }
        if (!selectedSectorId || !entity.sectors) return null;
        return (
            entity.sectors.find(
                (s) =>
                    s.id === selectedSectorId ||
                    s.name.toLowerCase() === selectedSectorId.toLowerCase()
            ) || null
        );
    }, [entity, selectedSectorId]);

    const filteredUnits = useMemo(() => {
        if (!entity?.units) return [];
        const query = searchQuery.toLowerCase().trim();

        return entity.units.filter((u) => {
            if (entity.type === "DIVISION" && selectedSectorId) {
                const matchesSector =
                    u.sectorId === selectedSectorId ||
                    u.sectorName === selectedSectorId ||
                    (activeSector &&
                        (u.sectorId === activeSector.id || u.sectorName === activeSector.name));
                if (!matchesSector) return false;
            }

            if (!query) return true;
            return (
                u.name.toLowerCase().includes(query) ||
                (u.code && u.code.toLowerCase().includes(query)) ||
                (u.username && u.username.toLowerCase().includes(query)) ||
                (u.secretaryName && u.secretaryName.toLowerCase().includes(query)) ||
                (u.presidentName && u.presidentName.toLowerCase().includes(query))
            );
        });
    }, [entity, selectedSectorId, activeSector, searchQuery]);

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
                <Loader2 size={28} className="animate-spin text-emerald-600 mb-2" />
                <p className="text-xs text-gray-500 font-medium">Loading units...</p>
            </div>
        );
    }

    if (!entity || entity.type === "UNIT") {
        return null;
    }

    // =========================================================================
    // UNITS LIST VIEW:
    // - Always shown directly when logged in as SECTOR
    // - Shown when a Sector is clicked in DIVISION view
    // =========================================================================
    if (entity.type === "SECTOR" || selectedSectorId) {
        const sectorDisplayName = activeSector ? activeSector.name : entity.name;
        const allUnitsListText = buildUnitsListShareText(filteredUnits, sectorDisplayName);

        return (
            <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Division breadcrumb when inspecting a sector */}
                {entity.type === "DIVISION" && (
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => handleSelectSector(null)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 border border-gray-200/80 bg-white transition-all shadow-2xs cursor-pointer"
                        >
                            <ArrowLeft size={14} />
                            <span>Back to All Sectors</span>
                        </button>

                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <span
                                onClick={() => handleSelectSector(null)}
                                className="hover:text-emerald-700 cursor-pointer"
                            >
                                Entities
                            </span>
                            <ChevronRight size={12} />
                            <span className="text-emerald-800 font-semibold">{sectorDisplayName} Sector</span>
                            <ChevronRight size={12} />
                            <span className="text-gray-600">Units</span>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl font-black text-gray-950 font-sans tracking-tight flex items-center gap-2.5">
                                <Building2 className="text-emerald-700" size={24} />
                                <span>{sectorDisplayName} Sector — Units</span>
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                {filteredUnits.length} {filteredUnits.length === 1 ? "Unit" : "Units"}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            View unit details, copy credentials or contact info, and send directly on WhatsApp.
                        </p>
                    </div>

                    {filteredUnits.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleCopy(allUnitsListText, "all-units")}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                            >
                                {copiedId === "all-units" ? (
                                    <Check size={14} className="text-emerald-600" />
                                ) : (
                                    <Copy size={14} />
                                )}
                                <span>
                                    {copiedId === "all-units" ? "List Copied!" : "Copy All Units"}
                                </span>
                            </button>

                            <a
                                href={buildWhatsAppShareUrl(allUnitsListText)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                            >
                                <MessageCircle size={14} />
                                <span>Send List on WhatsApp</span>
                            </a>
                        </div>
                    )}
                </div>

                {/* Search Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search unit by name, code, username, or leader..."
                            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-sans"
                        />
                    </div>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 cursor-pointer"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Units List Table */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
                    {filteredUnits.length === 0 ? (
                        <div className="p-12 text-center">
                            <Building2 size={36} className="mx-auto text-gray-300 mb-2" />
                            <h3 className="font-bold text-gray-700 text-sm">No Units Found</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {searchQuery
                                    ? "No units matched your search query."
                                    : `No units registered under ${sectorDisplayName} Sector yet.`}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/70">
                                        <th className="py-3.5 px-4 w-10">#</th>
                                        <th className="py-3.5 px-4">Unit Name</th>
                                        <th className="py-3.5 px-4">Username</th>
                                        <th className="py-3.5 px-4">Password</th>
                                        <th className="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUnits.map((unit, idx) => {
                                        const isPwShown = !!revealedPasswords[unit.id];
                                        const detailsText = buildUnitDetailsText(unit, sectorDisplayName);

                                        return (
                                            <tr key={unit.id} className="hover:bg-gray-50/70">
                                                <td className="py-3.5 px-4 text-gray-400 font-mono">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingUnit(unit)}
                                                        className="text-left group cursor-pointer"
                                                    >
                                                        <div className="font-bold text-gray-950 text-sm group-hover:text-emerald-700 transition-colors">
                                                            {unit.name}
                                                        </div>
                                                        {unit.code && (
                                                            <div className="text-[11px] font-mono text-gray-400">
                                                                #{unit.code}
                                                            </div>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {unit.username ? (
                                                        <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                                                            {unit.username}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {unit.password ? (
                                                        <div className="inline-flex items-center gap-1.5">
                                                            <span className="font-mono text-gray-700">
                                                                {isPwShown ? unit.password : "••••••••"}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => togglePassword(unit.id)}
                                                                className="p-1 text-gray-400 hover:text-gray-700 rounded cursor-pointer"
                                                                title={isPwShown ? "Hide password" : "Show password"}
                                                            >
                                                                {isPwShown ? <EyeOff size={13} /> : <Eye size={13} />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingUnit(unit)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold transition-colors cursor-pointer"
                                                            title="View full unit details"
                                                        >
                                                            <Eye size={13} />
                                                            <span>Details</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(detailsText, `copy-${unit.id}`)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-colors cursor-pointer"
                                                            title="Copy unit details"
                                                        >
                                                            {copiedId === `copy-${unit.id}` ? (
                                                                <>
                                                                    <Check size={13} className="text-emerald-600" />
                                                                    <span className="text-emerald-700">Copied</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy size={13} />
                                                                    <span>Copy</span>
                                                                </>
                                                            )}
                                                        </button>

                                                        <a
                                                            href={buildWhatsAppShareUrl(detailsText)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 font-semibold transition-colors"
                                                            title="Send unit details on WhatsApp"
                                                        >
                                                            <MessageCircle size={13} />
                                                            <span>WhatsApp</span>
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Unit Details Modal */}
                {viewingUnit && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                        Unit Details
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-950">
                                        {viewingUnit.name}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        {sectorDisplayName} Sector {viewingUnit.code ? `· #${viewingUnit.code}` : ""}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setViewingUnit(null)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-5 space-y-4 text-xs">
                                {/* Credentials Box */}
                                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2.5">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                        <Key size={13} className="text-emerald-700" />
                                        <span>Portal Login Credentials</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Username:</span>
                                        <span className="font-mono font-bold text-gray-900">
                                            {viewingUnit.username || "-"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Password:</span>
                                        <span className="font-mono font-bold text-gray-900">
                                            {viewingUnit.password || "-"}
                                        </span>
                                    </div>
                                </div>

                                {viewingUnit.notes && (
                                    <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="font-semibold text-gray-700">Notes: </span>
                                        {viewingUnit.notes}
                                    </div>
                                )}
                            </div>

                            <div className="p-5 pt-0 flex flex-col sm:flex-row items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCopy(
                                            buildUnitDetailsText(viewingUnit, sectorDisplayName),
                                            "modal-copy"
                                        )
                                    }
                                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {copiedId === "modal-copy" ? (
                                        <Check size={14} className="text-emerald-600" />
                                    ) : (
                                        <Copy size={14} />
                                    )}
                                    <span>
                                        {copiedId === "modal-copy" ? "Copied Details!" : "Copy Unit Details"}
                                    </span>
                                </button>

                                <a
                                    href={buildWhatsAppShareUrl(
                                        buildUnitDetailsText(viewingUnit, sectorDisplayName)
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                                >
                                    <MessageCircle size={14} />
                                    <span>Send on WhatsApp</span>
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // =========================================================================
    // DIVISION VIEW: Sectors shown as a clean LIST (table), not tiles
    // =========================================================================
    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-950 font-sans tracking-tight flex items-center gap-2.5">
                        <Building2 className="text-emerald-700" size={26} />
                        <span>Entities & Sectors</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        {formatSSF("Sectors under SSF Pulikkal Division. Click any sector to inspect its units.")}
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                        Sectors: {entity.sectors?.length || 0}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                        Total Units: {entity.units?.length || 0}
                    </span>
                </div>
            </div>

            {/* Search Bar for Sectors */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-3">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search sector by name, code, or username..."
                        className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-sans"
                    />
                </div>
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 cursor-pointer"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Sectors List Table */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
                {filteredSectors.length === 0 ? (
                    <div className="p-12 text-center">
                        <Layers size={36} className="mx-auto text-gray-300 mb-2" />
                        <h3 className="font-bold text-gray-700 text-sm">No Sectors Found</h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Try searching with a different sector name.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/70">
                                    <th className="py-3.5 px-4 w-10">#</th>
                                    <th className="py-3.5 px-4">Sector Name</th>
                                    <th className="py-3.5 px-4">Username</th>
                                    <th className="py-3.5 px-4">Password</th>
                                    <th className="py-3.5 px-4">Affiliated Units</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSectors.map((sector, idx) => {
                                    const isPwShown = !!revealedPasswords[sector.id];
                                    const sectorText = buildSectorDetailsText(sector);

                                    return (
                                        <tr key={sector.id} className="hover:bg-gray-50/70">
                                            <td className="py-3.5 px-4 text-gray-400 font-mono">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectSector(sector.id)}
                                                    className="text-left group cursor-pointer"
                                                >
                                                    <div className="font-bold text-gray-950 text-sm group-hover:text-emerald-700 transition-colors">
                                                        {sector.name} Sector
                                                    </div>
                                                    {sector.code && (
                                                        <div className="text-[11px] font-mono text-gray-400">
                                                            #{sector.code}
                                                        </div>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {sector.username ? (
                                                    <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                                                        {sector.username}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {sector.password ? (
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <span className="font-mono text-gray-700">
                                                            {isPwShown ? sector.password : "••••••••"}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePassword(sector.id)}
                                                            className="p-1 text-gray-400 hover:text-gray-700 rounded cursor-pointer"
                                                            title={isPwShown ? "Hide password" : "Show password"}
                                                        >
                                                            {isPwShown ? <EyeOff size={13} /> : <Eye size={13} />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                                                    {sector.unitsCount} Units
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(sectorText, `copy-${sector.id}`)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer"
                                                    >
                                                        {copiedId === `copy-${sector.id}` ? (
                                                            <>
                                                                <Check size={13} className="text-emerald-600" />
                                                                <span className="text-emerald-700">Copied</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={13} />
                                                                <span>Copy</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <a
                                                        href={buildWhatsAppShareUrl(sectorText)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 font-semibold"
                                                    >
                                                        <MessageCircle size={13} />
                                                        <span>WhatsApp</span>
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectSector(sector.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
                                                    >
                                                        <span>Units</span>
                                                        <ArrowRight size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
