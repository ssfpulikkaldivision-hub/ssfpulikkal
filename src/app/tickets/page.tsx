import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TicketFinder } from "@/components/TicketFinder";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Find Your Ticket | SSF Pulikkal Division Students' Council 2026",
    description: "Enter your registered mobile number to find and download your Students' Council 2026 Delegate Pass and QR code.",
};

export default async function TicketsPage() {
    let navbar = null;
    let footer = null;
    let contact = null;

    try {
        navbar = await prisma.navbar.findUnique({ where: { id: "navbar-settings" } });
        footer = await prisma.footer.findUnique({ where: { id: "footer-content" } });
        contact = await prisma.contact.findUnique({ where: { id: "contact-info" } });
    } catch (err) {
        console.warn("Could not load TicketsPage navigation data:", err);
    }

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col justify-between">
            <div>
                <Navbar data={navbar as any} />

                {/* Content Section */}
                <div className="pt-28 md:pt-36 pb-16">
                    <Suspense
                        fallback={
                            <div className="py-20 flex justify-center items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                            </div>
                        }
                    >
                        <TicketFinder />
                    </Suspense>
                </div>
            </div>

            {footer && <Footer data={footer} contact={contact ?? undefined} />}
        </main>
    );
}
