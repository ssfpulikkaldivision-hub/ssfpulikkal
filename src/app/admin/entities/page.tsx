"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Building2,
    Layers,
    Plus,
    Search,
    Trash2,
    Edit3,
    Key,
    Eye,
    EyeOff,
    Copy,
    Check,
    FileSpreadsheet,
    ChevronDown,
    ChevronRight,
    Loader2,
    X,
    FolderPlus,
    AlertCircle,
    FileUp,
    Download,
    Upload,
    Table,
    MoreVertical,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Official WhatsApp SVG icon
const WhatsAppIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

interface Unit {
    id: string;
    name: string;
    code: string | null;
    sectorId: string;
    username: string | null;
    password: string | null;
    notes: string | null;
    createdAt: string;
}

interface Sector {
    id: string;
    name: string;
    code: string | null;
    username: string | null;
    password: string | null;
    notes: string | null;
    units: Unit[];
    createdAt: string;
}

interface DetailsEntity {
    type: "sector" | "unit";
    name: string;
    sectorName?: string;
    sectorId: string;
    username: string;
    password: string;
}

interface CsvPreviewItem {
    sectorName?: string;
    unitName?: string;
    sectorId?: string;
    username: string;
    password: string;
}

// Client-side quick CSV parser for live preview
function parseClientCSV(
    text: string,
    mode: "sectors" | "units"
): { items: CsvPreviewItem[]; sectorsCount: number } {
    const lines = text
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    if (lines.length === 0) return { items: [], sectorsCount: 0 };

    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader =
        firstLineLower.includes("sector") ||
        firstLineLower.includes("unit") ||
        firstLineLower.includes("name") ||
        firstLineLower.includes("user");

    if (hasHeader) {
        startIndex = 1;
    }

    const items: CsvPreviewItem[] = [];
    const uniqueSectors = new Set<string>();

    if (mode === "sectors") {
        for (let i = startIndex; i < lines.length; i++) {
            const parts = lines[i].split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
            const sectorName = parts[0]?.trim();
            if (sectorName) {
                uniqueSectors.add(sectorName.toLowerCase());
                const clean = sectorName.toLowerCase().replace(/[^a-z0-9]/g, "_");
                const username = parts[1]?.trim() || `sec_${clean}`;
                const password = parts[2]?.trim() || `SSF@${sectorName.replace(/\s+/g, "")}26`;
                items.push({
                    sectorName,
                    username,
                    password,
                });
            }
        }
    } else {
        // units mode: Unit Name, Sector ID, Username, Password
        for (let i = startIndex; i < lines.length; i++) {
            const parts = lines[i].split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
            const unitName = parts[0]?.trim();
            const sectorId = parts[1]?.trim();
            if (unitName && sectorId) {
                uniqueSectors.add(sectorId.toLowerCase());
                const clean = unitName.toLowerCase().replace(/[^a-z0-9]/g, "_");
                const username = parts[2]?.trim() || `unit_${clean}`;
                const password = parts[3]?.trim() || `SSF@${unitName.replace(/\s+/g, "")}26`;
                items.push({
                    unitName,
                    sectorId,
                    username,
                    password,
                });
            }
        }
    }

    return { items, sectorsCount: uniqueSectors.size };
}

export default function EntitiesManagement() {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
    const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
    const [showPasswords, setShowPasswords] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Initial load and URL param reading
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const sec = params.get("sectorId");
            if (sec) setSelectedSectorId(sec);
        }

        const handlePopState = () => {
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                setSelectedSectorId(params.get("sectorId"));
            }
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

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

    // Toast Messages
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Details & WhatsApp Modal State
    const [detailsEntity, setDetailsEntity] = useState<DetailsEntity | null>(null);
    const [detailsTargetPhone, setDetailsTargetPhone] = useState<string>("");

    // 3-Dots Dropdown menu state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Modal States
    const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
    const [editingSector, setEditingSector] = useState<Sector | null>(null);

    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [preselectedSectorId, setPreselectedSectorId] = useState<string>("");

    const [isBulkUnitModalOpen, setIsBulkUnitModalOpen] = useState(false);
    const [bulkSectorId, setBulkSectorId] = useState<string>("");
    const [bulkUnitNames, setBulkUnitNames] = useState<string>("");

    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // CSV Import State
    const [isImportCsvModalOpen, setIsImportCsvModalOpen] = useState(false);
    const [csvImportMode, setCsvImportMode] = useState<"sectors" | "units">("sectors");
    const [csvInputMethod, setCsvInputMethod] = useState<"file" | "paste">("file");
    const [csvRawText, setCsvRawText] = useState("");
    const [csvFileName, setCsvFileName] = useState("");
    const [isDraggingCsv, setIsDraggingCsv] = useState(false);
    const csvFileInputRef = useRef<HTMLInputElement>(null);

    // Form data for Sector (Sector Name, Username, Password)
    const [sectorForm, setSectorForm] = useState({
        name: "",
        username: "",
        password: "",
        notes: "",
    });

    // Form data for Unit (Unit Name, Sector ID, Username, Password)
    const [unitForm, setUnitForm] = useState({
        name: "",
        sectorId: "",
        username: "",
        password: "",
        notes: "",
    });

    // Close any open 3-dots dropdown when clicking outside
    useEffect(() => {
        const handleGlobalClick = () => setOpenMenuId(null);
        window.addEventListener("click", handleGlobalClick);
        return () => window.removeEventListener("click", handleGlobalClick);
    }, []);

    // Fetch Entities
    const fetchEntities = async () => {
        try {
            const res = await fetch("/api/entities");
            const data = await res.json();
            if (data.sectors) {
                setSectors(data.sectors);
                // Expand all by default if <= 10 sectors
                if (data.sectors.length <= 10) {
                    setExpandedSectors(new Set(data.sectors.map((s: Sector) => s.id)));
                }
            }
        } catch (error) {
            console.error("Failed to load entities:", error);
            setErrorMessage("Failed to load sectors and units.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntities();
    }, []);

    // Toggle expand/collapse sector
    const toggleSectorExpand = (id: string) => {
        setExpandedSectors((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Copy to clipboard helper
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Open Details Modal for Sector
    const openSectorDetails = (sector: Sector) => {
        setDetailsEntity({
            type: "sector",
            name: sector.name,
            sectorId: sector.code || sector.id,
            username: sector.username || "",
            password: sector.password || "",
        });
        setDetailsTargetPhone("");
    };

    // Open Details Modal for Unit
    const openUnitDetails = (unit: Unit, sector: Sector) => {
        setDetailsEntity({
            type: "unit",
            name: unit.name,
            sectorName: sector.name,
            sectorId: sector.code || sector.id,
            username: unit.username || "",
            password: unit.password || "",
        });
        setDetailsTargetPhone("");
    };

    // Format WhatsApp message
    const getWhatsAppMessage = (entity: DetailsEntity) => {
        const origin = typeof window !== "undefined" ? window.location.origin : "https://ssf-pulikkal.pages.dev";
        const portalUrl = `${origin}/login`;

        if (entity.type === "sector") {
            return (
                `*SSF PULIKKAL DIVISION - PORTAL LOGIN*\n\n` +
                `📁 *Sector:* ${entity.name}\n` +
                `🆔 *Sector ID:* ${entity.sectorId}\n` +
                `👤 *Username:* ${entity.username || "N/A"}\n` +
                `🔑 *Password:* ${entity.password || "N/A"}\n\n` +
                `🌐 *Portal Login:* ${portalUrl}\n\n` +
                `_Please keep these credentials secure._`
            );
        } else {
            return (
                `*SSF PULIKKAL DIVISION - PORTAL LOGIN*\n\n` +
                `🏢 *Unit:* ${entity.name}\n` +
                `👤 *Username:* ${entity.username || "N/A"}\n` +
                `🔑 *Password:* ${entity.password || "N/A"}\n\n` +
                `🌐 *Portal Login:* ${portalUrl}\n\n` +
                `_Please keep these credentials secure._`
            );
        }
    };

    // Send directly to WhatsApp
    const handleSendWhatsApp = (entity: DetailsEntity, phone?: string) => {
        const text = getWhatsAppMessage(entity);
        const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
        let url = "";
        if (cleanPhone.length >= 10) {
            const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(text)}`;
        } else {
            url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        }
        window.open(url, "_blank");
    };

    // Open Add Sector
    const openAddSector = () => {
        setEditingSector(null);
        setSectorForm({
            name: "",
            username: "",
            password: "",
            notes: "",
        });
        setIsSectorModalOpen(true);
    };

    // Open Edit Sector
    const openEditSector = (sector: Sector) => {
        setEditingSector(sector);
        setSectorForm({
            name: sector.name,
            username: sector.username || "",
            password: sector.password || "",
            notes: sector.notes || "",
        });
        setIsSectorModalOpen(true);
    };

    // Open Add Unit
    const openAddUnit = (defaultSectorId?: string) => {
        setEditingUnit(null);
        const targetSec = defaultSectorId || sectors[0]?.id || "";
        setPreselectedSectorId(targetSec);
        setUnitForm({
            name: "",
            sectorId: targetSec,
            username: "",
            password: "",
            notes: "",
        });
        setIsUnitModalOpen(true);
    };

    // Open Edit Unit
    const openEditUnit = (unit: Unit) => {
        setEditingUnit(unit);
        setUnitForm({
            name: unit.name,
            sectorId: unit.sectorId,
            username: unit.username || "",
            password: unit.password || "",
            notes: unit.notes || "",
        });
        setIsUnitModalOpen(true);
    };

    // Open Bulk Add Units
    const openBulkAddUnits = (sectorId?: string) => {
        setBulkSectorId(sectorId || sectors[0]?.id || "");
        setBulkUnitNames("");
        setIsBulkUnitModalOpen(true);
    };

    // Save Sector (Create or Update)
    const handleSaveSector = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectorForm.name.trim()) {
            alert("Sector name is required.");
            return;
        }

        setSubmitting(true);
        try {
            const url = editingSector
                ? `/api/entities/sectors/${editingSector.id}`
                : "/api/entities/sectors";
            const method = editingSector ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sectorForm),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save sector");

            setSuccessMessage(
                editingSector ? "Sector updated successfully!" : "Sector created successfully!"
            );
            setTimeout(() => setSuccessMessage(""), 4000);
            setIsSectorModalOpen(false);
            await fetchEntities();
        } catch (err: any) {
            alert(err.message || "Error saving sector");
        } finally {
            setSubmitting(false);
        }
    };

    // Save Unit (Create or Update)
    const handleSaveUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unitForm.name.trim()) {
            alert("Unit name is required.");
            return;
        }
        if (!unitForm.sectorId) {
            alert("Please select a sector.");
            return;
        }

        setSubmitting(true);
        try {
            const url = editingUnit
                ? `/api/entities/units/${editingUnit.id}`
                : "/api/entities/units";
            const method = editingUnit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(unitForm),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save unit");

            setSuccessMessage(
                editingUnit ? "Unit updated successfully!" : "Unit created successfully!"
            );
            setTimeout(() => setSuccessMessage(""), 4000);
            setIsUnitModalOpen(false);
            await fetchEntities();
        } catch (err: any) {
            alert(err.message || "Error saving unit");
        } finally {
            setSubmitting(false);
        }
    };

    // Bulk Add Units
    const handleSaveBulkUnits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkSectorId) {
            alert("Please select a sector.");
            return;
        }

        const lines = bulkUnitNames
            .split(/\r\n|\n|,/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

        if (lines.length === 0) {
            alert("Please enter at least one unit name.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/entities/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sectorId: bulkSectorId,
                    unitNames: lines,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Bulk unit creation failed");

            setSuccessMessage(
                `Created ${data.createdCount} units successfully! ${data.skippedCount ? `(${data.skippedCount} duplicates skipped)` : ""}`
            );
            setTimeout(() => setSuccessMessage(""), 5000);
            setIsBulkUnitModalOpen(false);
            setBulkUnitNames("");
            await fetchEntities();
        } catch (err: any) {
            alert(err.message || "Bulk creation failed");
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Sector
    const handleDeleteSector = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}" sector? This will delete all units under it.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/entities/sectors/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete sector");
            setSuccessMessage(`Sector "${name}" deleted.`);
            setTimeout(() => setSuccessMessage(""), 3000);
            await fetchEntities();
        } catch (err: any) {
            alert(err.message || "Error deleting sector");
        }
    };

    // Delete Unit
    const handleDeleteUnit = async (id: string, name: string) => {
        if (!confirm(`Delete unit "${name}"?`)) return;

        try {
            const res = await fetch(`/api/entities/units/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete unit");
            setSuccessMessage(`Unit "${name}" deleted.`);
            setTimeout(() => setSuccessMessage(""), 3000);
            await fetchEntities();
        } catch (err: any) {
            alert(err.message || "Error deleting unit");
        }
    };

    // Filtered Sectors
    const filteredSectors = useMemo(() => {
        if (!searchQuery.trim()) return sectors;
        const q = searchQuery.toLowerCase().trim();
        return sectors
            .map((sec) => {
                const matchesSector =
                    sec.name.toLowerCase().includes(q) ||
                    (sec.code && sec.code.toLowerCase().includes(q)) ||
                    (sec.username && sec.username.toLowerCase().includes(q));
                const matchingUnits = sec.units.filter(
                    (u) =>
                        u.name.toLowerCase().includes(q) ||
                        (u.username && u.username.toLowerCase().includes(q))
                );

                if (matchesSector) return sec;
                if (matchingUnits.length > 0) return { ...sec, units: matchingUnits };
                return null;
            })
            .filter(Boolean) as Sector[];
    }, [sectors, searchQuery]);

    const totalUnitsCount = useMemo(
        () => sectors.reduce((acc, s) => acc + s.units.length, 0),
        [sectors]
    );

    const activeSector = useMemo(() => {
        if (!selectedSectorId || !sectors) return null;
        return sectors.find((s) => s.id === selectedSectorId || s.code === selectedSectorId) || null;
    }, [selectedSectorId, sectors]);

    const activeSectorUnits = useMemo(() => {
        if (!activeSector) return [];
        const q = searchQuery.toLowerCase().trim();
        if (!q) return activeSector.units;
        return activeSector.units.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                (u.code && u.code.toLowerCase().includes(q)) ||
                (u.username && u.username.toLowerCase().includes(q))
        );
    }, [activeSector, searchQuery]);

    // CSV Live Preview
    const { items: csvPreviewItems, sectorsCount: csvSectorsCount } = useMemo(() => {
        if (!csvRawText.trim()) return { items: [], sectorsCount: 0 };
        return parseClientCSV(csvRawText, csvImportMode);
    }, [csvRawText, csvImportMode]);

    // Handle CSV File Selection
    const handleCsvFileSelected = (file: File) => {
        if (!file) return;
        setCsvFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = (e.target?.result as string) || "";
            setCsvRawText(content);

            // Auto-detect mode based on header if possible
            const firstLine = content.split(/\r\n|\n/)[0]?.toLowerCase() || "";
            if (firstLine.includes("unit") && (firstLine.includes("sector") || firstLine.includes("id"))) {
                setCsvImportMode("units");
            } else if (firstLine.includes("sector") && !firstLine.includes("unit")) {
                setCsvImportMode("sectors");
            }
        };
        reader.readAsText(file);
    };

    // Download Sample CSV Template
    const handleDownloadSampleCsv = () => {
        let sampleContent = "";
        let filename = "";

        if (csvImportMode === "sectors") {
            sampleContent = `Sector Name,Username,Password
Cherukavu,sec_cherukavu,SSF@Cherukavu26
Pulikkal,sec_pulikkal,SSF@Pulikkal26
Kondotty,sec_kondotty,SSF@Kondotty26
Morayur,sec_morayur,SSF@Morayur26
Nediyiruppu,sec_nediyiruppu,SSF@Nediyiruppu26
`;
            filename = "sample_sectors_template.csv";
        } else {
            sampleContent = `Unit Name,Sector ID,Username,Password
Paravoor,cherukavu,unit_paravoor,SSF@Paravoor26
Muthuparamba,cherukavu,unit_muthuparamba,SSF@Muthuparamba26
Valiyaparamba,pulikkal,unit_valiyaparamba,SSF@Valiyaparamba26
Kottappuram,pulikkal,unit_kottappuram,SSF@Kottappuram26
Alungal,pulikkal,unit_alungal,SSF@Alungal26
`;
            filename = "sample_units_template.csv";
        }

        const blob = new Blob([sampleContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Execute CSV Import API
    const handleImportCsv = async () => {
        if (!csvRawText.trim()) {
            alert("Please select or paste valid CSV content.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/entities/import-csv", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csvText: csvRawText, mode: csvImportMode }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to import CSV");

            let msg = `Successfully imported! `;
            if (data.sectorsCreated) msg += `${data.sectorsCreated} sectors created. `;
            if (data.sectorsUpdated) msg += `${data.sectorsUpdated} sectors updated. `;
            if (data.unitsCreated) msg += `${data.unitsCreated} units created. `;
            if (data.unitsUpdated) msg += `${data.unitsUpdated} units updated. `;

            if (data.errors && data.errors.length > 0) {
                msg += ` (${data.errors.length} rows skipped with warnings)`;
            }

            setSuccessMessage(msg);
            setTimeout(() => setSuccessMessage(""), 5000);
            setIsImportCsvModalOpen(false);
            setCsvRawText("");
            setCsvFileName("");
            await fetchEntities();
        } catch (err: any) {
            alert(err.message || "CSV import failed");
        } finally {
            setSubmitting(false);
        }
    };

    // Export all credentials formatted as plain text
    const exportCredentialsText = () => {
        let text = `=========================================\n`;
        text += `SSF PULIKKAL DIVISION - ENTITIES CREDENTIALS\n`;
        text += `Generated on: ${new Date().toLocaleDateString()}\n`;
        text += `=========================================\n\n`;

        sectors.forEach((sec) => {
            text += `📁 SECTOR: ${sec.name.toUpperCase()}\n`;
            text += `   Sector ID: ${sec.code || sec.id}\n`;
            text += `   Username : ${sec.username || "N/A"}\n`;
            text += `   Password : ${sec.password || "N/A"}\n`;
            text += `   -------------------------------------\n`;
            text += `   UNITS (${sec.units.length}):\n`;
            sec.units.forEach((u, idx) => {
                text += `   ${idx + 1}. ${u.name}\n`;
                text += `      Username: ${u.username || "N/A"}\n`;
                text += `      Password: ${u.password || "N/A"}\n`;
            });
            text += `\n`;
        });

        return text;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-gray-100 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Organization Hierarchy</p>
                    <h1 className="text-3xl font-display font-medium text-black tracking-tight">
                        Entities (Sectors & Units)
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 max-w-xl">
                        Manage Sectors and Units within the organization hierarchy.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={openAddSector}
                        className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-900 transition-colors shadow-2xs cursor-pointer"
                    >
                        <Building2 size={14} /> Add Sector
                    </button>
                    <button
                        type="button"
                        onClick={() => openAddUnit()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer"
                    >
                        <Plus size={13} /> Add Unit
                    </button>
                    <button
                        type="button"
                        onClick={() => openBulkAddUnits()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer"
                    >
                        <FolderPlus size={13} /> Bulk Units
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setCsvRawText("");
                            setCsvFileName("");
                            setIsImportCsvModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer"
                    >
                        <FileUp size={13} /> Import CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsCredentialsModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer"
                    >
                        <FileSpreadsheet size={13} /> Credentials
                    </button>
                </div>
            </div>

            {/* Toasts */}
            {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <Check size={16} className="text-emerald-600" />
                        <span>{successMessage}</span>
                    </div>
                    <button
                        onClick={() => setSuccessMessage("")}
                        className="text-emerald-600 hover:text-emerald-900"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600" />
                        <span>{errorMessage}</span>
                    </div>
                    <button
                        onClick={() => setErrorMessage("")}
                        className="text-red-600 hover:text-red-900"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            {/* ================= SECTOR UNITS PAGE (When a Sector is Selected) ================= */}
            {selectedSectorId && activeSector ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <button
                            type="button"
                            onClick={() => handleSelectSector(null)}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-100 border border-gray-200 bg-white transition-all shadow-2xs cursor-pointer"
                        >
                            <ArrowLeft size={14} />
                            <span>Back to All Sectors</span>
                        </button>

                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                            <span
                                onClick={() => handleSelectSector(null)}
                                className="hover:text-black cursor-pointer"
                            >
                                Entities
                            </span>
                            <ChevronRight size={12} />
                            <span className="text-black font-semibold">{activeSector.name} Sector</span>
                            <ChevronRight size={12} />
                            <span className="text-zinc-500">Units</span>
                        </div>
                    </div>

                    {/* Sector Header Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 shrink-0">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h2 className="text-xl font-bold text-black tracking-tight">
                                        {activeSector.name} Sector
                                    </h2>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        ACTIVE
                                    </span>
                                    {activeSector.code && (
                                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                                            #{activeSector.code}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Managing {activeSector.units.length} registered units affiliated under {activeSector.name} Sector
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => openAddUnit(activeSector.id)}
                                className="inline-flex items-center gap-1.5 bg-black text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
                            >
                                <Plus size={13} /> Add Unit
                            </button>
                            <button
                                type="button"
                                onClick={() => openBulkAddUnits(activeSector.id)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                            >
                                <FolderPlus size={13} /> Bulk Units
                            </button>
                            <button
                                type="button"
                                onClick={() => openSectorDetails(activeSector)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                            >
                                <Key size={13} className="text-emerald-600" /> Sector Details
                            </button>
                            <button
                                type="button"
                                onClick={() => openEditSector(activeSector)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                            >
                                <Edit3 size={13} /> Edit
                            </button>
                        </div>
                    </div>

                    {/* Units Table & Search */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                        <div className="p-3.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={`Search units in ${activeSector.name} Sector...`}
                                    className="w-full pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors bg-zinc-50/50"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-zinc-600 hover:text-black transition-colors cursor-pointer"
                                >
                                    {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
                                    <span>{showPasswords ? "Hide Passwords" : "Show Passwords"}</span>
                                </button>

                                <span className="text-xs text-zinc-500 font-medium">
                                    Showing <strong className="text-black">{activeSectorUnits.length}</strong> of {activeSector.units.length} Units
                                </span>
                            </div>
                        </div>

                        {activeSectorUnits.length === 0 ? (
                            <div className="p-12 text-center text-zinc-400 text-xs">
                                <Layers size={32} className="mx-auto text-zinc-300 mb-2" />
                                <p className="font-medium text-zinc-600">No units found</p>
                                <p className="mt-1">
                                    {searchQuery ? "Try searching with a different term." : "No units registered in this sector yet."}
                                </p>
                                {!searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => openAddUnit(activeSector.id)}
                                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline cursor-pointer"
                                    >
                                        <Plus size={13} /> Add first unit
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                        <tr>
                                            <th className="py-2.5 px-4">Unit Name</th>
                                            <th className="py-2.5 px-4">Username</th>
                                            <th className="py-2.5 px-4">Password</th>
                                            <th className="py-2.5 px-4 text-center">Status</th>
                                            <th className="py-2.5 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activeSectorUnits.map((unit) => {
                                            return (
                                                <tr key={unit.id} className="hover:bg-zinc-50/70 transition-colors">
                                                    <td className="py-2.5 px-4">
                                                        <div className="font-bold text-black flex items-center gap-2">
                                                            <Layers size={13} className="text-zinc-400" />
                                                            <span>{unit.name}</span>
                                                            {unit.code && (
                                                                <span className="text-[10px] font-mono text-zinc-400">
                                                                    #{unit.code}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-4 font-mono text-zinc-600">
                                                        {unit.username || "—"}
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-mono text-zinc-700">
                                                                {showPasswords
                                                                    ? unit.password || "—"
                                                                    : unit.password
                                                                        ? "••••••••"
                                                                        : "—"}
                                                            </span>
                                                            {unit.password && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(unit.password!, `pw-${unit.id}`)}
                                                                    className="text-zinc-400 hover:text-black p-0.5 rounded cursor-pointer"
                                                                    title="Copy password"
                                                                >
                                                                    {copiedField === `pw-${unit.id}` ? (
                                                                        <Check size={12} className="text-emerald-600" />
                                                                    ) : (
                                                                        <Copy size={12} />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            ACTIVE
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openUnitDetails(unit, activeSector)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                                                                title="View credentials & WhatsApp share"
                                                            >
                                                                <Key size={11} className="text-emerald-600" />
                                                                Details
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditUnit(unit)}
                                                                className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer"
                                                                title="Edit Unit"
                                                            >
                                                                <Edit3 size={12} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteUnit(unit.id, unit.name)}
                                                                className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                                                                title="Delete Unit"
                                                            >
                                                                <Trash2 size={12} />
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
            ) : (
                /* ================= ALL SECTORS VIEW ================= */
                <div className="space-y-4">
                    {/* Toolbar: Stats & Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search
                                size={15}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors bg-white shadow-2xs"
                                placeholder="Search sectors by name, username, or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
                            <span className="bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-lg">
                                <strong className="text-black">{sectors.length}</strong> Sectors
                            </span>
                            <span className="bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-lg">
                                <strong className="text-black">{totalUnitsCount}</strong> Units
                            </span>
                        </div>
                    </div>

                    {/* Compact List View for Sectors */}
                    {loading ? (
                        <div className="py-16 flex items-center justify-center space-x-1.5">
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-150"></div>
                        </div>
                    ) : filteredSectors.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-gray-100">
                            {filteredSectors.map((sector) => {
                                const isMenuOpen = openMenuId === `sec-menu-${sector.id}`;

                                return (
                                    <div
                                        key={sector.id}
                                        className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-zinc-50/70 transition-colors select-none group"
                                    >
                                        {/* Left: Sector Title + Units Count (Clicking opens Sector Units Page) */}
                                        <div
                                            onClick={() => handleSelectSector(sector.id)}
                                            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                                                <Building2 size={18} />
                                            </div>

                                            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                                <span className="text-sm font-bold text-black tracking-tight group-hover:text-emerald-700 transition-colors">
                                                    {sector.name} Sector
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                                                    {sector.units.length} Units
                                                </span>
                                                {sector.code && (
                                                    <span className="text-[10px] font-mono text-zinc-400">
                                                        #{sector.code}
                                                    </span>
                                                )}
                                                {sector.username && (
                                                    <span className="text-[10px] font-mono text-zinc-400 hidden md:inline">
                                                        @{sector.username}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Actions: View Units Button, Details Button, + Unit, 3-Dots Menu */}
                                        <div
                                            className="flex items-center gap-1.5 shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Direct View Units Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleSelectSector(sector.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-black text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                                                title="View units in this sector"
                                            >
                                                <span>View Units</span>
                                                <ArrowRight size={13} />
                                            </button>

                                            {/* Direct Details Button */}
                                            <button
                                                type="button"
                                                onClick={() => openSectorDetails(sector)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                                                title="View credentials & WhatsApp share"
                                            >
                                                <Key size={12} className="text-emerald-600" />
                                                <span className="hidden sm:inline">Details</span>
                                            </button>

                                            {/* Quick Add Unit Button */}
                                            <button
                                                type="button"
                                                onClick={() => openAddUnit(sector.id)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                                                title="Add Unit"
                                            >
                                                <Plus size={12} />
                                                <span className="hidden sm:inline">Unit</span>
                                            </button>

                                            {/* 3-Dots Menu */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(isMenuOpen ? null : `sec-menu-${sector.id}`);
                                                    }}
                                                    className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer"
                                                    title="More options"
                                                >
                                                    <MoreVertical size={14} />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {isMenuOpen && (
                                                    <div
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1 text-xs animate-in fade-in zoom-in-95"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                handleSelectSector(sector.id);
                                                            }}
                                                            className="w-full px-3 py-2 text-left hover:bg-zinc-50 flex items-center gap-2 font-medium text-black cursor-pointer"
                                                        >
                                                            <Layers size={13} className="text-zinc-500" />
                                                            View Sector Units ({sector.units.length})
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                openSectorDetails(sector);
                                                            }}
                                                            className="w-full px-3 py-2 text-left hover:bg-zinc-50 flex items-center gap-2 font-medium text-black cursor-pointer"
                                                        >
                                                            <Key size={13} className="text-emerald-600" />
                                                            Details & WhatsApp
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                openBulkAddUnits(sector.id);
                                                            }}
                                                            className="w-full px-3 py-2 text-left hover:bg-zinc-50 flex items-center gap-2 font-medium text-zinc-700 cursor-pointer"
                                                        >
                                                            <FolderPlus size={13} className="text-zinc-500" />
                                                            Bulk Add Units
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                openEditSector(sector);
                                                            }}
                                                            className="w-full px-3 py-2 text-left hover:bg-zinc-50 flex items-center gap-2 font-medium text-zinc-700 cursor-pointer"
                                                        >
                                                            <Edit3 size={13} className="text-zinc-500" />
                                                            Edit Sector
                                                        </button>
                                                        <div className="border-t border-gray-100 my-1"></div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                handleDeleteSector(sector.id, sector.name);
                                                            }}
                                                            className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 font-medium text-red-600 cursor-pointer"
                                                        >
                                                            <Trash2 size={13} />
                                                            Delete Sector
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-16 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center bg-gray-50/50">
                            <Building2 className="w-10 h-10 text-gray-300 mb-2.5" />
                            <p className="text-gray-600 text-sm font-medium">No Sectors Found</p>
                            <p className="text-gray-400 text-xs mt-1">
                                {sectors.length > 0
                                    ? "Try changing your search query."
                                    : "Click 'Add Sector' or 'Import CSV' to set up your division organizational hierarchy."}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ================= MODAL: DETAILS & WHATSAPP SHARE ================= */}
            {detailsEntity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in zoom-in-95">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-zinc-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                                    <WhatsAppIcon size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-black flex items-center gap-1.5">
                                        {detailsEntity.name}{" "}
                                        <span className="text-xs font-normal text-zinc-500">
                                            ({detailsEntity.type === "sector" ? "Sector" : "Unit"})
                                        </span>
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Credentials and WhatsApp share
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailsEntity(null)}
                                className="text-gray-400 hover:text-black cursor-pointer p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6 space-y-4">
                            {/* Credentials Card */}
                            <div className="bg-zinc-50 border border-gray-200 rounded-xl p-4 space-y-2.5 font-mono text-xs">
                                {detailsEntity.type === "unit" && detailsEntity.sectorName && (
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-200/60 font-sans">
                                        <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold">
                                            Sector:
                                        </span>
                                        <span className="font-semibold text-black">
                                            {detailsEntity.sectorName}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold font-sans">
                                        Sector ID:
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-black bg-white px-2 py-0.5 rounded border border-gray-200">
                                            {detailsEntity.sectorId}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(detailsEntity.sectorId, "det-sec-id")}
                                            className="text-zinc-400 hover:text-black cursor-pointer"
                                            title="Copy Sector ID"
                                        >
                                            {copiedField === "det-sec-id" ? (
                                                <Check size={13} className="text-emerald-600" />
                                            ) : (
                                                <Copy size={13} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold font-sans">
                                        Username:
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-black bg-white px-2 py-0.5 rounded border border-gray-200">
                                            {detailsEntity.username || "N/A"}
                                        </span>
                                        {detailsEntity.username && (
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(detailsEntity.username, "det-user")}
                                                className="text-zinc-400 hover:text-black cursor-pointer"
                                                title="Copy Username"
                                            >
                                                {copiedField === "det-user" ? (
                                                    <Check size={13} className="text-emerald-600" />
                                                ) : (
                                                    <Copy size={13} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-bold font-sans">
                                        Password:
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-black bg-white px-2 py-0.5 rounded border border-gray-200">
                                            {showPasswords ? detailsEntity.password : "••••••••"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="text-zinc-400 hover:text-black cursor-pointer"
                                            title={showPasswords ? "Hide Password" : "Show Password"}
                                        >
                                            {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
                                        </button>
                                        {detailsEntity.password && (
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(detailsEntity.password, "det-pass")}
                                                className="text-zinc-400 hover:text-black cursor-pointer"
                                                title="Copy Password"
                                            >
                                                {copiedField === "det-pass" ? (
                                                    <Check size={13} className="text-emerald-600" />
                                                ) : (
                                                    <Copy size={13} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* WhatsApp Ready Message Box */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                                        <WhatsAppIcon size={13} className="text-emerald-600" />
                                        WhatsApp Message Preview
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            copyToClipboard(getWhatsAppMessage(detailsEntity), "wa-msg");
                                        }}
                                        className="text-[11px] font-bold text-zinc-700 hover:text-black flex items-center gap-1 cursor-pointer"
                                    >
                                        {copiedField === "wa-msg" ? (
                                            <>
                                                <Check size={12} className="text-emerald-600" />
                                                <span className="text-emerald-600">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={12} />
                                                <span>Copy Text</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <pre className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-[11px] text-zinc-800 font-mono whitespace-pre-wrap leading-relaxed select-all max-h-40 overflow-y-auto">
                                    {getWhatsAppMessage(detailsEntity)}
                                </pre>
                            </div>

                            {/* Target Phone (Optional) */}
                            <div>
                                <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                                    Send to specific WhatsApp Number (Optional):
                                </label>
                                <input
                                    type="tel"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-black focus:outline-none focus:border-black font-mono"
                                    placeholder="e.g. 9846001122"
                                    value={detailsTargetPhone}
                                    onChange={(e) => setDetailsTargetPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Modal Footer with Actions */}
                        <div className="p-4 border-t border-gray-100 bg-zinc-50/50 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    copyToClipboard(getWhatsAppMessage(detailsEntity), "wa-msg-footer");
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 cursor-pointer shadow-2xs"
                            >
                                {copiedField === "wa-msg-footer" ? (
                                    <Check size={13} className="text-emerald-600" />
                                ) : (
                                    <Copy size={13} />
                                )}
                                Copy Text
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSendWhatsApp(detailsEntity, detailsTargetPhone)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                            >
                                <WhatsAppIcon size={14} />
                                Share on WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Import CSV */}
            {isImportCsvModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                                    <FileUp size={20} className="text-black" />
                                    Import via CSV
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Import sectors or units in bulk using a CSV spreadsheet
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsImportCsvModalOpen(false)}
                                className="text-gray-400 hover:text-black cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Mode Selector Tabs (Sectors vs Units) */}
                        <div className="flex border-b border-gray-100 bg-zinc-50/70 p-2 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setCsvImportMode("sectors");
                                    setCsvRawText("");
                                    setCsvFileName("");
                                }}
                                className={cn(
                                    "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5",
                                    csvImportMode === "sectors"
                                        ? "bg-white text-black shadow-xs border border-gray-200"
                                        : "text-zinc-500 hover:text-black"
                                )}
                            >
                                <Building2 size={14} />
                                Import Sectors
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCsvImportMode("units");
                                    setCsvRawText("");
                                    setCsvFileName("");
                                }}
                                className={cn(
                                    "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5",
                                    csvImportMode === "units"
                                        ? "bg-white text-black shadow-xs border border-gray-200"
                                        : "text-zinc-500 hover:text-black"
                                )}
                            >
                                <Layers size={14} />
                                Import Units
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 flex-1 overflow-y-auto space-y-5">
                            {/* Format Guide Alert */}
                            <div className="p-3 bg-zinc-50 border border-gray-200 rounded-xl text-xs text-zinc-700 flex items-center justify-between gap-3">
                                <div>
                                    <span className="font-bold text-black uppercase tracking-wider block text-[10px] mb-0.5">
                                        Required CSV Columns ({csvImportMode === "sectors" ? "Sectors" : "Units"}):
                                    </span>
                                    {csvImportMode === "sectors" ? (
                                        <code className="text-emerald-700 font-mono font-semibold">
                                            Sector Name, Username, Password
                                        </code>
                                    ) : (
                                        <code className="text-emerald-700 font-mono font-semibold">
                                            Unit Name, Sector ID, Username, Password
                                        </code>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDownloadSampleCsv}
                                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
                                >
                                    <Download size={13} className="text-zinc-500" />
                                    Download Sample CSV
                                </button>
                            </div>

                            {/* Method Switch: File vs Paste */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCsvInputMethod("file")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                                        csvInputMethod === "file"
                                            ? "bg-black text-white"
                                            : "bg-white text-zinc-600 border border-gray-200 hover:bg-gray-100"
                                    )}
                                >
                                    Upload File (.csv)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCsvInputMethod("paste")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                                        csvInputMethod === "paste"
                                            ? "bg-black text-white"
                                            : "bg-white text-zinc-600 border border-gray-200 hover:bg-gray-100"
                                    )}
                                >
                                    Paste CSV Text
                                </button>
                            </div>

                            {/* Method 1: File Drop Zone */}
                            {csvInputMethod === "file" ? (
                                <div>
                                    <input
                                        ref={csvFileInputRef}
                                        type="file"
                                        accept=".csv,text/csv"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleCsvFileSelected(file);
                                        }}
                                    />

                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDraggingCsv(true);
                                        }}
                                        onDragLeave={() => setIsDraggingCsv(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDraggingCsv(false);
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) handleCsvFileSelected(file);
                                        }}
                                        onClick={() => csvFileInputRef.current?.click()}
                                        className={cn(
                                            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                                            isDraggingCsv
                                                ? "border-black bg-zinc-100"
                                                : "border-gray-200 hover:border-black hover:bg-gray-50/50"
                                        )}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-black">
                                            <Upload size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-black">
                                                {csvFileName ? `Selected: ${csvFileName}` : "Click to browse or Drag & Drop .csv file"}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {csvImportMode === "sectors"
                                                    ? "Format: Sector Name, Username, Password"
                                                    : "Format: Unit Name, Sector ID, Username, Password"}
                                            </p>
                                        </div>
                                        {csvFileName && (
                                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                                File loaded successfully
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Method 2: Paste Raw CSV Text */
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                        Paste CSV Data (Copy and paste directly from Excel or Google Sheets)
                                    </label>
                                    <textarea
                                        rows={6}
                                        className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono text-black focus:outline-none focus:border-black leading-relaxed"
                                        placeholder={
                                            csvImportMode === "sectors"
                                                ? `Sector Name,Username,Password\nCherukavu,sec_cherukavu,SSF@Cherukavu26\nPulikkal,sec_pulikkal,SSF@Pulikkal26\nKondotty,sec_kondotty,SSF@Kondotty26`
                                                : `Unit Name,Sector ID,Username,Password\nParavoor,cherukavu,unit_paravoor,SSF@Paravoor26\nMuthuparamba,cherukavu,unit_muthuparamba,SSF@Muthuparamba26\nValiyaparamba,pulikkal,unit_valiyaparamba,SSF@Valiyaparamba26`
                                        }
                                        value={csvRawText}
                                        onChange={(e) => setCsvRawText(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Live Parsed Preview Table */}
                            {csvPreviewItems.length > 0 && (
                                <div className="space-y-3 pt-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Table size={15} className="text-black" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-black">
                                                Detected Preview ({csvPreviewItems.length} rows)
                                            </span>
                                        </div>
                                        <span className="text-xs text-zinc-500">
                                            {csvImportMode === "sectors" ? (
                                                <><strong>{csvPreviewItems.length}</strong> Sectors</>
                                            ) : (
                                                <><strong>{csvPreviewItems.length}</strong> Units across <strong>{csvSectorsCount}</strong> Sectors</>
                                            )}
                                        </span>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-zinc-100 border-b border-gray-200 text-zinc-600 font-bold uppercase text-[10px] sticky top-0">
                                                <tr>
                                                    <th className="py-2 px-3">#</th>
                                                    {csvImportMode === "sectors" ? (
                                                        <>
                                                            <th className="py-2 px-3">Sector Name</th>
                                                            <th className="py-2 px-3">Username</th>
                                                            <th className="py-2 px-3">Password</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="py-2 px-3">Unit Name</th>
                                                            <th className="py-2 px-3">Sector ID / Name</th>
                                                            <th className="py-2 px-3">Username</th>
                                                            <th className="py-2 px-3">Password</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                                                {csvPreviewItems.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-zinc-50/50">
                                                        <td className="py-1.5 px-3 font-sans text-zinc-400">
                                                            {idx + 1}
                                                        </td>
                                                        {csvImportMode === "sectors" ? (
                                                            <>
                                                                <td className="py-1.5 px-3 font-sans font-medium text-black">
                                                                    {item.sectorName}
                                                                </td>
                                                                <td className="py-1.5 px-3 text-zinc-600">
                                                                    {item.username}
                                                                </td>
                                                                <td className="py-1.5 px-3 text-zinc-600">
                                                                    {item.password}
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="py-1.5 px-3 font-sans font-medium text-black">
                                                                    {item.unitName}
                                                                </td>
                                                                <td className="py-1.5 px-3 font-sans text-zinc-700">
                                                                    <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                                                                        {item.sectorId}
                                                                    </span>
                                                                </td>
                                                                <td className="py-1.5 px-3 text-zinc-600">
                                                                    {item.username}
                                                                </td>
                                                                <td className="py-1.5 px-3 text-zinc-600">
                                                                    {item.password}
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-zinc-50/50">
                            <span className="text-xs text-gray-500">
                                {csvPreviewItems.length > 0
                                    ? `Ready to import ${csvPreviewItems.length} ${csvImportMode}`
                                    : "Select or paste CSV content to preview"}
                            </span>

                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsImportCsvModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleImportCsv}
                                    disabled={submitting || csvPreviewItems.length === 0}
                                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-sm"
                                >
                                    {submitting && <Loader2 size={13} className="animate-spin" />}
                                    Confirm & Import {csvPreviewItems.length > 0 ? `(${csvPreviewItems.length})` : ""}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add/Edit Sector */}
            {isSectorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-black">
                                    {editingSector ? "Edit Sector" : "Add New Sector"}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Enter sector name and portal credentials
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSectorModalOpen(false)}
                                className="text-gray-400 hover:text-black cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSector} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                    Sector Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-black focus:outline-none focus:border-black"
                                    placeholder="e.g. Cherukavu, Pulikkal"
                                    value={sectorForm.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        setSectorForm((prev) => ({
                                            ...prev,
                                            name,
                                            username:
                                                !editingSector && !prev.username
                                                    ? `sec_${name.toLowerCase().trim().replace(/[^a-z0-9]/g, "_")}`
                                                    : prev.username,
                                            password:
                                                !editingSector && !prev.password
                                                    ? `SSF@${name.replace(/\s+/g, "")}26`
                                                    : prev.password,
                                        }));
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                        Portal Username
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-mono text-black focus:outline-none focus:border-black"
                                        placeholder="sec_cherukavu"
                                        value={sectorForm.username}
                                        onChange={(e) =>
                                            setSectorForm({ ...sectorForm, username: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                        Portal Password
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-mono text-black focus:outline-none focus:border-black"
                                        placeholder="SSF@Cherukavu26"
                                        value={sectorForm.password}
                                        onChange={(e) =>
                                            setSectorForm({ ...sectorForm, password: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsSectorModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting && <Loader2 size={13} className="animate-spin" />}
                                    {editingSector ? "Update Sector" : "Create Sector"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add/Edit Unit */}
            {isUnitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-black">
                                    {editingUnit ? "Edit Unit" : "Add New Unit"}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Enter unit name and select its parent sector
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsUnitModalOpen(false)}
                                className="text-gray-400 hover:text-black cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                    Sector *
                                </label>
                                <select
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-black bg-white focus:outline-none focus:border-black"
                                    value={unitForm.sectorId}
                                    onChange={(e) =>
                                        setUnitForm({ ...unitForm, sectorId: e.target.value })
                                    }
                                >
                                    <option value="" disabled>
                                        Select Sector
                                    </option>
                                    {sectors.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} Sector (Sector ID: {s.code || s.id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                    Unit Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-black focus:outline-none focus:border-black"
                                    placeholder="e.g. Paravoor, Muthuparamba"
                                    value={unitForm.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        setUnitForm((prev) => ({
                                            ...prev,
                                            name,
                                            username:
                                                !editingUnit && !prev.username
                                                    ? `unit_${name.toLowerCase().trim().replace(/[^a-z0-9]/g, "_")}`
                                                    : prev.username,
                                            password:
                                                !editingUnit && !prev.password
                                                    ? `SSF@${name.replace(/\s+/g, "")}26`
                                                    : prev.password,
                                        }));
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                        Portal Username
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-mono text-black focus:outline-none focus:border-black"
                                        placeholder="unit_paravoor"
                                        value={unitForm.username}
                                        onChange={(e) =>
                                            setUnitForm({ ...unitForm, username: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                        Portal Password
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-xs font-mono text-black focus:outline-none focus:border-black"
                                        placeholder="SSF@Paravoor26"
                                        value={unitForm.password}
                                        onChange={(e) =>
                                            setUnitForm({ ...unitForm, password: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsUnitModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting && <Loader2 size={13} className="animate-spin" />}
                                    {editingUnit ? "Update Unit" : "Create Unit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Bulk Add Units */}
            {isBulkUnitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-black">Bulk Add Units</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Add multiple units under a selected sector at once
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsBulkUnitModalOpen(false)}
                                className="text-gray-400 hover:text-black cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveBulkUnits} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                    Target Sector *
                                </label>
                                <select
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-black bg-white focus:outline-none focus:border-black"
                                    value={bulkSectorId}
                                    onChange={(e) => setBulkSectorId(e.target.value)}
                                >
                                    <option value="" disabled>
                                        Select Sector
                                    </option>
                                    {sectors.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} Sector (Sector ID: {s.code || s.id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                    Unit Names (One name per line) *
                                </label>
                                <textarea
                                    required
                                    rows={6}
                                    className="w-full border border-gray-200 rounded-lg p-3 text-xs text-black focus:outline-none focus:border-black leading-relaxed"
                                    placeholder={`Paravoor\nMuthuparamba\nKaipetta\nAlumkootam`}
                                    value={bulkUnitNames}
                                    onChange={(e) => setBulkUnitNames(e.target.value)}
                                />
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Default username and password will be generated automatically for each unit.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsBulkUnitModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting && <Loader2 size={13} className="animate-spin" />}
                                    Create Units
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Full Credentials Sheet */}
            {isCredentialsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                                    <FileSpreadsheet size={20} className="text-black" />
                                    Entities Credentials Sheet
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Full list of login credentials for all sectors and units
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCredentialsModalOpen(false)}
                                className="text-gray-400 hover:text-black cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            <pre className="bg-zinc-900 text-zinc-200 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed select-all">
                                {exportCredentialsText()}
                            </pre>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-zinc-50/50">
                            <span className="text-xs text-gray-400">
                                {sectors.length} Sectors, {totalUnitsCount} Units
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(exportCredentialsText());
                                        setSuccessMessage("Credentials copied to clipboard!");
                                        setTimeout(() => setSuccessMessage(""), 3000);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer shadow-sm"
                                >
                                    <Copy size={13} /> Copy All
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCredentialsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
