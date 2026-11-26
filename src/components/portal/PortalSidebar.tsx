"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Building2,
    UserCircle,
    HelpCircle,
    ExternalLink,
    LogOut,
    ChevronRight,
    Menu,
    X,
    Shield,
    Layers,
    Droplets,
    Trophy,
    HeartHandshake,
    Target,
    Users,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalSidebarProps {
    session: {
        id: string;
        type: "DIVISION" | "SECTOR" | "UNIT";
        name: string;
        code: string | null;
        username: string;
        sectorName?: string;
    };
}

interface PortalCampaignItem {
    id: string;
    title: string;
    slug: string;
    description?: string;
    category?: string;
    targetAudience: string;
    status: string;
    attachmentUrl?: string | null;
    bannerImage?: string | null;
}

export function PortalSidebar({ session }: PortalSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [campaigns, setCampaigns] = useState<PortalCampaignItem[]>([]);

    useEffect(() => {
        let isMounted = true;
        const CACHE_KEY = `portal_campaigns_${session.id}`;
        const CACHE_TTL = 60 * 1000; // 60 seconds

        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL && Array.isArray(data)) {
                    setCampaigns(data);
                    return;
                }
            }
        } catch {
            // Ignore sessionStorage errors
        }

        async function fetchActiveCampaigns() {
            try {
                const res = await fetch("/api/portal/campaigns");
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && Array.isArray(data.campaigns)) {
                        const active = data.campaigns.filter((c: PortalCampaignItem) => c.status === "ACTIVE");
                        setCampaigns(active);
                        try {
                            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: active, timestamp: Date.now() }));
                        } catch {}
                    }
                }
            } catch {
                // Silently fallback if network issue
            }
        }
        fetchActiveCampaigns();
        return () => {
            isMounted = false;
        };
    }, [session.id]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await fetch("/api/portal/auth/logout", { method: "POST" });
            router.push("/portal/login");
            router.refresh();
        } catch {
            window.location.href = "/portal/login";
        }
    };

    const getCampaignIcon = (camp: PortalCampaignItem) => {
        const iconKey = (camp.bannerImage || "").toLowerCase();
        const slug = (camp.slug || "").toLowerCase();
        const title = (camp.title || "").toLowerCase();

        if (iconKey === "droplets" || slug.includes("payasam") || title.includes("payasam")) {
            return <Droplets size={19} className="text-amber-600" />;
        }
        if (iconKey === "trophy" || slug.includes("sahithyotsav") || title.includes("sahithyotsav")) {
            return <Trophy size={19} className="text-purple-600" />;
        }
        if (iconKey === "heart" || slug.includes("relief") || title.includes("relief")) {
            return <HeartHandshake size={19} className="text-rose-600" />;
        }
        if (iconKey === "users" || slug.includes("membership") || title.includes("membership")) {
            return <Users size={19} className="text-blue-600" />;
        }
        return <Target size={19} className="text-emerald-600" />;
    };

    const getCampaignHref = (camp: PortalCampaignItem) => {
        if (camp.attachmentUrl && camp.attachmentUrl.startsWith("/")) {
            return camp.attachmentUrl;
        }
        if (camp.slug.includes("payasam")) {
            return "/portal/payasam-challenge";
        }
        return `/portal/campaigns/${camp.id}`;
    };

    const cleanCampaignTitle = (title: string) => {
        // Remove parenthetical English subtitle if present for cleaner sidebar item or keep concise
        const match = title.match(/\((.*?)\)/);
        if (match && match[1]) {
            return match[1].trim(); // e.g. "Payasam Challenge"
        }
        return title;
    };

    const isActive = (href: string, exact = false) => {
        if (exact) return pathname === href;
        return pathname === href || pathname.startsWith(href + "/");
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white text-gray-800">
            {/* Logo Area */}
            <div className="p-6 pb-5 border-b border-gray-100 flex items-center justify-between">
                <Link href="/portal" className="flex flex-col group">
                    <span className="ssf-font font-black text-2xl tracking-tight text-black leading-none">
                        SSF
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-gray-800 uppercase mt-0.5">
                        PULIKKAL DIVISION
                    </span>
                </Link>
                {/* Mobile close button */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                {/* Dashboard */}
                <Link
                    href="/portal"
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                        isActive("/portal", true)
                            ? "bg-[#ebf6ee] text-[#1b7a42] font-semibold shadow-2xs"
                            : "text-gray-600 hover:text-gray-950 hover:bg-gray-50"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <span className={cn(isActive("/portal", true) ? "text-[#1b7a42]" : "text-gray-500 group-hover:text-gray-800")}>
                            <LayoutDashboard size={19} />
                        </span>
                        <span>Dashboard</span>
                    </div>
                </Link>

                {/* Dynamic Campaigns Section (Items added by Admin for this Sector/Unit) */}
                {campaigns.length > 0 && (
                    <div className="pt-3 pb-1">
                        <div className="px-3.5 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                            <span>Modules</span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-full font-bold">
                                {campaigns.length}
                            </span>
                        </div>
                        <div className="space-y-1">
                            {campaigns.map((camp) => {
                                const href = getCampaignHref(camp);
                                const active = isActive(href);
                                return (
                                    <Link
                                        key={camp.id}
                                        href={href}
                                        onClick={() => setIsMobileOpen(false)}
                                        className={cn(
                                            "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                            active
                                                ? "bg-[#ebf6ee] text-[#1b7a42] font-semibold shadow-2xs"
                                                : "text-gray-700 hover:text-gray-950 hover:bg-gray-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            <span className={cn(active ? "text-[#1b7a42]" : "")}>
                                                {getCampaignIcon(camp)}
                                            </span>
                                            <span className="truncate">{cleanCampaignTitle(camp.title)}</span>
                                        </div>
                                        <span className={cn(
                                            "px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider shrink-0",
                                            active ? "bg-[#1b7a42] text-white" : "bg-emerald-100 text-emerald-800"
                                        )}>
                                            Live
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Standard Portal Modules */}
                <div className="pt-2 space-y-1">
                    {session.type !== "UNIT" && (
                        <Link
                            href="/portal/entities"
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                isActive("/portal/entities")
                                    ? "bg-[#ebf6ee] text-[#1b7a42] font-semibold shadow-2xs"
                                    : "text-gray-600 hover:text-gray-950 hover:bg-gray-50"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn(isActive("/portal/entities") ? "text-[#1b7a42]" : "text-gray-500 group-hover:text-gray-800")}>
                                    <Building2 size={19} />
                                </span>
                                <span>{session.type === "SECTOR" ? "Units" : "Entities"}</span>
                            </div>
                            <ChevronRight
                                size={15}
                                className={cn(
                                    "transition-transform",
                                    isActive("/portal/entities") ? "text-[#1b7a42]" : "text-gray-300 group-hover:text-gray-500"
                                )}
                            />
                        </Link>
                    )}

                    {session.type === "DIVISION" && (
                        <>
                            <Link
                                href="/portal/profile"
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                    isActive("/portal/profile")
                                        ? "bg-[#ebf6ee] text-[#1b7a42] font-semibold shadow-2xs"
                                        : "text-gray-600 hover:text-gray-950 hover:bg-gray-50"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn(isActive("/portal/profile") ? "text-[#1b7a42]" : "text-gray-500 group-hover:text-gray-800")}>
                                        <UserCircle size={19} />
                                    </span>
                                    <span>My Account</span>
                                </div>
                            </Link>

                            <a
                                href="/admin"
                                target="_blank"
                                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/60 transition-colors mt-2"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Shield size={16} className="text-amber-700" />
                                    <span>Admin Panel</span>
                                </div>
                                <ExternalLink size={13} className="text-amber-600" />
                            </a>
                        </>
                    )}
                </div>
            </nav>

            {/* Bottom Logout Area */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50/60 hover:bg-red-50 rounded-xl border border-red-100/60 transition-colors"
                >
                    <LogOut size={15} />
                    <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Left Sidebar */}
            <aside className="hidden md:flex flex-col w-64 border-r border-gray-200/80 bg-white fixed inset-y-0 left-0 z-30">
                <SidebarContent />
            </aside>

            {/* Mobile Top Header */}
            <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
                        aria-label="Open menu"
                    >
                        <Menu size={22} />
                    </button>
                    <div className="flex flex-col">
                        <span className="ssf-font font-black text-lg text-black leading-none">SSF</span>
                        <span className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">PORTAL</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                        {session.name}
                    </span>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-2xs flex">
                    <div className="w-64 max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
                        <SidebarContent />
                    </div>
                    <div className="flex-1" onClick={() => setIsMobileOpen(false)} />
                </div>
            )}
        </>
    );
}
