"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Save, X, Upload, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass = "w-full border border-gray-100 rounded-lg px-4 py-3 text-sm text-black placeholder:text-gray-300 focus:outline-none focus:border-black transition-colors";
const labelClass = "text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2";
const selectClass = "w-full border border-gray-100 rounded-lg px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors";

export default function AdminEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [slugTouched, setSlugTouched] = useState(false);

    const cleanSlug = (text: string) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    // Form State
    const [enableRegistration, setEnableRegistration] = useState(false);
    const [form, setForm] = useState({
        title: "",
        slug: "",
        description: "",
        date: "",
        time: "",
        venue: "",
        image: "",
        category: "Seminar",
        status: "UPCOMING",
        registerUrl: "",
        registerButtonText: "",
    });

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/events");
            const data = await res.json();
            setEvents(data);
        } catch (error) {
            console.error("Failed to load events:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Handle Image Upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setSaving(true);
        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setForm((prev) => ({ ...prev, image: data.url }));
                alert("Cover image uploaded successfully!");
            } else {
                alert("Failed to upload cover image.");
            }
        } catch {
            alert("Error uploading image.");
        } finally {
            setSaving(false);
        }
    };

    // Form Submit
    const submitWithData = async (dataToSubmit: any) => {
        setSaving(true);
        try {
            const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
            const method = editingEvent ? "PUT" : "POST";

            const cleanedPayload = {
                ...dataToSubmit,
                registerUrl: enableRegistration && dataToSubmit.registerUrl?.trim() ? dataToSubmit.registerUrl.trim() : null,
                registerButtonText: enableRegistration && dataToSubmit.registerUrl?.trim() ? (dataToSubmit.registerButtonText?.trim() || "Register for Event") : null,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cleanedPayload),
            });

            if (res.ok) {
                alert(
                    editingEvent
                        ? "Event updated successfully!"
                        : dataToSubmit.status === "DRAFT"
                        ? "Event saved as Draft!"
                        : "Event created successfully!"
                );
                setShowForm(false);
                setEditingEvent(null);
                setSlugTouched(false);
                setEnableRegistration(false);
                setForm({
                    title: "",
                    slug: "",
                    description: "",
                    date: "",
                    time: "",
                    venue: "",
                    image: "",
                    category: "Seminar",
                    status: "UPCOMING",
                    registerUrl: "",
                    registerButtonText: "",
                });
                fetchEvents();
            } else {
                alert("Failed to save event.");
            }
        } catch {
            alert("Error saving event.");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitWithData(form);
    };

    // Delete Event
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        try {
            const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
            if (res.ok) {
                setEvents(events.filter((e) => e.id !== id));
            } else {
                alert("Failed to delete event.");
            }
        } catch {
            alert("Error deleting event.");
        }
    };

    const handleToggleStatus = async (event: any) => {
        const newStatus = event.status === "DRAFT" ? "UPCOMING" : "DRAFT";
        try {
            const res = await fetch(`/api/events/${event.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...event, status: newStatus }),
            });
            if (res.ok) {
                setEvents(events.map((e) => (e.id === event.id ? { ...e, status: newStatus } : e)));
            } else {
                alert("Failed to update status");
            }
        } catch {
            alert("Failed to update status");
        }
    };

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
            <div className="border-b border-gray-100 pb-8 flex justify-between items-end">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">General Content</p>
                    <h1 className="text-4xl font-display font-medium text-black tracking-tight">Events Manager</h1>
                </div>
                {!showForm && (
                    <button
                        onClick={() => {
                            setEditingEvent(null);
                            setSlugTouched(false);
                            setEnableRegistration(false);
                            setForm({
                                title: "",
                                slug: "",
                                description: "",
                                date: "",
                                time: "",
                                venue: "",
                                image: "",
                                category: "Seminar",
                                status: "UPCOMING",
                                registerUrl: "",
                                registerButtonText: "",
                            });
                            setShowForm(true);
                        }}
                        className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-900 transition-all cursor-pointer"
                    >
                        <Plus size={14} /> Add New Event
                    </button>
                )}
            </div>

            {/* Event Form */}
            {showForm && (
                <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                        <h3 className="text-base font-semibold text-black">
                            {editingEvent ? "Edit Event details" : "Create New Event"}
                        </h3>
                        <button 
                            onClick={() => setShowForm(false)}
                            className="p-1 text-gray-400 hover:text-black cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Event Title</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={form.title}
                                    onChange={(e) => {
                                        const newTitle = e.target.value;
                                        setForm((prev) => {
                                            const next = { ...prev, title: newTitle };
                                            if (!editingEvent && !slugTouched) {
                                                const auto = cleanSlug(newTitle);
                                                if (auto) next.slug = auto;
                                            }
                                            return next;
                                        });
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Category</label>
                                <select
                                    className={selectClass}
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                >
                                    <option value="Seminar">Seminar</option>
                                    <option value="Camp">Camp</option>
                                    <option value="Meeting">Meeting</option>
                                    <option value="Workshop">Workshop</option>
                                    <option value="Award Ceremony">Award Ceremony</option>
                                    <option value="Festival">Festival</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                        Slug (URL Identifier)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const clean = cleanSlug(form.title);
                                            setForm((prev) => ({ ...prev, slug: clean || `event-${Date.now().toString().slice(-4)}` }));
                                            setSlugTouched(true);
                                        }}
                                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                                    >
                                        Auto-generate from Title
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-3 rounded-lg border border-gray-100 font-mono select-none">
                                        /events/
                                    </span>
                                    <input
                                        type="text"
                                        className={cn(inputClass, "font-mono")}
                                        placeholder="custom-event-slug"
                                        value={form.slug}
                                        onChange={(e) => {
                                            setSlugTouched(true);
                                            const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                            setForm({ ...form, slug: val });
                                        }}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1.5">
                                    URL preview: <span className="font-mono text-gray-600">/events/{form.slug || (editingEvent?.slug || "auto-generated-slug")}</span>
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Description</label>
                                <textarea
                                    className={cn(inputClass, "h-28 resize-none")}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Event Date</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder="e.g., August 20, 2026"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Event Time (Optional)</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder="e.g., 09:00 AM - 04:00 PM"
                                    value={form.time}
                                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Venue Location</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={form.venue}
                                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-span-full bg-gray-50/70 border border-gray-200/80 rounded-xl p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-black">Online Registration</span>
                                            {enableRegistration ? (
                                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    Button Visible
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                    Button Hidden
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Toggle to show or hide the registration button on the public calendar and event pages.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = !enableRegistration;
                                            setEnableRegistration(next);
                                            if (!next) {
                                                setForm(prev => ({ ...prev, registerUrl: "" }));
                                            }
                                        }}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                            enableRegistration ? "bg-black" : "bg-gray-300"
                                        )}
                                        role="switch"
                                        aria-checked={enableRegistration}
                                    >
                                        <span
                                            className={cn(
                                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                enableRegistration ? "translate-x-5" : "translate-x-0"
                                            )}
                                        />
                                    </button>
                                </div>

                                {enableRegistration && (
                                    <div className="pt-4 border-t border-gray-200/70 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Registration URL *</label>
                                            <input
                                                type="text"
                                                className={inputClass}
                                                placeholder="e.g. https://forms.gle/... or /tickets"
                                                value={form.registerUrl}
                                                onChange={(e) => setForm({ ...form, registerUrl: e.target.value })}
                                                required={enableRegistration}
                                            />
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Enter the registration form link or internal page (e.g. /tickets).
                                            </p>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Button Text (Optional)</label>
                                            <input
                                                type="text"
                                                className={inputClass}
                                                placeholder="Register for Event (Default)"
                                                value={form.registerButtonText}
                                                onChange={(e) => setForm({ ...form, registerButtonText: e.target.value })}
                                            />
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                e.g. &apos;Register Now&apos; or &apos;Find Your Ticket&apos;.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>Event Cover Image (Optional)</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        placeholder="Image path/URL"
                                        value={form.image}
                                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                                    />
                                    <label className="bg-black text-white hover:bg-gray-900 transition-colors px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                                        <Upload size={14} /> Upload File
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    className={selectClass}
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                    <option value="UPCOMING">Upcoming</option>
                                    <option value="ONGOING">Ongoing</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="DRAFT">Draft (Hidden from public)</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="bg-white border border-gray-200 text-gray-400 px-5 py-2.5 rounded-lg text-sm font-medium hover:text-black hover:border-black cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={async () => {
                                    if (!form.title || !form.description || !form.date || !form.venue) {
                                        alert("Please fill in required fields (Title, Description, Date, Venue) to save draft.");
                                        return;
                                    }
                                    const draftForm = { ...form, status: "DRAFT" };
                                    setForm(draftForm);
                                    await submitWithData(draftForm);
                                }}
                                className="bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                            >
                                Save as Draft
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {editingEvent ? "Update Event" : "Publish Event"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Events List Table */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Venue</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {events.length > 0 ? (
                            events.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50 text-sm text-black">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold">{event.title}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {event.slug && (
                                                <span className="font-mono text-[11px] text-gray-400">
                                                    /events/{event.slug}
                                                </span>
                                            )}
                                            {event.registerUrl ? (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                    Registration Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                    Registration Hidden
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-black/5 text-black text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-black/5">
                                             {event.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-semibold text-gray-600">{event.date}</td>
                                    <td className="px-6 py-4 text-xs text-gray-400">{event.venue}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border",
                                            event.status === "UPCOMING" && "bg-blue-50 text-blue-600 border-blue-100",
                                            event.status === "ONGOING" && "bg-red-50 text-red-600 border-red-100",
                                            event.status === "COMPLETED" && "bg-green-50 text-green-600 border-green-100",
                                            event.status === "DRAFT" && "bg-amber-50 text-amber-700 border-amber-200"
                                        )}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => handleToggleStatus(event)}
                                                className={cn(
                                                    "p-1 rounded transition-colors cursor-pointer",
                                                    event.status === "DRAFT"
                                                        ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                                                        : "text-gray-400 hover:text-black hover:bg-gray-100"
                                                )}
                                                title={event.status === "DRAFT" ? "Draft (Hidden from public) - Click to make Upcoming" : "Active - Click to hide (set to Draft)"}
                                            >
                                                {event.status === "DRAFT" ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingEvent(event);
                                                    setSlugTouched(true);
                                                    setEnableRegistration(Boolean(event.registerUrl && event.registerUrl.trim()));
                                                    setForm({
                                                        title: event.title,
                                                        slug: event.slug || "",
                                                        description: event.description,
                                                        date: event.date,
                                                        time: event.time || "",
                                                        venue: event.venue,
                                                        image: event.image || "",
                                                        category: event.category,
                                                        status: event.status,
                                                        registerUrl: event.registerUrl || "",
                                                        registerButtonText: event.registerButtonText || "",
                                                    });
                                                    setShowForm(true);
                                                }}
                                                className="p-1 text-gray-400 hover:text-black transition-colors cursor-pointer"
                                                title="Edit event"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                                title="Delete event"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm font-light italic">
                                    No events created yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
