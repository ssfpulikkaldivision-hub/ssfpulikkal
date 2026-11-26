"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
    Building2,
    Droplets,
    Trophy,
    HeartHandshake,
    Users,
    Layers,
    Sparkles,
    Loader2,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignItem {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    status: string;
    attachmentUrl?: string | null;
    bannerImage?: string | null;
}

interface WorkspaceModule {
    id: string;
    title: string;
    description: string;
    category: string;
    href: string;
    icon: React.ReactNode;
}

export default function PortalCampaignsPage() {
    const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const CACHE_KEY = "portal_campaigns_list_cache";
        const CACHE_TTL = 60 * 1000;

        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL && Array.isArray(data)) {
                    setCampaigns(data);
                    setLoading(false);
                }
            }
        } catch {}

        async function fetchCampaigns() {
            try {
                const res = await fetch("/api/portal/campaigns");
                if (res.ok) {
                    const data = await res.json();
                    const list = data.campaigns || [];
                    setCampaigns(list);
                    try {
                        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: list, timestamp: Date.now() }));
                    } catch {}
                }
            } catch (err) {
                console.error("Failed to load portal campaigns", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCampaigns();
    }, []);

    const getModuleIcon = (slug: string, title: string, bannerImage?: string | null) => {
        const key = ((bannerImage || "") + " " + slug + " " + title).toLowerCase();
        if (key.includes("payasam") || key.includes("droplets")) {
            return <Droplets size={20} className="text-emerald-700" />;
        }
        if (key.includes("sahithyotsav") || key.includes("trophy")) {
            return <Trophy size={20} className="text-emerald-700" />;
        }
        if (key.includes("relief") || key.includes("heart")) {
            return <HeartHandshake size={20} className="text-emerald-700" />;
        }
        if (key.includes("membership") || key.includes("users")) {
            return <Users size={20} className="text-emerald-700" />;
        }
        return <Layers size={20} className="text-emerald-700" />;
    };

    const modules: WorkspaceModule[] = useMemo(() => {
        // Base core modules
        const list: WorkspaceModule[] = [
            {
                id: "entity-management",
                title: "Entity Management",
                description: "Manage organizational hierarchy and entities",
                category: "Organization",
                href: "/portal/entities",
                icon: <Building2 size={20} className="text-emerald-700" />,
            },
        ];

        // Dynamic campaign modules from DB
        campaigns
            .filter((c) => c.status === "ACTIVE")
            .forEach((c) => {
                const href =
                    c.attachmentUrl && c.attachmentUrl.startsWith("/")
                        ? c.attachmentUrl
                        : c.slug.includes("payasam")
                            ? "/portal/payasam-challenge"
                            : `/portal/campaigns/${c.id}`;

                list.push({
                    id: c.id,
                    title: c.title,
                    description: c.description,
                    category: c.category || "Campaign",
                    href,
                    icon: getModuleIcon(c.slug, c.title, c.bannerImage),
                });
            });

        return list;
    }, [campaigns]);

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
                <Loader2 size={28} className="animate-spin text-emerald-600 mb-2" />
                <p className="text-xs text-gray-500 font-medium">Loading workspace modules...</p>
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header matching exact reference */}
            <div>
                <h1 className="text-2xl font-bold text-gray-950 font-sans tracking-tight">
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Launch a workspace module
                </p>
            </div>

            {/* Grid of clean, minimalist cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {modules.map((mod) => (
                    <Link
                        key={mod.id}
                        href={mod.href}
                        className="bg-white rounded-2xl p-6 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#ebf6ee] text-[#1b7a42] flex items-center justify-center shrink-0">
                                {mod.icon}
                            </div>
                            <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-gray-100/90 text-gray-500 shrink-0">
                                {mod.category}
                            </span>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                                {mod.title}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1 leading-relaxed">
                                {mod.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
