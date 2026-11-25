"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Upload,
    Trash2,
    Loader2,
    Image as ImageIcon,
    CheckSquare,
    Square,
    Filter,
    Search,
    Check,
    X,
    Plus,
    AlertCircle,
    Calendar,
    Layers,
    FolderPlus,
    ExternalLink,
    Edit3,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface GalleryAlbum {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    date: string | null;
    location: string | null;
    photoCount?: number;
    photos?: any[];
    createdAt: string;
}

interface QueueItem {
    id: string;
    file: File;
    preview: string;
    name: string;
    sizeFormatted: string;
    status: "ready" | "uploading" | "done" | "error";
    errorMsg?: string;
    uploadedUrl?: string;
}

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageFile = (f: File) => {
    if (!f) return false;
    if (f.type && f.type.startsWith("image/")) return true;
    return /\.(jpe?g|png|webp|gif|avif|bmp|heic|svg)$/i.test(f.name || "");
};

const cleanSlug = (text: string) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export default function GalleryManagement() {
    const [images, setImages] = useState<any[]>([]);
    const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
    const [loading, setLoading] = useState(true);

    // Active Top Tab: 'albums' | 'upload' | 'photos'
    const [activeTab, setActiveTab] = useState<"albums" | "upload" | "photos">("albums");

    // Upload & Queue State
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{
        current: number;
        total: number;
        percent: number;
    } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounterRef = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Selected Album for Upload
    const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
    const [customTitle, setCustomTitle] = useState("");

    // Success & Error Toasts
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Filter & Search
    const [selectedAlbumFilter, setSelectedAlbumFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // Multi-Select for Bulk Delete
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);

    // Album Creation / Edit Modal State
    const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState<GalleryAlbum | null>(null);
    const [albumForm, setAlbumForm] = useState({
        title: "",
        slug: "",
        date: "",
        location: "",
        description: "",
        coverImage: "",
    });
    const [savingAlbum, setSavingAlbum] = useState(false);

    // Fetch existing gallery photos and albums
    const fetchGallery = async () => {
        try {
            const [imagesRes, albumsRes] = await Promise.all([
                fetch("/api/gallery"),
                fetch("/api/gallery/albums"),
            ]);
            const imagesData = await imagesRes.json();
            const albumsData = await albumsRes.json();

            setImages(Array.isArray(imagesData) ? imagesData : []);
            setAlbums(Array.isArray(albumsData) ? albumsData : []);

            // Set default selected album if none selected
            if (Array.isArray(albumsData) && albumsData.length > 0 && !selectedAlbumId) {
                setSelectedAlbumId(albumsData[0].id);
            }
        } catch (error) {
            console.error("Error loading gallery data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, []);

    // Clean up preview object URLs on unmount
    useEffect(() => {
        return () => {
            queue.forEach((item) => {
                if (item.preview && item.preview.startsWith("blob:")) {
                    URL.revokeObjectURL(item.preview);
                }
            });
        };
    }, [queue]);

    // Open Add Album Modal
    const openAddAlbum = () => {
        setEditingAlbum(null);
        setAlbumForm({
            title: "",
            slug: "",
            date: "",
            location: "",
            description: "",
            coverImage: "",
        });
        setIsAlbumModalOpen(true);
    };

    // Open Edit Album Modal
    const openEditAlbum = (album: GalleryAlbum) => {
        setEditingAlbum(album);
        setAlbumForm({
            title: album.title,
            slug: album.slug,
            date: album.date || "",
            location: album.location || "",
            description: album.description || "",
            coverImage: album.coverImage || "",
        });
        setIsAlbumModalOpen(true);
    };

    // Save Album (Create or Update)
    const handleSaveAlbum = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!albumForm.title.trim()) {
            alert("Album title is required.");
            return;
        }

        const slugToSave = albumForm.slug.trim() ? cleanSlug(albumForm.slug) : cleanSlug(albumForm.title);
        if (!slugToSave) {
            alert("A valid slug is required.");
            return;
        }

        setSavingAlbum(true);
        try {
            const url = editingAlbum
                ? `/api/gallery/albums/${editingAlbum.slug}`
                : "/api/gallery/albums";
            const method = editingAlbum ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...albumForm,
                    slug: slugToSave,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save album");

            setSuccessMessage(
                editingAlbum ? "Event Album updated successfully!" : "Event Album created successfully!"
            );
            setTimeout(() => setSuccessMessage(""), 4000);
            setIsAlbumModalOpen(false);

            if (!editingAlbum && data.id) {
                setSelectedAlbumId(data.id);
            }

            await fetchGallery();
        } catch (err: any) {
            alert(err.message || "Error saving event album");
        } finally {
            setSavingAlbum(false);
        }
    };

    // Delete Album
    const handleDeleteAlbum = async (album: GalleryAlbum) => {
        if (!confirm(`Are you sure you want to delete album "${album.title}" and its photos?`)) return;

        try {
            const res = await fetch(`/api/gallery/albums/${album.slug}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete album");

            setSuccessMessage(`Album "${album.title}" deleted.`);
            setTimeout(() => setSuccessMessage(""), 3000);
            await fetchGallery();
        } catch (err: any) {
            alert(err.message || "Failed to delete album");
        }
    };

    // Add files to staging queue
    const addFilesToQueue = (fileList: FileList | File[]) => {
        const rawFiles = Array.from(fileList);
        const validFiles = rawFiles.filter(isImageFile);

        if (validFiles.length === 0) {
            setErrorMessage("Please select valid image files (JPG, PNG, WebP, etc.).");
            setTimeout(() => setErrorMessage(""), 4000);
            return;
        }

        const newItems: QueueItem[] = validFiles.map((file) => ({
            id: Math.random().toString(36).substring(2, 9),
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            sizeFormatted: formatFileSize(file.size),
            status: "ready",
        }));

        setQueue((prev) => [...prev, ...newItems]);
        setErrorMessage("");
    };

    // Remove single file from staging queue
    const removeFromQueue = (id: string) => {
        setQueue((prev) => {
            const item = prev.find((q) => q.id === id);
            if (item && item.preview.startsWith("blob:")) {
                URL.revokeObjectURL(item.preview);
            }
            return prev.filter((q) => q.id !== id);
        });
    };

    // Clear entire queue
    const clearQueue = () => {
        queue.forEach((q) => {
            if (q.preview.startsWith("blob:")) URL.revokeObjectURL(q.preview);
        });
        setQueue([]);
        setUploadProgress(null);
    };

    // Trigger Bulk Upload Process into the chosen Event Album
    const handleStartUpload = async () => {
        const pendingItems = queue.filter((item) => item.status === "ready" || item.status === "error");
        if (pendingItems.length === 0) return;

        const targetAlbum = albums.find((a) => a.id === selectedAlbumId);
        if (!targetAlbum && albums.length > 0) {
            alert("Please select an Event Album to upload these photos into.");
            return;
        }

        setUploading(true);
        setErrorMessage("");
        setUploadProgress({ current: 0, total: pendingItems.length, percent: 0 });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < pendingItems.length; i++) {
            const item = pendingItems[i];

            // Mark item as uploading
            setQueue((prev) =>
                prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", errorMsg: undefined } : q))
            );

            try {
                // 1. Upload image file to server
                const formData = new FormData();
                formData.append("file", item.file);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const errData = await uploadRes.json().catch(() => ({}));
                    throw new Error(errData.error || `Upload failed with status ${uploadRes.status}`);
                }

                const uploadData = await uploadRes.json();
                const uploadedUrl = uploadData.url || (uploadData.urls && uploadData.urls[0]);

                if (!uploadedUrl) {
                    throw new Error("No URL returned from server");
                }

                // 2. Save image to Gallery in Database linked with Album & Slug
                const galleryRes = await fetch("/api/gallery", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image: uploadedUrl,
                        title: customTitle.trim() || undefined,
                        albumId: targetAlbum?.id,
                        eventSlug: targetAlbum?.slug,
                        event: targetAlbum?.title,
                    }),
                });

                if (!galleryRes.ok) {
                    throw new Error("Uploaded but failed to save in database");
                }

                // Mark item as done
                successCount++;
                setQueue((prev) =>
                    prev.map((q) => (q.id === item.id ? { ...q, status: "done", uploadedUrl } : q))
                );
            } catch (err: any) {
                console.error(`Failed uploading ${item.name}:`, err);
                failCount++;
                setQueue((prev) =>
                    prev.map((q) =>
                        q.id === item.id ? { ...q, status: "error", errorMsg: err.message || "Upload failed" } : q
                    )
                );
            }

            // Update Progress
            const completedSoFar = i + 1;
            const percent = Math.round((completedSoFar / pendingItems.length) * 100);
            setUploadProgress({ current: completedSoFar, total: pendingItems.length, percent });
        }

        setUploading(false);
        setUploadProgress(null);

        if (successCount > 0) {
            setSuccessMessage(
                `Successfully uploaded ${successCount} photo${successCount > 1 ? "s" : ""} to "${targetAlbum?.title || "Gallery"}"!`
            );
            setTimeout(() => setSuccessMessage(""), 5000);
            await fetchGallery();

            // Clear successful items from queue
            setTimeout(() => {
                setQueue((prev) => prev.filter((item) => item.status !== "done"));
            }, 1200);
        }

        if (failCount > 0) {
            setErrorMessage(`${failCount} photo${failCount > 1 ? "s" : ""} failed to upload. You can click Retry.`);
        }
    };

    // Single delete
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this photo?")) return;
        try {
            const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
            if (res.ok) {
                setImages((prev) => prev.filter((img) => img.id !== id));
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        } catch {
            alert("Failed to delete photo");
        }
    };

    // Bulk delete
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected photos?`)) return;

        setDeleting(true);
        try {
            const res = await fetch("/api/gallery", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });
            if (res.ok) {
                setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)));
                setSelectedIds(new Set());
                setSuccessMessage("Selected photos deleted successfully");
                setTimeout(() => setSuccessMessage(""), 3000);
                await fetchGallery();
            } else {
                alert("Failed to delete selected photos");
            }
        } catch {
            alert("Failed to delete selected photos");
        } finally {
            setDeleting(false);
        }
    };

    // Toggle single selection
    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Filter images
    const filteredImages = useMemo(() => {
        return images.filter((img) => {
            const matchesAlbum =
                selectedAlbumFilter === "ALL" ||
                img.albumId === selectedAlbumFilter ||
                img.eventSlug === selectedAlbumFilter;
            const matchesSearch =
                !searchQuery.trim() ||
                (img.title && img.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (img.event && img.event.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesAlbum && matchesSearch;
        });
    }, [images, selectedAlbumFilter, searchQuery]);

    // Select/Deselect All in current filter
    const allFilteredSelected =
        filteredImages.length > 0 && filteredImages.every((img) => selectedIds.has(img.id));
    const toggleSelectAll = () => {
        if (allFilteredSelected) {
            setSelectedIds(new Set());
        } else {
            const next = new Set(selectedIds);
            filteredImages.forEach((img) => next.add(img.id));
            setSelectedIds(next);
        }
    };

    const targetAlbumForUpload = useMemo(
        () => albums.find((a) => a.id === selectedAlbumId),
        [albums, selectedAlbumId]
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="border-b border-gray-100 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black text-white uppercase tracking-wider">
                            Media & Event Albums
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-display font-medium text-black tracking-tight">
                        Event Gallery Manager
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                        Manage event albums, upload photos in bulk, and organize event collections with dedicated URLs.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                        href="/gallery"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                    >
                        <ExternalLink size={14} className="text-zinc-500" />
                        View Live Gallery
                    </Link>

                    <button
                        type="button"
                        onClick={openAddAlbum}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                        <FolderPlus size={15} />
                        Create Event Album
                    </button>
                </div>
            </div>

            {/* Toasts */}
            {successMessage && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <Check size={18} className="text-emerald-600" />
                        <span>{successMessage}</span>
                    </div>
                    <button
                        onClick={() => setSuccessMessage("")}
                        className="text-emerald-600 hover:text-emerald-900"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {errorMessage && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-600" />
                        <span>{errorMessage}</span>
                    </div>
                    <button
                        onClick={() => setErrorMessage("")}
                        className="text-red-600 hover:text-red-900"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-1">
                <button
                    type="button"
                    onClick={() => setActiveTab("albums")}
                    className={cn(
                        "px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer",
                        activeTab === "albums"
                            ? "bg-black text-white shadow-xs"
                            : "bg-white text-zinc-600 hover:bg-zinc-100"
                    )}
                >
                    <Layers size={14} />
                    Event Albums ({albums.length})
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className={cn(
                        "px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer",
                        activeTab === "upload"
                            ? "bg-black text-white shadow-xs"
                            : "bg-white text-zinc-600 hover:bg-zinc-100"
                    )}
                >
                    <Upload size={14} />
                    Upload Photos {queue.length > 0 ? `(${queue.length})` : ""}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("photos")}
                    className={cn(
                        "px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer",
                        activeTab === "photos"
                            ? "bg-black text-white shadow-xs"
                            : "bg-white text-zinc-600 hover:bg-zinc-100"
                    )}
                >
                    <ImageIcon size={14} />
                    All Photos ({images.length})
                </button>
            </div>

            {/* TAB 1: Event Albums Management */}
            {activeTab === "albums" && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-black">
                                Event Albums
                            </h2>
                            <p className="text-xs text-gray-400">
                                Create and manage albums with individual URL slugs and photo collections
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openAddAlbum}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            <Plus size={14} />
                            Add Album
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-20 flex items-center justify-center space-x-1.5">
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-150"></div>
                        </div>
                    ) : albums.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {albums.map((album) => {
                                const cover = album.coverImage || (album as any).photos?.[0]?.image;
                                const count = album.photoCount ?? (album as any)._count?.photos ?? 0;

                                return (
                                    <div
                                        key={album.id}
                                        className="bg-white border border-gray-100 hover:border-gray-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                                    >
                                        <div>
                                            {/* Cover */}
                                            <div className="relative aspect-16/9 bg-zinc-100 overflow-hidden">
                                                {cover ? (
                                                    <img
                                                        src={cover}
                                                        alt={album.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-1">
                                                        <ImageIcon size={32} />
                                                        <span className="text-[10px] text-zinc-400">No cover image yet</span>
                                                    </div>
                                                )}

                                                {/* Photo count pill */}
                                                <span className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <ImageIcon size={11} />
                                                    {count} {count === 1 ? "Photo" : "Photos"}
                                                </span>

                                                {album.date && (
                                                    <span className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        {album.date}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Body */}
                                            <div className="p-5 space-y-2">
                                                <h3 className="text-base font-bold text-black tracking-tight line-clamp-1">
                                                    {album.title}
                                                </h3>

                                                {/* Slug pill */}
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                                                    <span className="text-zinc-400">Slug:</span>
                                                    <span className="bg-zinc-100 px-2 py-0.5 rounded text-[11px] font-bold text-zinc-800">
                                                        /gallery/{album.slug}
                                                    </span>
                                                </div>

                                                {album.description && (
                                                    <p className="text-xs text-gray-400 line-clamp-2 pt-1 font-light">
                                                        {album.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="p-4 pt-3 border-t border-gray-100 flex items-center justify-between bg-zinc-50/50">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedAlbumId(album.id);
                                                    setActiveTab("upload");
                                                }}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-black hover:text-zinc-600 transition-colors cursor-pointer"
                                            >
                                                <Upload size={13} />
                                                Upload Photos
                                            </button>

                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={`/gallery/${album.slug}`}
                                                    target="_blank"
                                                    title="View live album"
                                                    className="p-1.5 rounded-md hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
                                                >
                                                    <ExternalLink size={14} />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditAlbum(album)}
                                                    title="Edit album"
                                                    className="p-1.5 rounded-md hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAlbum(album)}
                                                    title="Delete album"
                                                    className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-20 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center bg-gray-50/50">
                            <Layers className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-700 font-medium text-sm">No Event Albums Created</p>
                            <p className="text-gray-400 text-xs mt-1 mb-4">
                                Create your first event album (with slug) to organize gallery photos.
                            </p>
                            <button
                                type="button"
                                onClick={openAddAlbum}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white text-xs font-bold cursor-pointer"
                            >
                                <Plus size={14} />
                                Create Event Album
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Upload Photos (Single or Bulk) */}
            {activeTab === "upload" && (
                <div className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-black flex items-center gap-2">
                                Upload Photos into Event
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 normal-case tracking-normal">
                                    Event-Linked
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">
                                Upload multiple photos directly into the selected event album.
                            </p>
                        </div>

                        {queue.length > 0 && !uploading && (
                            <button
                                type="button"
                                onClick={clearQueue}
                                className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer self-start sm:self-auto"
                            >
                                Clear Queue ({queue.length})
                            </button>
                        )}
                    </div>

                    {/* Album Selection Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/80 p-4 rounded-xl border border-gray-100">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-1.5">
                                Target Event Album *
                            </label>
                            <div className="flex items-center gap-2">
                                <select
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-black bg-white focus:outline-none focus:border-black font-medium"
                                    value={selectedAlbumId}
                                    onChange={(e) => setSelectedAlbumId(e.target.value)}
                                    disabled={uploading}
                                >
                                    {albums.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.title} (/gallery/{a.slug})
                                        </option>
                                    ))}
                                    {albums.length === 0 && (
                                        <option value="" disabled>
                                            No albums created yet
                                        </option>
                                    )}
                                </select>
                                <button
                                    type="button"
                                    onClick={openAddAlbum}
                                    className="p-2 rounded-lg bg-black text-white hover:bg-zinc-800 cursor-pointer flex-shrink-0"
                                    title="Create New Event Album"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            {targetAlbumForUpload && (
                                <p className="text-[11px] text-zinc-500 font-mono mt-1">
                                    Direct Link: <strong>/gallery/{targetAlbumForUpload.slug}</strong>
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-1.5">
                                Caption / Title (Optional)
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-black bg-white focus:outline-none focus:border-black"
                                placeholder="e.g. Inaugural Session, Award Distribution"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                disabled={uploading}
                            />
                        </div>
                    </div>

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.heic,.JPG,.JPEG,.PNG"
                        multiple
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                addFilesToQueue(e.target.files);
                                e.target.value = "";
                            }
                        }}
                    />

                    {/* Drag and Drop Zone */}
                    <div
                        onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            dragCounterRef.current += 1;
                            if (!uploading) setIsDragging(true);
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            dragCounterRef.current -= 1;
                            if (dragCounterRef.current <= 0) {
                                setIsDragging(false);
                                dragCounterRef.current = 0;
                            }
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(false);
                            dragCounterRef.current = 0;
                            if (!uploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                addFilesToQueue(e.dataTransfer.files);
                            }
                        }}
                        onClick={() => {
                            if (!uploading) fileInputRef.current?.click();
                        }}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 md:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 select-none",
                            isDragging
                                ? "border-black bg-zinc-100 scale-[0.99]"
                                : "border-gray-200 hover:border-black hover:bg-gray-50/50",
                            uploading && "opacity-60 pointer-events-none bg-gray-50 cursor-not-allowed"
                        )}
                    >
                        <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center text-black">
                            {uploading ? (
                                <Loader2 size={24} className="animate-spin text-black" />
                            ) : (
                                <Upload size={24} />
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-black">
                                {isDragging ? "Drop photos here" : "Click to select or drag & drop photos here"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Supports multiple JPG, PNG, WebP photos.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!uploading) fileInputRef.current?.click();
                            }}
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
                        >
                            <Plus size={14} />
                            Browse Photos from Device
                        </button>
                    </div>

                    {/* Staging Queue & Previews */}
                    {queue.length > 0 && (
                        <div className="space-y-4 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-black">
                                        Selected Photos ({queue.length})
                                    </span>
                                    {uploading && uploadProgress && (
                                        <span className="text-xs text-zinc-500 font-mono">
                                            ({uploadProgress.current}/{uploadProgress.total} uploaded - {uploadProgress.percent}%)
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-black cursor-pointer disabled:opacity-50"
                                >
                                    <Plus size={14} />
                                    Add More Photos
                                </button>
                            </div>

                            {/* Progress Bar */}
                            {uploading && uploadProgress && (
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-black h-full transition-all duration-300 rounded-full"
                                        style={{ width: `${uploadProgress.percent}%` }}
                                    />
                                </div>
                            )}

                            {/* Previews Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-1">
                                {queue.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "relative group rounded-lg overflow-hidden border bg-zinc-50 aspect-square flex flex-col justify-end p-2 transition-all",
                                            item.status === "uploading" && "border-blue-500 ring-2 ring-blue-200",
                                            item.status === "done" && "border-emerald-500 ring-2 ring-emerald-200",
                                            item.status === "error" && "border-red-500 ring-2 ring-red-200",
                                            item.status === "ready" && "border-gray-200"
                                        )}
                                    >
                                        <img
                                            src={item.preview}
                                            alt={item.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                                        {/* Status Badge */}
                                        <div className="absolute top-1.5 left-1.5 z-10">
                                            {item.status === "uploading" && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-600/90 text-white text-[9px] font-bold backdrop-blur-sm">
                                                    <Loader2 size={10} className="animate-spin" /> Uploading
                                                </span>
                                            )}
                                            {item.status === "done" && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[9px] font-bold backdrop-blur-sm">
                                                    <Check size={10} /> Done
                                                </span>
                                            )}
                                            {item.status === "error" && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600/90 text-white text-[9px] font-bold backdrop-blur-sm">
                                                    <AlertCircle size={10} /> Error
                                                </span>
                                            )}
                                        </div>

                                        {/* Remove Button */}
                                        {!uploading && (
                                            <button
                                                type="button"
                                                onClick={() => removeFromQueue(item.id)}
                                                className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                                                title="Remove from queue"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}

                                        {/* File metadata */}
                                        <div className="relative z-10 text-white">
                                            <p className="text-[10px] font-medium truncate leading-tight">
                                                {item.name}
                                            </p>
                                            <p className="text-[9px] text-white/70 font-mono">
                                                {item.sizeFormatted}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Upload Action Button */}
                            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <span className="text-xs text-gray-500">
                                    Target: <strong>{targetAlbumForUpload?.title || "Event Album"}</strong>
                                </span>

                                <button
                                    type="button"
                                    onClick={handleStartUpload}
                                    disabled={uploading || queue.every((q) => q.status === "done")}
                                    className={cn(
                                        "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-md cursor-pointer",
                                        uploading
                                            ? "bg-zinc-400 text-white cursor-not-allowed"
                                            : "bg-black hover:bg-zinc-800 text-white active:scale-98"
                                    )}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Uploading Photos ({uploadProgress?.current || 0}/{uploadProgress?.total || queue.length})...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            Upload {queue.length} Photo{queue.length > 1 ? "s" : ""} to Album
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: All Photos Management & Multi-Delete */}
            {activeTab === "photos" && (
                <div className="space-y-6 animate-in fade-in">
                    {/* Filter and Bulk Action Toolbar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        {/* Search & Album Filters */}
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            <div className="relative min-w-[200px] flex-1 max-w-xs">
                                <Search
                                    size={15}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                                    placeholder="Search photos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Filter size={14} className="text-gray-400 ml-1" />
                                <select
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-black bg-white focus:outline-none focus:border-black cursor-pointer font-medium"
                                    value={selectedAlbumFilter}
                                    onChange={(e) => setSelectedAlbumFilter(e.target.value)}
                                >
                                    <option value="ALL">All Event Albums ({images.length})</option>
                                    {albums.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.title} ({images.filter((img) => img.albumId === a.id || img.eventSlug === a.slug).length})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Bulk selection controls */}
                        {images.length > 0 && (
                            <div className="flex items-center gap-2 self-end sm:self-center">
                                <button
                                    type="button"
                                    onClick={toggleSelectAll}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                                >
                                    {allFilteredSelected ? (
                                        <>
                                            <CheckSquare size={14} className="text-black" /> Deselect All
                                        </>
                                    ) : (
                                        <>
                                            <Square size={14} className="text-gray-400" /> Select All (
                                            {filteredImages.length})
                                        </>
                                    )}
                                </button>

                                {selectedIds.size > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleBulkDelete}
                                        disabled={deleting}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                                    >
                                        {deleting ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                        Delete Selected ({selectedIds.size})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Photos Grid */}
                    {filteredImages.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredImages.map((img) => {
                                const isSelected = selectedIds.has(img.id);
                                return (
                                    <div
                                        key={img.id}
                                        onClick={() => toggleSelect(img.id)}
                                        className={cn(
                                            "group relative bg-gray-100 rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer shadow-sm",
                                            isSelected
                                                ? "border-black ring-2 ring-black/20"
                                                : "border-transparent hover:border-gray-300"
                                        )}
                                    >
                                        <img
                                            src={img.image}
                                            className={cn(
                                                "w-full h-full object-cover transition-transform duration-500",
                                                isSelected ? "scale-95" : "group-hover:scale-105"
                                            )}
                                            alt={img.title || "Gallery image"}
                                        />

                                        {/* Event Badge */}
                                        {(img.album?.title || img.event) && (
                                            <span className="absolute top-2 left-2 bg-black/70 text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded backdrop-blur-sm z-10 pointer-events-none">
                                                {img.album?.title || img.event}
                                            </span>
                                        )}

                                        {/* Selection Checkbox badge */}
                                        <div
                                            className={cn(
                                                "absolute top-2 right-2 z-20 w-6 h-6 rounded-md flex items-center justify-center transition-all",
                                                isSelected
                                                    ? "bg-black text-white"
                                                    : "bg-black/40 text-white opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                                            )}
                                        >
                                            <Check size={14} className={isSelected ? "opacity-100" : "opacity-0"} />
                                        </div>

                                        {/* Hover Overlay */}
                                        <div
                                            className={cn(
                                                "absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity flex flex-col justify-end p-3",
                                                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                            )}
                                        >
                                            {img.title && (
                                                <p className="text-white text-xs font-medium mb-2 line-clamp-2 leading-tight">
                                                    {img.title}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between pt-1 border-t border-white/20">
                                                <span className="text-[10px] text-white/70 font-mono">
                                                    {isSelected ? "Selected" : "Click to select"}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDelete(img.id);
                                                    }}
                                                    title="Delete photo"
                                                    className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-red-600 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow cursor-pointer"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-24 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center bg-gray-50/50">
                            <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-600 text-sm font-medium">No photos found</p>
                            <p className="text-gray-400 text-xs mt-1">
                                {images.length > 0
                                    ? "Try changing your filter or search query."
                                    : "Upload photos to get started with your gallery."}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Create or Edit Event Album */}
            {isAlbumModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-black">
                                    {editingAlbum ? "Edit Event Album" : "Create New Event Album"}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Set album title, URL slug, and optional event details
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAlbumModalOpen(false)}
                                className="text-gray-400 hover:text-black cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAlbum} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                    Event Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-black focus:outline-none focus:border-black font-medium"
                                    placeholder="e.g. Sahithyotsav 2026, Students Council"
                                    value={albumForm.title}
                                    onChange={(e) => {
                                        const title = e.target.value;
                                        setAlbumForm((prev) => ({
                                            ...prev,
                                            title,
                                            slug: !editingAlbum ? cleanSlug(title) : prev.slug,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                    URL Slug *
                                </label>
                                <div className="flex items-center">
                                    <span className="bg-zinc-100 border border-r-0 border-gray-200 px-3 py-2 text-xs font-mono text-zinc-500 rounded-l-lg select-none">
                                        /gallery/
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-200 rounded-r-lg px-3.5 py-2 text-xs font-mono text-black focus:outline-none focus:border-black"
                                        placeholder="sahithyotsav-2026"
                                        value={albumForm.slug}
                                        onChange={(e) =>
                                            setAlbumForm({ ...albumForm, slug: cleanSlug(e.target.value) })
                                        }
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Public visitors can access photos for this event at this URL.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                        Date
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black"
                                        placeholder="e.g. August 15-17, 2026"
                                        value={albumForm.date}
                                        onChange={(e) => setAlbumForm({ ...albumForm, date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                        Venue / Location
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black"
                                        placeholder="e.g. Cherukavu, Pulikkal"
                                        value={albumForm.location}
                                        onChange={(e) =>
                                            setAlbumForm({ ...albumForm, location: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                                    Description (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full border border-gray-200 rounded-lg p-3 text-xs text-black focus:outline-none focus:border-black"
                                    placeholder="Brief note about the event album..."
                                    value={albumForm.description}
                                    onChange={(e) =>
                                        setAlbumForm({ ...albumForm, description: e.target.value })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAlbumModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingAlbum}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                                >
                                    {savingAlbum && <Loader2 size={13} className="animate-spin" />}
                                    {editingAlbum ? "Update Album" : "Create Album"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
