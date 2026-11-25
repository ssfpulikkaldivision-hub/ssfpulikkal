"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { usePathname, useRouter } from "next/navigation";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { Loader2 } from "lucide-react";
import { formatSSF } from "@/lib/ssf-formatter";

interface EntitySession {
    id: string;
    type: "DIVISION" | "SECTOR" | "UNIT";
    name: string;
    code: string | null;
    username: string;
    sectorId?: string;
    sectorName?: string;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>SSF Pulikkal Division Portal</title>
        <meta property="og:title" content="SSF Pulikkal Division Portal" />
        <meta property="og:description" content="Division portal for SSF Pulikkal" />
        <meta property="og:image" content="/portal-share.png" />
        <meta property="og:url" content="https://your-subdomain.example.com" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      {children}
    </>
  );
}
    const pathname = usePathname();
    const router = useRouter();
    const [session, setSession] = useState<EntitySession | null>(null);
    const [loading, setLoading] = useState(true);

    const isLoginPage = pathname === "/portal/login";

    useEffect(() => {
        let isMounted = true;
        async function checkAuth() {
            try {
                const res = await fetch("/api/portal/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        setSession(data.entity);
                        setLoading(false);
                        if (isLoginPage) {
                            router.push("/portal");
                        }
                    }
                } else {
                    if (isMounted) {
                        setSession(null);
                        setLoading(false);
                        if (!isLoginPage) {
                            router.push("/portal/login");
                        }
                    }
                }
            } catch {
                if (isMounted) {
                    setSession(null);
                    setLoading(false);
                    if (!isLoginPage) {
                        router.push("/portal/login");
                    }
                }
            }
        }

        checkAuth();
        return () => {
            isMounted = false;
        };
    }, [pathname, isLoginPage, router]);

    if (isLoginPage) {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-bold mb-3 shadow-sm">
                    <span className="ssf-font font-black text-lg">SSF</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Loader2 size={15} className="animate-spin text-emerald-600" />
                    <span>Loading portal...</span>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#f8faf9] flex flex-col md:flex-row font-sans text-gray-800">
            {/* Left Sidebar */}
            <PortalSidebar session={session} />

            {/* Main Content Area */}
            <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
                <main className="flex-1 pb-16">{children}</main>
                <footer className="py-6 px-8 border-t border-gray-200/60 text-xs text-gray-400 bg-white">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
                        <p>© 2026 {formatSSF("SSF Pulikkal Division")}. All rights reserved.</p>
                        <p className="text-[11px] text-gray-400">Division Management Portal</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
