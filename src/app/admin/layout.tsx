"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Newspaper,
    Image as ImageIcon,
    Settings,
    LogOut,
    Globe,
    ChevronRight,
    Menu,
    X,
    BookOpen,
    Calendar,
    Ticket,
    Building2,
    Layers,
    Droplets
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatSSF } from "@/lib/ssf-formatter";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated" && pathname !== "/admin/login") {
            router.push("/admin/login");
        }
    }, [status, pathname, router]);

    if (pathname === "/admin/login") return <>{children}</>;

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!session) return null;

    const menuItems = [
        { name: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
        { name: "News", href: "/admin/news", icon: <Newspaper size={18} /> },
        { name: "Events Manager", href: "/admin/events", icon: <Calendar size={18} /> },
        { name: "Entities (Hierarchy)", href: "/admin/entities", icon: <Building2 size={18} /> },
        { name: "Payasam Challenge", href: "/admin/payasam-challenge", icon: <Droplets size={18} /> },
        { name: "Campaigns & Portal", href: "/admin/campaigns", icon: <Layers size={18} /> },
        { name: "Students Council", href: "/admin/councillors", icon: <Ticket size={18} /> },
        { name: "Gallery", href: "/admin/gallery", icon: <ImageIcon size={18} /> },
        { name: "Section Editor", href: "/admin/settings", icon: <Settings size={18} /> },
    ];


    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-white border-r border-gray-100 transition-all duration-300 z-50 fixed lg:relative inset-y-0 left-0 h-full flex-shrink-0",
                    isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
                    isSidebarOpen ? "lg:w-64" : "lg:w-20 overflow-hidden"
                )}
            >
                <div className="p-6 flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between mb-12 overflow-hidden">
                        <Link href="/admin/dashboard" className="flex items-center gap-3">
                            <div className="min-w-[32px] h-8 bg-black rounded flex items-center justify-center">
                                <span className="text-white font-black text-xs ssf-font">SSF</span>
                            </div>
                            <span className={cn("font-display font-medium text-black text-lg tracking-tight transition-opacity whitespace-nowrap", !isSidebarOpen && "lg:opacity-0")}>
                                Admin
                            </span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                    "flex items-center px-3 py-2.5 rounded-lg transition-all text-sm",
                                    pathname === item.href || pathname.startsWith(item.href + "/")
                                        ? "bg-black text-white font-medium"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-black"
                                )}
                            >
                                <div className="min-w-[18px]">{item.icon}</div>
                                <span className={cn("ml-3 transition-opacity whitespace-nowrap", !isSidebarOpen && "lg:opacity-0")}>
                                    {item.name}
                                </span>
                            </Link>
                        ))}
                    </nav>

                    {/* Bottom actions */}
                    <div className="mt-auto space-y-1 border-t border-gray-100 pt-4">
                        <Link
                            href="/"
                            target="_blank"
                            className="flex items-center px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-black transition-all text-sm overflow-hidden"
                        >
                            <Globe size={18} />
                            <span className={cn("ml-3 whitespace-nowrap transition-opacity", !isSidebarOpen && "lg:opacity-0")}>
                                View Website
                            </span>
                        </Link>
                        <button
                            onClick={(e) => { e.preventDefault(); signOut(); }}
                            className="flex items-center w-full px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all text-sm overflow-hidden"
                        >
                            <LogOut size={18} />
                            <span className={cn("ml-3 whitespace-nowrap transition-opacity", !isSidebarOpen && "lg:opacity-0")}>
                                Sign Out
                            </span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 min-w-0 overflow-auto">
                {/* Top bar */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                            className="lg:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500 hover:text-black"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden lg:block p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-black"
                            aria-label="Toggle desktop sidebar"
                        >
                            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-black">Admin</p>
                            <p className="text-xs text-gray-400">{formatSSF("SSF Pulikkal Division")}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-black ssf-font">
                            S
                        </div>
                    </div>
                </header>

                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
