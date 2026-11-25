import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Sahithyotsav | SSF Pulikkal Division",
    description: "Official portal of Sahithyotsav, the Literary and Cultural Festival of SSF Pulikkal Division.",
};

export default async function SahithyotsavLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let settings = null;
    let footer = null;
    let contact = null;

    try {
        settings = await prisma.litFestSettings.findUnique({
            where: { id: "litfest-settings" },
        });
        footer = await prisma.footer.findUnique({ where: { id: "footer-content" } });
        contact = await prisma.contact.findUnique({ where: { id: "contact-info" } });
    } catch (err) {
        console.warn("Could not load litFestSettings/footer/contact in SahithyotsavLayout:", err);
    }

    const title = settings?.title || "Sahithyotsav 2026";

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
            {/* Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/sahithyotsav" className="flex items-center space-x-2 group">
                        <div className="bg-emerald-600 text-slate-950 px-2 py-0.5 rounded font-black text-xs ssf-font">
                            SSF
                        </div>
                        <span className="font-display font-medium text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                            {title.split(" ").slice(-1)[0] || "Sahithyotsav"}
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center space-x-8">
                        <Link href="/sahithyotsav" className="text-sm text-slate-300 hover:text-white transition-colors">
                            Home
                        </Link>
                        <Link href="/sahithyotsav/schedule" className="text-sm text-slate-300 hover:text-white transition-colors">
                            Schedule
                        </Link>
                        <Link href="/sahithyotsav/results" className="text-sm text-slate-300 hover:text-white transition-colors">
                            Results
                        </Link>
                        <Link href="/sahithyotsav/gallery" className="text-sm text-slate-300 hover:text-white transition-colors">
                            Gallery
                        </Link>
                        <Link
                            href="/"
                            className="px-4 py-1.5 rounded-full border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-all"
                        >
                            Main Website
                        </Link>
                    </nav>
                </div>
            </header>

            <div className="flex-1 flex flex-col pt-16">
                {children}
            </div>

            {/* Custom footer specifically styled for dark Sahithyotsav theme or use default if preferred */}
            <footer className="bg-slate-950 border-t border-slate-900 py-12 text-slate-400">
                <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <span className="ssf-font font-black text-white mr-2">SSF</span>
                        <span className="font-display text-white">{title}</span>
                        <p className="text-xs mt-2 text-slate-500">Empowering youth through moral and cultural excellence.</p>
                    </div>
                    <div className="flex space-x-6 text-sm text-slate-400">
                        <Link href="/sahithyotsav" className="hover:text-white transition-colors">Home</Link>
                        <Link href="/sahithyotsav/schedule" className="hover:text-white transition-colors">Schedule</Link>
                        <Link href="/sahithyotsav/results" className="hover:text-white transition-colors">Results</Link>
                        <Link href="/sahithyotsav/gallery" className="hover:text-white transition-colors">Gallery</Link>
                        <Link href="/" className="hover:text-white transition-colors">Main Site</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
