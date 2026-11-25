"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, Loader2, Calendar, MapPin, Award, BookOpen, Clock, Upload, Trash } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-black placeholder:text-gray-300 focus:outline-none focus:border-black transition-colors bg-white";
const selectClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors bg-white";
const labelClass = "text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2";

export default function SahithyotsavAdminPage() {
    const [activeTab, setActiveTab] = useState("settings");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // States
    const [settings, setSettings] = useState<any>({
        title: "",
        subtitle: "",
        dates: "",
        venue: "",
        mapLink: "",
        brochureUrl: "",
        registerUrl: "",
        countdownDate: "",
    });
    const [sessions, setSessions] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [uploadingBrochure, setUploadingBrochure] = useState(false);

    // Form states for sessions
    const [sessionForm, setSessionForm] = useState({
        id: "",
        itemName: "",
        category: "HS",
        stage: "Stage A",
        time: "Day 1 - 10:00 AM",
        status: "UPCOMING",
    });
    const [editingSession, setEditingSession] = useState(false);

    // Form states for results
    const [resultForm, setResultForm] = useState({
        id: "",
        itemName: "",
        category: "HS",
        winnerName: "",
        unitName: "",
        position: "1",
    });
    const [editingResult, setEditingResult] = useState(false);

    // Bulk Results Import States
    const [uploadMode, setUploadMode] = useState("single");
    const [csvPreview, setCsvPreview] = useState<any[]>([]);
    const [csvError, setCsvError] = useState<string | null>(null);

    // Bulk Schedule Import States
    const [scheduleUploadMode, setScheduleUploadMode] = useState("single");
    const [scheduleCsvPreview, setScheduleCsvPreview] = useState<any[]>([]);
    const [scheduleCsvError, setScheduleCsvError] = useState<string | null>(null);

    // Dynamic Entities (Sectors & Units)
    const [entitiesSectors, setEntitiesSectors] = useState<any[]>([]);

    const categories = ["Lower Primary", "Upper Primary", "High School", "Higher Secondary", "Junior", "Senior", "Campus", "General"];

    const statuses = ["UPCOMING", "ONGOING", "COMPLETED"];
    const positions = ["1", "2", "3"];

    // Fetch all data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [settingsRes, sessionsRes, resultsRes, entitiesRes] = await Promise.all([
                fetch("/api/sahithyotsav/settings"),
                fetch("/api/sahithyotsav/sessions"),
                fetch("/api/sahithyotsav/results"),
                fetch("/api/entities").catch(() => null),
            ]);

            if (entitiesRes && entitiesRes.ok) {
                const entData = await entitiesRes.json();
                if (entData.sectors) setEntitiesSectors(entData.sectors);
            }

            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                // Format countdownDate for datetime-local input
                if (settingsData.countdownDate) {
                    const d = new Date(settingsData.countdownDate);
                    const formattedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
                    settingsData.countdownDate = formattedDate;
                }
                setSettings(settingsData);
            }

            if (sessionsRes.ok) {
                const sessionsData = await sessionsRes.json();
                setSessions(sessionsData);
            }

            if (resultsRes.ok) {
                const resultsData = await resultsRes.json();
                setResults(resultsData);
            }
        } catch (err) {
            console.error("Failed to fetch admin data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Save Settings
    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/sahithyotsav/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                alert("Settings updated successfully!");
                fetchData();
            } else {
                alert("Failed to update settings.");
            }
        } catch {
            alert("Failed to update settings.");
        } finally {
            setSaving(false);
        }
    };

    // Upload brochure file
    const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingBrochure(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (data.url) {
                setSettings({ ...settings, brochureUrl: data.url });
                alert("Brochure uploaded successfully! Save settings to persist changes.");
            } else {
                alert("Upload failed: " + (data.error || "Unknown error"));
            }
        } catch {
            alert("Upload failed.");
        } finally {
            setUploadingBrochure(false);
        }
    };

    // Sessions management (Create / Edit)
    const handleSessionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingSession
                ? `/api/sahithyotsav/sessions/${sessionForm.id}`
                : "/api/sahithyotsav/sessions";
            const method = editingSession ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sessionForm),
            });

            if (res.ok) {
                alert(editingSession ? "Session updated!" : "Session created!");
                setSessionForm({ id: "", itemName: "", category: "HS", stage: "Stage A", time: "Day 1 - 10:00 AM", status: "UPCOMING" });
                setEditingSession(false);
                fetchData();
            } else {
                alert("Failed to save session.");
            }
        } catch {
            alert("Failed to save session.");
        } finally {
            setSaving(false);
        }
    };

    const handleEditSession = (s: any) => {
        setSessionForm({
            id: s.id,
            itemName: s.itemName,
            category: s.category,
            stage: s.stage,
            time: s.time,
            status: s.status,
        });
        setEditingSession(true);
    };

    const handleDeleteSession = async (id: string) => {
        if (!confirm("Are you sure you want to delete this session?")) return;
        try {
            const res = await fetch(`/api/sahithyotsav/sessions/${id}`, { method: "DELETE" });
            if (res.ok) {
                setSessions(sessions.filter((s) => s.id !== id));
            } else {
                alert("Failed to delete session.");
            }
        } catch {
            alert("Failed to delete session.");
        }
    };

    // Results management (Create / Edit)
    const handleResultSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingResult
                ? `/api/sahithyotsav/results/${resultForm.id}`
                : "/api/sahithyotsav/results";
            const method = editingResult ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(resultForm),
            });

            if (res.ok) {
                alert(editingResult ? "Result updated!" : "Result saved!");
                setResultForm({ id: "", itemName: "", category: "HS", winnerName: "", unitName: "", position: "1" });
                setEditingResult(false);
                fetchData();
            } else {
                alert("Failed to save result.");
            }
        } catch {
            alert("Failed to save result.");
        } finally {
            setSaving(false);
        }
    };

    const handleEditResult = (r: any) => {
        setResultForm({
            id: r.id,
            itemName: r.itemName,
            category: r.category,
            winnerName: r.winnerName,
            unitName: r.unitName,
            position: String(r.position),
        });
        setEditingResult(true);
    };

    const handleDeleteResult = async (id: string) => {
        if (!confirm("Are you sure you want to delete this result?")) return;
        try {
            const res = await fetch(`/api/sahithyotsav/results/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to delete result.");
            }
        } catch {
            alert("Failed to delete result.");
        }
    };

    // Bulk Import CSV Parser & Upload Handlers
    const parseCSV = (text: string) => {
        const lines = text.split(/\r?\n/);
        if (lines.length === 0) return [];
        
        // Read headers
        const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
        
        // Find column indexes
        const itemIndex = headers.findIndex(h => h.includes("item") || h.includes("competition") || h.includes("program"));
        const catIndex = headers.findIndex(h => h.includes("cat"));
        const winnerIndex = headers.findIndex(h => (h.includes("winner") || h.includes("contestant") || h.includes("name")) && !h.includes("item") && !h.includes("competition"));
        const sectorIndex = headers.findIndex(h => h.includes("sector") || h.includes("unit") || h.includes("team"));
        const posIndex = headers.findIndex(h => h.includes("position") || h.includes("place") || h.includes("rank"));
        const ptsIndex = headers.findIndex(h => h.includes("point"));

        const records = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^["']|["']$/g, ""));
            
            if (cols.length < 3) continue;

            const position = posIndex !== -1 ? parseInt(cols[posIndex], 10) : 1;
            const points = ptsIndex !== -1 ? parseInt(cols[ptsIndex], 10) : undefined;

            records.push({
                itemName: itemIndex !== -1 ? cols[itemIndex] : cols[0],
                category: catIndex !== -1 ? cols[catIndex] : "General",
                winnerName: winnerIndex !== -1 ? cols[winnerIndex] : cols[1],
                unitName: sectorIndex !== -1 ? cols[sectorIndex] : cols[2],
                position: isNaN(position) ? 1 : position,
                points: isNaN(points as any) ? undefined : points
            });
        }
        return records;
    };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                const parsed = parseCSV(text);
                if (parsed.length === 0) {
                    setCsvError("No valid rows found in CSV. Please verify formatting.");
                    setCsvPreview([]);
                } else {
                    setCsvPreview(parsed);
                    setCsvError(null);
                }
            } catch (err) {
                setCsvError("Error parsing file. Ensure it is a valid CSV.");
                setCsvPreview([]);
            }
        };
        reader.readAsText(file);
    };

    const handleCommitCSV = async () => {
        if (csvPreview.length === 0) return;
        setSaving(true);
        try {
            const res = await fetch("/api/sahithyotsav/results/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ results: csvPreview }),
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Successfully imported ${data.count} results!`);
                setCsvPreview([]);
                setUploadMode("single");
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || "Failed to commit import"}`);
            }
        } catch {
            alert("Failed to upload data.");
        } finally {
            setSaving(false);
        }
    };

    // Bulk Import Schedule CSV Parser & Upload Handlers
    const parseScheduleCSV = (text: string) => {
        const lines = text.split(/\r?\n/);
        if (lines.length === 0) return [];
        
        // Read headers
        const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
        
        // Find column indexes
        const codeIndex = headers.findIndex(h => h.includes("code") || h.includes("competition"));
        const stageIndex = headers.findIndex(h => h.includes("stage"));
        const dateIndex = headers.findIndex(h => h.includes("date"));
        const startIndex = headers.findIndex(h => h.includes("start"));
        const endIndex = headers.findIndex(h => h.includes("end"));

        const records = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^["']|["']$/g, ""));
            
            if (cols.length < 2) continue;

            const rawCompCode = codeIndex !== -1 ? cols[codeIndex] : cols[0];
            const rawStage = stageIndex !== -1 ? cols[stageIndex] : cols[1] || "Stage A";
            const rawDate = dateIndex !== -1 ? cols[dateIndex] : (cols[2] || "");
            const rawStart = startIndex !== -1 ? cols[startIndex] : (cols[3] || "");
            const rawEnd = endIndex !== -1 ? cols[endIndex] : (cols[4] || "");

            // Extract category and itemName from Competition Code
            const match = rawCompCode.match(/^(CAT-A|CAT-B|CAM|GEN|HSS|HS|JR|LP|SR|UP)([\s\-\d]*)(.*)$/i);
            
            let category = "General";
            let itemName = rawCompCode;

            if (match) {
                const code = match[1].toUpperCase();
                itemName = match[3].trim() || rawCompCode;
                
                switch (code) {
                    case "CAM": category = "Campus"; break;
                    case "CAT-A": category = "General Category A"; break;
                    case "CAT-B": category = "General Category B"; break;
                    case "GEN": category = "General"; break;
                    case "HS": category = "High School"; break;
                    case "HSS": category = "Higher Secondary"; break;
                    case "JR": category = "Junior"; break;
                    case "LP": category = "Lower Primary"; break;
                    case "SR": category = "Senior"; break;
                    case "UP": category = "Upper Primary"; break;
                }
            }

            // Combine Date, Start Time, and End Time into the time string
            let timeStr = rawDate;
            if (rawStart) {
                timeStr += ` - ${rawStart}`;
            }
            if (rawEnd) {
                timeStr += ` to ${rawEnd}`;
            }
            timeStr = timeStr.trim();

            records.push({
                itemName: itemName,
                category: category,
                stage: rawStage,
                time: timeStr || "TBD",
                status: "UPCOMING"
            });
        }
        return records;
    };

    const handleScheduleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                const parsed = parseScheduleCSV(text);
                if (parsed.length === 0) {
                    setScheduleCsvError("No valid rows found in CSV. Please verify formatting.");
                    setScheduleCsvPreview([]);
                } else {
                    setScheduleCsvPreview(parsed);
                    setScheduleCsvError(null);
                }
            } catch (err) {
                setScheduleCsvError("Error parsing file. Ensure it is a valid CSV.");
                setScheduleCsvPreview([]);
            }
        };
        reader.readAsText(file);
    };

    const handleCommitScheduleCSV = async () => {
        if (scheduleCsvPreview.length === 0) return;
        setSaving(true);
        try {
            const res = await fetch("/api/sahithyotsav/sessions/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessions: scheduleCsvPreview }),
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Successfully imported ${data.count} schedule sessions!`);
                setScheduleCsvPreview([]);
                setScheduleUploadMode("single");
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || "Failed to commit import"}`);
            }
        } catch {
            alert("Failed to upload schedule data.");
        } finally {
            setSaving(false);
        }
    };

    // Compute sector leaderboard (excluding Campus) and campus leaderboard for preview
    const sectorLeaderboard = Object.entries(
        results.filter((r: any) => r.category !== "Campus").reduce((acc: Record<string, number>, curr: any) => {
            acc[curr.unitName] = (acc[curr.unitName] || 0) + curr.points;
            return acc;
        }, {})
    )
        .map(([unitName, points]) => ({ unitName, points: points as number }))
        .sort((a, b) => b.points - a.points);

    const campusLeaderboard = Object.entries(
        results.filter((r: any) => r.category === "Campus").reduce((acc: Record<string, number>, curr: any) => {
            acc[curr.unitName] = (acc[curr.unitName] || 0) + curr.points;
            return acc;
        }, {})
    )
        .map(([unitName, points]) => ({ unitName, points: points as number }))
        .sort((a, b) => b.points - a.points);

    if (loading) return (
        <div className="flex items-center justify-center h-64 space-x-1.5">
            <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce delay-75"></div>
            <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce delay-150"></div>
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="border-b border-gray-100 pb-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Literary Festival Management</p>
                <h1 className="text-4xl font-display font-medium text-black tracking-tight">Sahithyotsav Portal</h1>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-100">
                {[
                    { id: "settings", label: "General Settings" },
                    { id: "sessions", label: "Program Schedule" },
                    { id: "results", label: "Live Results" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setEditingSession(false);
                            setEditingResult(false);
                        }}
                        className={cn(
                            "px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                            activeTab === tab.id
                                ? "border-black text-black"
                                : "border-transparent text-gray-400 hover:text-black"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Panels */}
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-premium">
                
                {/* Settings Tab */}
                {activeTab === "settings" && (
                    <form onSubmit={handleUpdateSettings} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-5">
                                <div>
                                    <label className={labelClass}>Festival Title</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={settings.title}
                                        onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                                        placeholder="Pulikkal Division Sahithyotsav 2026"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Subtitle / Description</label>
                                    <textarea
                                        className={cn(inputClass, "resize-none")}
                                        rows={3}
                                        value={settings.subtitle}
                                        onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                                        placeholder="Describe the theme or cultural scope..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Dates</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={settings.dates}
                                            onChange={(e) => setSettings({ ...settings, dates: e.target.value })}
                                            placeholder="August 28, 29, 30"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Venue</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={settings.venue}
                                            onChange={(e) => setSettings({ ...settings, venue: e.target.value })}
                                            placeholder="Cherukavu, Pulikkal"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className={labelClass}>Countdown Target Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        className={inputClass}
                                        value={settings.countdownDate}
                                        onChange={(e) => setSettings({ ...settings, countdownDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Google Maps Embed URL</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={settings.mapLink}
                                        onChange={(e) => setSettings({ ...settings, mapLink: e.target.value })}
                                        placeholder="https://www.google.com/maps/embed?pb=..."
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Online Registration URL</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={settings.registerUrl}
                                        onChange={(e) => setSettings({ ...settings, registerUrl: e.target.value })}
                                        placeholder="e.g. registration platform link"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Brochure Upload */}
                        <div className="pt-8 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className={labelClass}>Brochure Document URL</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={settings.brochureUrl}
                                        onChange={(e) => setSettings({ ...settings, brochureUrl: e.target.value })}
                                        placeholder="Paste URL or upload document"
                                    />
                                    <div className={cn(
                                        "relative w-32 h-11 bg-black text-white rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer hover:bg-gray-900 transition-colors flex-shrink-0",
                                        uploadingBrochure && "opacity-50 pointer-events-none"
                                    )}>
                                        {uploadingBrochure ? <Loader2 size={14} className="animate-spin mr-2" /> : <Upload size={14} className="mr-2" />}
                                        {uploadingBrochure ? "Uploading..." : "Upload File"}
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleBrochureUpload}
                                            accept=".pdf,.png,.jpg,.jpeg"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-start h-11 mt-6 text-xs text-gray-400">
                                {settings.brochureUrl ? (
                                    <span className="text-emerald-600 font-medium">✓ Brochure attached: {settings.brochureUrl.split("/").pop()}</span>
                                ) : (
                                    <span>No brochure uploaded yet. PDF or image files supported.</span>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-50">
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Settings
                            </button>
                        </div>
                    </form>
                )}

                {/* Sessions Tab */}
                {activeTab === "sessions" && (
                    <div className="space-y-8">
                        {/* Selector tabs for Single vs Bulk */}
                        <div className="flex border-b border-gray-100 mb-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setScheduleUploadMode("single");
                                    setEditingSession(false);
                                }}
                                className={cn(
                                    "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors",
                                    scheduleUploadMode === "single"
                                        ? "border-black text-black"
                                        : "border-transparent text-gray-400 hover:text-black"
                                )}
                            >
                                Single Schedule Entry
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setScheduleUploadMode("bulk");
                                    setEditingSession(false);
                                }}
                                className={cn(
                                    "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors",
                                    scheduleUploadMode === "bulk"
                                        ? "border-black text-black"
                                        : "border-transparent text-gray-400 hover:text-black"
                                )}
                            >
                                Bulk Import CSV
                            </button>
                        </div>

                        {scheduleUploadMode === "single" ? (
                            <form onSubmit={handleSessionSubmit} className="bg-gray-50 border border-gray-100 rounded-xl p-6 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
                                    {editingSession ? "Edit Scheduled Item" : "Schedule New Event / Item"}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Item / Event Name</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={sessionForm.itemName}
                                            onChange={(e) => setSessionForm({ ...sessionForm, itemName: e.target.value })}
                                            placeholder="e.g. Mappilappattu, Recitation..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Category</label>
                                        <select
                                            className={selectClass}
                                            value={sessionForm.category}
                                            onChange={(e) => setSessionForm({ ...sessionForm, category: e.target.value })}
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Stage / Venue</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={sessionForm.stage}
                                            onChange={(e) => setSessionForm({ ...sessionForm, stage: e.target.value })}
                                            placeholder="e.g. Stage A (Arooz)"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Date & Time Text</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={sessionForm.time}
                                            onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                                            placeholder="e.g. Day 1 - 09:30 AM"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Session Status</label>
                                        <select
                                            className={selectClass}
                                            value={sessionForm.status}
                                            onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })}
                                        >
                                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                                        >
                                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
                                            {editingSession ? "Update Item" : "Add Item"}
                                        </button>
                                        {editingSession && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingSession(false);
                                                    setSessionForm({ id: "", itemName: "", category: "HS", stage: "Stage A", time: "Day 1 - 10:00 AM", status: "UPCOMING" });
                                                }}
                                                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-100 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
                                        Import Schedule via CSV
                                    </h3>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Upload a Comma Separated Values (.csv) file exported from your Excel schedule. The file must include columns for: <span className="font-semibold">Competition Code, Stage, Date, Start Time</span>, and <span className="font-semibold">End Time</span>.
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                        The uploader will automatically separate the category prefix (e.g. <span className="font-semibold">HS</span> for High School, <span className="font-semibold">CAM</span> for Campus) from the competition name and format the times.
                                    </p>
                                </div>

                                {/* Upload Area */}
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-white hover:border-black transition-colors relative cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleScheduleCSVUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="mx-auto text-gray-300 mb-3" size={32} />
                                    <p className="text-sm font-medium text-black">Drag and drop your schedule CSV file here, or click to browse</p>
                                    <p className="text-xs text-gray-400 mt-1">Only .csv files generated from Excel are supported</p>
                                </div>

                                {scheduleCsvError && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-xs font-medium">
                                        {scheduleCsvError}
                                    </div>
                                )}

                                {/* Template layout helper */}
                                <div className="bg-white border border-gray-100 rounded-xl p-4 text-xs">
                                    <p className="font-bold text-gray-400 uppercase tracking-widest mb-2">Expected CSV Header & Layout</p>
                                    <pre className="font-mono text-[11px] text-gray-600 overflow-x-auto bg-gray-50 p-3 rounded-lg">
{`Competition Code,Stage,Date,Start Time,End Time
HS 101 Malayalam Elocution,Stage A (Arooz),Day 1,09:30 AM,10:30 AM
CAM 204 English Essay,Stage B (Qafila),Day 1,10:30 AM,11:30 AM
LP-02 Recitation,Stage A (Arooz),Day 2,02:00 PM,03:30 PM`}
                                    </pre>
                                </div>

                                {/* CSV Preview Table */}
                                {scheduleCsvPreview.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Previewing {scheduleCsvPreview.length} items (showing first 10)
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={handleCommitScheduleCSV}
                                                disabled={saving}
                                                className="bg-black text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                                Commit Bulk Import
                                            </button>
                                        </div>
                                        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase">
                                                        <th className="px-4 py-2.5">Item Name</th>
                                                        <th className="px-4 py-2.5">Category</th>
                                                        <th className="px-4 py-2.5">Stage</th>
                                                        <th className="px-4 py-2.5">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 text-gray-700">
                                                    {scheduleCsvPreview.slice(0, 10).map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-2.5 font-semibold text-black">{row.itemName}</td>
                                                            <td className="px-4 py-2.5">{row.category}</td>
                                                            <td className="px-4 py-2.5">{row.stage}</td>
                                                            <td className="px-4 py-2.5">{row.time}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* List */}
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <th className="px-6 py-4">Item Name</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Stage</th>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm text-black">
                                    {sessions.length > 0 ? (
                                        sessions.map((s) => (
                                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-semibold">{s.itemName}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs rounded-full">{s.category}</span>
                                                </td>
                                                <td className="px-6 py-4">{s.stage}</td>
                                                <td className="px-6 py-4">{s.time}</td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "px-2 py-0.5 text-xs rounded-full font-medium border",
                                                        s.status === "COMPLETED" ? "bg-slate-50 border-slate-200 text-slate-500" :
                                                        s.status === "ONGOING" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                                                        "bg-blue-50 border-blue-200 text-blue-600"
                                                    )}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <button
                                                            onClick={() => handleEditSession(s)}
                                                            className="p-1.5 text-gray-400 hover:text-black transition-colors rounded hover:bg-gray-100"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSession(s.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                                No sessions scheduled yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Results Tab */}
                {activeTab === "results" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Editor Form (lg:col-span-8) */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Mode Tabs */}
                            <div className="flex border-b border-gray-100 mb-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUploadMode("single");
                                        setCsvPreview([]);
                                        setCsvError(null);
                                    }}
                                    className={cn(
                                        "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors",
                                        uploadMode === "single"
                                            ? "border-black text-black"
                                            : "border-transparent text-gray-400 hover:text-black"
                                    )}
                                >
                                    Single Winner Entry
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUploadMode("bulk");
                                        setEditingResult(false);
                                    }}
                                    className={cn(
                                        "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors",
                                        uploadMode === "bulk"
                                            ? "border-black text-black"
                                            : "border-transparent text-gray-400 hover:text-black"
                                    )}
                                >
                                    Bulk Import CSV
                                </button>
                            </div>

                            {uploadMode === "single" ? (
                                <form onSubmit={handleResultSubmit} className="bg-gray-50 border border-gray-100 rounded-xl p-6 space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
                                        {editingResult ? "Edit Result entry" : "Add Event Winner / Result"}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Item Name</label>
                                            <input
                                                type="text"
                                                className={inputClass}
                                                value={resultForm.itemName}
                                                onChange={(e) => setResultForm({ ...resultForm, itemName: e.target.value })}
                                                placeholder="e.g. Mappilappattu, Qira'at..."
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Category</label>
                                            <select
                                                className={selectClass}
                                                value={resultForm.category}
                                                onChange={(e) => setResultForm({ ...resultForm, category: e.target.value })}
                                            >
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Winner's Name</label>
                                            <input
                                                type="text"
                                                className={inputClass}
                                                value={resultForm.winnerName}
                                                onChange={(e) => setResultForm({ ...resultForm, winnerName: e.target.value })}
                                                placeholder="Participant's name"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className={labelClass}>Unit / Sector Name</label>
                                                {entitiesSectors.length > 0 && (
                                                    <span className="text-[10px] text-emerald-600 font-semibold">
                                                        Entities connected
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                className={inputClass}
                                                list="sahithyotsav-entities-list"
                                                value={resultForm.unitName}
                                                onChange={(e) => setResultForm({ ...resultForm, unitName: e.target.value })}
                                                placeholder="e.g. Cherukavu, Paravoor..."
                                                required
                                            />
                                            <datalist id="sahithyotsav-entities-list">
                                                {entitiesSectors.map((s) => (
                                                    <option key={`sec-${s.id}`} value={s.name}>
                                                        {s.name} Sector
                                                    </option>
                                                ))}
                                                {entitiesSectors.flatMap((s) =>
                                                    (s.units || []).map((u: any) => (
                                                        <option key={`unit-${u.id}`} value={u.name}>
                                                            {u.name} Unit ({s.name} Sector)
                                                        </option>
                                                    ))
                                                )}
                                            </datalist>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Placement</label>
                                            <select
                                                className={selectClass}
                                                value={resultForm.position}
                                                onChange={(e) => setResultForm({ ...resultForm, position: e.target.value })}
                                            >
                                                {positions.map(p => (
                                                    <option key={p} value={p}>
                                                        {p === "1" ? "1st (5 pts)" : p === "2" ? "2nd (3 pts)" : "3rd (1 pt)"}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="flex-1 bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                                            >
                                                {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
                                                {editingResult ? "Update Result" : "Add Winner"}
                                            </button>
                                            {editingResult && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingResult(false);
                                                        setResultForm({ id: "", itemName: "", category: "HS", winnerName: "", unitName: "", position: "1" });
                                                    }}
                                                    className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-100 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
                                            Import Results via CSV
                                        </h3>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            Upload a Comma Separated Values (.csv) file exported from your Excel sheet. The file should include columns for: <span className="font-semibold">Item Name, Category, Winner Name, Sector, Position</span>, and optionally <span className="font-semibold">Points</span>.
                                        </p>
                                    </div>

                                    {/* Upload Area */}
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-white hover:border-black transition-colors relative cursor-pointer">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleCSVUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <Upload className="mx-auto text-gray-300 mb-3" size={32} />
                                        <p className="text-sm font-medium text-black">Drag and drop your CSV file here, or click to browse</p>
                                        <p className="text-xs text-gray-400 mt-1">Only .csv files generated from Excel are supported</p>
                                    </div>

                                    {csvError && (
                                        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-xs font-medium">
                                            {csvError}
                                        </div>
                                    )}

                                    {/* Sample Template */}
                                    <div className="bg-white border border-gray-100 rounded-xl p-4 text-xs">
                                        <p className="font-bold text-gray-400 uppercase tracking-widest mb-2">Expected CSV Header & Layout</p>
                                        <pre className="font-mono text-[11px] text-gray-600 overflow-x-auto bg-gray-50 p-3 rounded-lg">
{`Item Name,Category,Winner Name,Sector,Position,Points
Mappilappattu,HS,Muhammad Farhan,Pulikkal,1,5
Mappilappattu,HS,Ameer Suhail,Cherukavu,2,3
Group Song,HSS,Team Cherukavu,Cherukavu,1,10`}
                                        </pre>
                                    </div>

                                    {/* CSV Preview */}
                                    {csvPreview.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                                    Preview ({csvPreview.length} records ready)
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => setCsvPreview([])}
                                                    className="text-xs text-red-500 hover:underline"
                                                >
                                                    Clear Preview
                                                </button>
                                            </div>

                                            <div className="border border-gray-100 rounded-xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky top-0">
                                                            <th className="px-4 py-2">Item Name</th>
                                                            <th className="px-4 py-2">Winner</th>
                                                            <th className="px-4 py-2">Sector</th>
                                                            <th className="px-4 py-2">Place</th>
                                                            <th className="px-4 py-2">Points</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50 text-black">
                                                        {csvPreview.slice(0, 10).map((r, i) => (
                                                            <tr key={i}>
                                                                <td className="px-4 py-2 font-semibold">{r.itemName} <span className="text-[9px] text-slate-400">({r.category})</span></td>
                                                                <td className="px-4 py-2">{r.winnerName}</td>
                                                                <td className="px-4 py-2 font-medium">{r.unitName}</td>
                                                                <td className="px-4 py-2">{r.position === 1 ? "1st" : r.position === 2 ? "2nd" : r.position === 3 ? "3rd" : `${r.position}th`}</td>
                                                                <td className="px-4 py-2 text-emerald-600 font-bold">+{r.points !== undefined ? r.points : (r.position === 1 ? 5 : r.position === 2 ? 3 : r.position === 3 ? 1 : 0)}</td>
                                                            </tr>
                                                        ))}
                                                        {csvPreview.length > 10 && (
                                                            <tr>
                                                                <td colSpan={5} className="px-4 py-3 bg-gray-50 text-center text-gray-400 font-light italic">
                                                                    and {csvPreview.length - 10} more records...
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleCommitCSV}
                                                disabled={saving}
                                                className="w-full bg-black hover:bg-gray-900 text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                                            >
                                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                Commit Bulk Import
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}


                            {/* List */}
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <th className="px-6 py-4">Item Name</th>
                                            <th className="px-6 py-4">Winner</th>
                                            <th className="px-6 py-4">Sector</th>
                                            <th className="px-6 py-4">Place</th>
                                            <th className="px-6 py-4">Points</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm text-black">
                                        {results.length > 0 ? (
                                            results.map((r) => (
                                                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold">{r.itemName}</div>
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">{r.category}</span>
                                                    </td>
                                                    <td className="px-6 py-4">{r.winnerName}</td>
                                                    <td className="px-6 py-4 font-medium">{r.unitName}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-xs font-semibold",
                                                            r.position === 1 ? "bg-amber-100 text-amber-800" :
                                                            r.position === 2 ? "bg-slate-100 text-slate-800" :
                                                            "bg-orange-100 text-orange-800"
                                                        )}>
                                                            {r.position === 1 ? "1st" : r.position === 2 ? "2nd" : "3rd"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-emerald-600 font-bold">+{r.points}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <button
                                                                onClick={() => handleEditResult(r)}
                                                                className="p-1.5 text-gray-400 hover:text-black transition-colors rounded hover:bg-gray-100"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteResult(r.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                                    No results added yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Leaderboard Live Preview (lg:col-span-4) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Sector Standings Preview */}
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-1.5">
                                    <Award size={16} className="text-amber-500" /> Sector Standings Preview
                                </h3>
                                {sectorLeaderboard.length > 0 ? (
                                    <div className="space-y-4">
                                        {sectorLeaderboard.map((item, index) => (
                                            <div key={item.unitName} className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border",
                                                        index === 0 ? "bg-amber-100 text-amber-800 border-amber-200" :
                                                        index === 1 ? "bg-slate-100 text-slate-800 border-slate-200" :
                                                        index === 2 ? "bg-orange-100 text-orange-800 border-orange-200" :
                                                        "bg-white text-gray-500 border-gray-200"
                                                    )}>
                                                        {index + 1}
                                                    </span>
                                                    <span className="font-semibold text-gray-700">{item.unitName}</span>
                                                </div>
                                                <span className="font-bold text-black bg-gray-100 px-2 py-0.5 rounded">{item.points} pts</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No points registered yet.</p>
                                )}
                            </div>

                            {/* Campus Standings Preview */}
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-1.5">
                                    <Award size={16} className="text-emerald-500" /> Campus Standings Preview
                                </h3>
                                {campusLeaderboard.length > 0 ? (
                                    <div className="space-y-4">
                                        {campusLeaderboard.map((item, index) => (
                                            <div key={item.unitName} className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border",
                                                        index === 0 ? "bg-amber-100 text-amber-800 border-amber-200" :
                                                        index === 1 ? "bg-slate-100 text-slate-800 border-slate-200" :
                                                        index === 2 ? "bg-orange-100 text-orange-800 border-orange-200" :
                                                        "bg-white text-gray-500 border-gray-200"
                                                    )}>
                                                        {index + 1}
                                                    </span>
                                                    <span className="font-semibold text-gray-700">{item.unitName}</span>
                                                </div>
                                                <span className="font-bold text-black bg-gray-100 px-2 py-0.5 rounded">{item.points} pts</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No campus points registered yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
