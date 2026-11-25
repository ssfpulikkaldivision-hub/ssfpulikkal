"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Image as ImageIcon, Upload, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass = "w-full border border-gray-100 rounded-lg px-4 py-3 text-sm text-black placeholder:text-gray-300 focus:outline-none focus:border-black transition-colors";
const labelClass = "text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2";
const textareaClass = `${inputClass} resize-none`;

function SaveButton({ saving, label }: { saving: boolean; label: string }) {
    return (
        <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 cursor-pointer"
        >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {label}
        </button>
    );
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("hero");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [uploadingHero, setUploadingHero] = useState(false);

    // Multi-Banner Images State
    const [heroImages, setHeroImages] = useState<string[]>([]);
    const [newHeroImageUrl, setNewHeroImageUrl] = useState("");

    // Dynamic Lists State
    const [ctaList, setCtaList] = useState<{ text: string; link: string; hidden?: boolean }[]>([]);
    const [navList, setNavList] = useState<{ name: string; href: string; hidden?: boolean }[]>([]);
    const [footerList, setFooterList] = useState<{ name: string; href: string; hidden?: boolean }[]>([]);

    const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploadingHero(true);
        const uploadedUrls: string[] = [];
        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append("file", files[i]);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                const uploadData = await uploadRes.json();
                if (uploadData.url) {
                    uploadedUrls.push(uploadData.url);
                }
            }
            if (uploadedUrls.length > 0) {
                const updatedList = [...heroImages, ...uploadedUrls];
                setHeroImages(updatedList);
                setSettings((prev: any) => ({
                    ...prev,
                    hero: {
                        ...prev.hero,
                        bannerImage: updatedList[0] || "",
                        bannerImages: JSON.stringify(updatedList),
                    },
                }));
            }
        } catch {
            alert("Upload failed");
        } finally {
            setUploadingHero(false);
            e.target.value = "";
        }
    };

    const handleAddHeroImageUrl = () => {
        const trimmed = newHeroImageUrl.trim();
        if (!trimmed) return;
        const updatedList = [...heroImages, trimmed];
        setHeroImages(updatedList);
        setSettings((prev: any) => ({
            ...prev,
            hero: {
                ...prev.hero,
                bannerImage: updatedList[0] || "",
                bannerImages: JSON.stringify(updatedList),
            },
        }));
        setNewHeroImageUrl("");
    };

    const handleRemoveHeroImage = (index: number) => {
        const updatedList = heroImages.filter((_, i) => i !== index);
        setHeroImages(updatedList);
        setSettings((prev: any) => ({
            ...prev,
            hero: {
                ...prev.hero,
                bannerImage: updatedList[0] || "",
                bannerImages: JSON.stringify(updatedList),
            },
        }));
    };

    const handleMoveHeroImage = (index: number, direction: "up" | "down") => {
        if (
            (direction === "up" && index === 0) ||
            (direction === "down" && index === heroImages.length - 1)
        ) {
            return;
        }
        const updatedList = [...heroImages];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        const temp = updatedList[index];
        updatedList[index] = updatedList[targetIndex];
        updatedList[targetIndex] = temp;
        setHeroImages(updatedList);
        setSettings((prev: any) => ({
            ...prev,
            hero: {
                ...prev.hero,
                bannerImage: updatedList[0] || "",
                bannerImages: JSON.stringify(updatedList),
            },
        }));
    };

    const handleUpdateHero = async () => {
        const updatedHero = {
            ...settings.hero,
            bannerImage: heroImages[0] || settings.hero?.bannerImage || "",
            bannerImages: JSON.stringify(heroImages),
        };
        await handleUpdate("hero", updatedHero);
    };

    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                setSettings(data);

                // Initialize Hero Banner Images
                let bannerImgs: string[] = [];
                if (data?.hero?.bannerImages) {
                    try {
                        const parsed = JSON.parse(data.hero.bannerImages);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            bannerImgs = parsed.filter(
                                (img) => typeof img === "string" && img.trim().length > 0
                            );
                        }
                    } catch (e) {}
                }
                if (bannerImgs.length === 0 && data?.hero?.bannerImage?.trim()) {
                    bannerImgs = [data.hero.bannerImage.trim()];
                }
                setHeroImages(bannerImgs);

                // Initialize CTA Buttons
                let ctas: { text: string; link: string; hidden?: boolean }[] = [];
                if (data?.navbar?.ctaButtons) {
                    try {
                        const parsed = JSON.parse(data.navbar.ctaButtons);
                        if (Array.isArray(parsed) && parsed.length > 0) ctas = parsed;
                    } catch (e) {}
                }
                if (ctas.length === 0 && data?.navbar?.loginText) {
                    ctas = [{ text: data.navbar.loginText, link: data.navbar.loginLink || "/admin", hidden: false }];
                }
                if (ctas.length === 0) {
                    ctas = [{ text: "Login", link: "/admin", hidden: false }];
                }
                setCtaList(ctas);

                // Initialize Nav Links
                let navs: { name: string; href: string; hidden?: boolean }[] = [];
                if (data?.navbar?.links) {
                    try {
                        const parsed = JSON.parse(data.navbar.links);
                        if (Array.isArray(parsed) && parsed.length > 0) navs = parsed;
                    } catch (e) {}
                }
                if (navs.length === 0) {
                    navs = [
                        { name: "Home", href: "/", hidden: false },
                        { name: "Events", href: "/events", hidden: false },
                        { name: "News", href: "/#news", hidden: false },
                        { name: "Sahithyotsav", href: "/sahithyotsav", hidden: false },
                        { name: "Gallery", href: "/gallery", hidden: false },
                        { name: "Contact", href: "/#contact", hidden: false },
                    ];
                }
                setNavList(navs);

                // Initialize Footer Links
                let footers: { name: string; href: string; hidden?: boolean }[] = [
                    { name: "Home", href: "/" },
                    { name: "News", href: "/news" },
                    { name: "Gallery", href: "/gallery" },
                    { name: "About SSF", href: "/about" },
                    { name: "Privacy Policy", href: "/privacy" },
                ];
                if (data?.footer?.links) {
                    try {
                        const parsed = JSON.parse(data.footer.links);
                        if (Array.isArray(parsed) && parsed.length > 0) footers = parsed;
                    } catch (e) {}
                }
                setFooterList(footers);

                setLoading(false);
            });
    }, []);

    const handleUpdate = async (type: string, data: any) => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, data }),
            });
            if (res.ok) alert("Saved successfully!");
            else { const err = await res.json(); alert(`Failed: ${err.error || res.statusText}`); }
        } catch { alert("Failed to update"); }
        finally { setSaving(false); }
    };

    // CTA Handlers
    const handleAddCtaButton = () => {
        setCtaList([...ctaList, { text: "", link: "", hidden: false }]);
    };
    const handleUpdateCtaButton = (index: number, field: "text" | "link", val: string) => {
        const updated = [...ctaList];
        updated[index] = { ...updated[index], [field]: val };
        setCtaList(updated);
    };
    const handleToggleHideCtaButton = (index: number) => {
        const updated = [...ctaList];
        updated[index] = { ...updated[index], hidden: !updated[index].hidden };
        setCtaList(updated);
    };
    const handleRemoveCtaButton = (index: number) => {
        setCtaList(ctaList.filter((_, i) => i !== index));
    };

    // Nav Link Handlers
    const handleAddNavLink = () => {
        setNavList([...navList, { name: "", href: "", hidden: false }]);
    };
    const handleUpdateNavLink = (index: number, field: "name" | "href", val: string) => {
        const updated = [...navList];
        updated[index] = { ...updated[index], [field]: val };
        setNavList(updated);
    };
    const handleToggleHideNavLink = (index: number) => {
        const updated = [...navList];
        updated[index] = { ...updated[index], hidden: !updated[index].hidden };
        setNavList(updated);
    };
    const handleRemoveNavLink = (index: number) => {
        setNavList(navList.filter((_, i) => i !== index));
    };

    // Footer Link Handlers
    const handleAddFooterLink = () => {
        setFooterList([...footerList, { name: "", href: "", hidden: false }]);
    };
    const handleUpdateFooterLink = (index: number, field: "name" | "href", val: string) => {
        const updated = [...footerList];
        updated[index] = { ...updated[index], [field]: val };
        setFooterList(updated);
    };
    const handleToggleHideFooterLink = (index: number) => {
        const updated = [...footerList];
        updated[index] = { ...updated[index], hidden: !updated[index].hidden };
        setFooterList(updated);
    };
    const handleRemoveFooterLink = (index: number) => {
        setFooterList(footerList.filter((_, i) => i !== index));
    };

    const handleUpdateNavbar = async () => {
        const updatedNavbar = {
            ...settings.navbar,
            ctaButtons: JSON.stringify(ctaList),
            links: JSON.stringify(navList),
            loginText: ctaList[0]?.text || "",
            loginLink: ctaList[0]?.link || "",
        };
        await handleUpdate("navbar", updatedNavbar);
    };

    const handleUpdateFooter = async () => {
        const updatedFooter = {
            ...settings.footer,
            links: JSON.stringify(footerList),
        };
        await handleUpdate("footer", updatedFooter);
    };

    const tabs = [
        { id: "hero", label: "Hero" },
        { id: "contact", label: "Contact" },
        { id: "footer", label: "Footer" },
        { id: "navbar", label: "Navbar" },
    ];

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
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Configuration</p>
                <h1 className="text-4xl font-display font-medium text-black tracking-tight">Section Editor</h1>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-100">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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

            {/* Panel */}
            <div className="bg-white border border-gray-100 rounded-xl p-8">

                {/* Hero */}
                {activeTab === "hero" && (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateHero(); }} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className={labelClass}>Banner Title</label>
                                    <input type="text" className={inputClass} value={settings.hero.title}
                                        onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, title: e.target.value } })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Subtitle</label>
                                    <textarea className={textareaClass} rows={4} value={settings.hero.subtitle}
                                        onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, subtitle: e.target.value } })} />
                                </div>
                            </div>

                            {/* Multi-Image Banner Slider Management */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <label className={labelClass + " mb-0"}>Banner Images (Slide / Carousel)</label>
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black text-white">
                                            {heroImages.length} {heroImages.length === 1 ? "Image" : "Images"}
                                        </span>
                                    </div>

                                    {/* Upload Multiple Button */}
                                    <label
                                        className={cn(
                                            "inline-flex items-center gap-2 bg-black text-white px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-gray-900 transition-colors cursor-pointer flex-shrink-0 shadow-sm",
                                            uploadingHero && "opacity-50 pointer-events-none"
                                        )}
                                    >
                                        {uploadingHero ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                        {uploadingHero ? "Uploading..." : "Upload Images"}
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleHeroImageUpload}
                                            accept="image/*"
                                            multiple
                                        />
                                    </label>
                                </div>

                                {/* Add Image by URL input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={newHeroImageUrl}
                                        onChange={(e) => setNewHeroImageUrl(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddHeroImageUrl();
                                            }
                                        }}
                                        placeholder="Paste image URL (/uploads/... or https://...)"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddHeroImageUrl}
                                        disabled={!newHeroImageUrl.trim()}
                                        className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-black px-4 py-2.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer flex-shrink-0"
                                    >
                                        <Plus size={14} /> Add
                                    </button>
                                </div>

                                {/* Images List */}
                                {heroImages.length === 0 ? (
                                    <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50">
                                        <ImageIcon className="mx-auto text-gray-300 w-10 h-10 mb-2" />
                                        <p className="text-xs font-medium text-gray-600">No banner images added</p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            Upload images or paste a URL to add to the hero slideshow.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                        {heroImages.map((imgUrl, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-200 transition-all shadow-sm"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-16 h-11 rounded-lg overflow-hidden bg-gray-200 border border-gray-300 flex-shrink-0 relative">
                                                        <img
                                                            src={imgUrl}
                                                            alt={`Slide ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).style.display = "none";
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[11px] font-bold text-black uppercase tracking-wider">
                                                                Slide {index + 1}
                                                            </span>
                                                            {index === 0 && (
                                                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    Initial Cover
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-400 truncate max-w-[180px] sm:max-w-xs font-mono" title={imgUrl}>
                                                            {imgUrl}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Reorder and Delete controls */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveHeroImage(index, "up")}
                                                        disabled={index === 0}
                                                        title="Move Up"
                                                        className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-25 cursor-pointer"
                                                    >
                                                        <ArrowUp size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveHeroImage(index, "down")}
                                                        disabled={index === heroImages.length - 1}
                                                        title="Move Down"
                                                        className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-25 cursor-pointer"
                                                    >
                                                        <ArrowDown size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveHeroImage(index)}
                                                        title="Delete Image"
                                                        className="w-7 h-7 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 flex items-center justify-center transition-colors cursor-pointer ml-1"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                            {/* Button 1 */}
                            <div className={cn(
                                "p-5 rounded-xl border transition-all",
                                settings.hero.showBtn1 === false ? "bg-gray-50/70 border-dashed border-gray-200" : "bg-white border-gray-100 shadow-sm"
                            )}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Button 1 (Primary)</p>
                                        {settings.hero.showBtn1 === false && (
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSettings({
                                            ...settings,
                                            hero: { ...settings.hero, showBtn1: settings.hero.showBtn1 === false ? true : false }
                                        })}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                                            settings.hero.showBtn1 === false
                                                ? "text-amber-700 bg-amber-100/70 hover:bg-amber-200/70"
                                                : "text-gray-600 bg-gray-100 hover:text-black hover:bg-gray-200"
                                        )}
                                        title={settings.hero.showBtn1 === false ? "Hidden from site - Click to show" : "Visible on site - Click to hide"}
                                    >
                                        {settings.hero.showBtn1 === false ? (
                                            <>
                                                <EyeOff size={14} /> Hidden
                                            </>
                                        ) : (
                                            <>
                                                <Eye size={14} /> Visible
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Text</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={settings.hero.btn1Text || ""}
                                            onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, btn1Text: e.target.value } })}
                                            placeholder="Button text..."
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Link</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={settings.hero.btn1Link || ""}
                                            onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, btn1Link: e.target.value } })}
                                            placeholder="/news or https://..."
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">
                                    {settings.hero.showBtn1 === false ? "This button will not be displayed on the home page." : "This button will be displayed on the home page hero section."}
                                </p>
                            </div>

                            {/* Button 2 */}
                            <div className={cn(
                                "p-5 rounded-xl border transition-all",
                                settings.hero.showBtn2 === false ? "bg-gray-50/70 border-dashed border-gray-200" : "bg-white border-gray-100 shadow-sm"
                            )}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Button 2 (Secondary)</p>
                                        {settings.hero.showBtn2 === false && (
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSettings({
                                            ...settings,
                                            hero: { ...settings.hero, showBtn2: settings.hero.showBtn2 === false ? true : false }
                                        })}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                                            settings.hero.showBtn2 === false
                                                ? "text-amber-700 bg-amber-100/70 hover:bg-amber-200/70"
                                                : "text-gray-600 bg-gray-100 hover:text-black hover:bg-gray-200"
                                        )}
                                        title={settings.hero.showBtn2 === false ? "Hidden from site - Click to show" : "Visible on site - Click to hide"}
                                    >
                                        {settings.hero.showBtn2 === false ? (
                                            <>
                                                <EyeOff size={14} /> Hidden
                                            </>
                                        ) : (
                                            <>
                                                <Eye size={14} /> Visible
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Text</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={settings.hero.btn2Text || ""}
                                            onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, btn2Text: e.target.value } })}
                                            placeholder="Button text..."
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Link</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={settings.hero.btn2Link || ""}
                                            onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, btn2Link: e.target.value } })}
                                            placeholder="#about or https://..."
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">
                                    {settings.hero.showBtn2 === false ? "This button will not be displayed on the home page." : "This button will be displayed on the home page hero section."}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <SaveButton saving={saving} label="Save Hero" />
                        </div>
                    </form>
                )}

                {/* Contact */}
                {activeTab === "contact" && (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdate("contact", settings.contact); }} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-5">
                                <div>
                                    <label className={labelClass}>Address</label>
                                    <textarea className={textareaClass} rows={4} value={settings.contact.address}
                                        onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, address: e.target.value } })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Phone</label>
                                        <input type="text" className={inputClass} value={settings.contact.phone}
                                            onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, phone: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input type="email" className={inputClass} value={settings.contact.email}
                                            onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, email: e.target.value } })} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Maps Embed URL</label>
                                    <input type="text" className={inputClass} value={settings.contact.mapEmbed}
                                        onChange={(e) => setSettings({ ...settings, contact: { ...settings.contact, mapEmbed: e.target.value } })} />
                                    <p className="text-xs text-gray-300 mt-2">Paste the 'src' value from Google Maps iframe embed code.</p>
                                </div>
                                {settings.contact.mapEmbed && (
                                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-100">
                                        <iframe src={settings.contact.mapEmbed} className="w-full h-full border-0" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-50">
                            <SaveButton saving={saving} label="Save Contact" />
                        </div>
                    </form>
                )}

                {/* Footer */}
                {activeTab === "footer" && (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateFooter(); }} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-5">
                                <div>
                                    <label className={labelClass}>About Text (Footer)</label>
                                    <textarea className={textareaClass} rows={4} value={settings.footer.aboutText}
                                        onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, aboutText: e.target.value } })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Copyright Text</label>
                                    <input type="text" className={inputClass} value={settings.footer.copyright}
                                        onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, copyright: e.target.value } })} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Social Links (JSON)</label>
                                <textarea className={cn(textareaClass, "font-mono text-xs")} rows={6} value={settings.footer.socialLinks}
                                    onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, socialLinks: e.target.value } })} />
                                <p className="text-xs text-gray-300 mt-2">{"Example: {\"facebook\": \"url\", \"instagram\": \"url\", \"youtube\": \"url\"}"}</p>
                            </div>
                        </div>

                        {/* Organization Links Manager (Image 3) */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                <div>
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-black">Organization / Footer Links</h4>
                                    <p className="text-xs text-gray-400">Add, edit, or remove links displayed under &quot;Organization&quot; in the footer.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddFooterLink}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-black text-white px-3.5 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer self-start sm:self-auto"
                                >
                                    <Plus size={14} /> Add Footer Link
                                </button>
                            </div>

                            <div className="space-y-3">
                                {footerList.map((item, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "grid grid-cols-12 gap-3 items-center p-3.5 rounded-lg border transition-all",
                                            item.hidden ? "bg-amber-50/40 border-amber-200/60 opacity-80" : "bg-gray-50/70 border-gray-100"
                                        )}
                                    >
                                        <div className="col-span-12 sm:col-span-5">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Link Title</label>
                                                {item.hidden && (
                                                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded">Hidden</span>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                className={cn(inputClass, "bg-white py-2 text-xs")}
                                                placeholder="e.g. Home, About SSF, Privacy Policy"
                                                value={item.name}
                                                onChange={(e) => handleUpdateFooterLink(index, "name", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-8 sm:col-span-5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Target URL</label>
                                            <input
                                                type="text"
                                                className={cn(inputClass, "bg-white py-2 text-xs font-mono")}
                                                placeholder="e.g. /, /news, /privacy"
                                                value={item.href}
                                                onChange={(e) => handleUpdateFooterLink(index, "href", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1 pt-5">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleHideFooterLink(index)}
                                                className={cn(
                                                    "p-2 rounded-lg transition-colors cursor-pointer",
                                                    item.hidden
                                                        ? "text-amber-600 bg-amber-100/70 hover:bg-amber-200/70"
                                                        : "text-gray-400 hover:text-black hover:bg-gray-200/60"
                                                )}
                                                title={item.hidden ? "Hidden from site - Click to show" : "Visible on site - Click to hide"}
                                            >
                                                {item.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFooterLink(index)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                title="Remove link"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {footerList.length === 0 && (
                                    <p className="text-xs text-gray-400 italic py-4 text-center">No footer links configured. Click &quot;Add Footer Link&quot; to add links.</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <SaveButton saving={saving} label="Save Footer" />
                        </div>
                    </form>
                )}

                {/* Navbar */}
                {activeTab === "navbar" && (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateNavbar(); }} className="space-y-8">
                        <div className="space-y-8">
                            {/* Logo */}
                            <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                <label className={labelClass}>Logo Text (After &quot;SSF&quot;)</label>
                                <input
                                    type="text"
                                    className={cn(inputClass, "max-w-md bg-white")}
                                    value={settings.navbar.logoText}
                                    onChange={(e) => setSettings({ ...settings, navbar: { ...settings.navbar, logoText: e.target.value } })}
                                />
                            </div>

                            {/* Header Action Buttons / CTA Buttons (Image 1 & 2) */}
                            <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-black">Header Action Buttons (CTA Buttons)</h4>
                                        <p className="text-xs text-gray-400">Add buttons to appear on the right side of the navbar (e.g. Sahityotsav, Login, Register)</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddCtaButton}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-black text-white px-3.5 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer self-start sm:self-auto"
                                    >
                                        <Plus size={14} /> Add Button
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {ctaList.map((btn, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "grid grid-cols-12 gap-3 items-center p-3.5 rounded-lg border transition-all",
                                                btn.hidden ? "bg-amber-50/40 border-amber-200/60 opacity-80" : "bg-gray-50/70 border-gray-100"
                                            )}
                                        >
                                            <div className="col-span-12 sm:col-span-5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Button Text</label>
                                                    {btn.hidden && (
                                                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded">Hidden</span>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    className={cn(inputClass, "bg-white py-2 text-xs")}
                                                    placeholder="e.g. Sahityotsav, Login"
                                                    value={btn.text}
                                                    onChange={(e) => handleUpdateCtaButton(index, "text", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-span-8 sm:col-span-5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Target URL</label>
                                                <input
                                                    type="text"
                                                    className={cn(inputClass, "bg-white py-2 text-xs font-mono")}
                                                    placeholder="e.g. /sahithyotsav, /admin"
                                                    value={btn.link}
                                                    onChange={(e) => handleUpdateCtaButton(index, "link", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1 pt-5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleHideCtaButton(index)}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors cursor-pointer",
                                                        btn.hidden
                                                            ? "text-amber-600 bg-amber-100/70 hover:bg-amber-200/70"
                                                            : "text-gray-400 hover:text-black hover:bg-gray-200/60"
                                                    )}
                                                    title={btn.hidden ? "Hidden from site - Click to show" : "Visible on site - Click to hide"}
                                                >
                                                    {btn.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCtaButton(index)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Remove button"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {ctaList.length === 0 && (
                                        <p className="text-xs text-gray-400 italic py-4 text-center">No action buttons added. Click &quot;Add Button&quot; to create one.</p>
                                    )}
                                </div>
                            </div>

                            {/* Navigation Menu Links */}
                            <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-black">Navigation Menu Links</h4>
                                        <p className="text-xs text-gray-400">Add or reorder links in the main navigation bar (Home, Events, News, Sahithyotsav, Gallery, Contact)</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddNavLink}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-black text-white px-3.5 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer self-start sm:self-auto"
                                    >
                                        <Plus size={14} /> Add Menu Link
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {navList.map((item, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "grid grid-cols-12 gap-3 items-center p-3.5 rounded-lg border transition-all",
                                                item.hidden ? "bg-amber-50/40 border-amber-200/60 opacity-80" : "bg-gray-50/70 border-gray-100"
                                            )}
                                        >
                                            <div className="col-span-12 sm:col-span-5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Link Title</label>
                                                    {item.hidden && (
                                                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded">Hidden</span>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    className={cn(inputClass, "bg-white py-2 text-xs")}
                                                    placeholder="e.g. Events, About"
                                                    value={item.name}
                                                    onChange={(e) => handleUpdateNavLink(index, "name", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-span-8 sm:col-span-5">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Target URL</label>
                                                <input
                                                    type="text"
                                                    className={cn(inputClass, "bg-white py-2 text-xs font-mono")}
                                                    placeholder="e.g. /events, #news"
                                                    value={item.href}
                                                    onChange={(e) => handleUpdateNavLink(index, "href", e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1 pt-5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleHideNavLink(index)}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors cursor-pointer",
                                                        item.hidden
                                                            ? "text-amber-600 bg-amber-100/70 hover:bg-amber-200/70"
                                                            : "text-gray-400 hover:text-black hover:bg-gray-200/60"
                                                    )}
                                                    title={item.hidden ? "Hidden from site - Click to show" : "Visible on site - Click to hide"}
                                                >
                                                    {item.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveNavLink(index)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Remove link"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {navList.length === 0 && (
                                        <p className="text-xs text-gray-400 italic py-4 text-center">No menu links. Click &quot;Add Menu Link&quot; to add links.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <SaveButton saving={saving} label="Save Navbar" />
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
