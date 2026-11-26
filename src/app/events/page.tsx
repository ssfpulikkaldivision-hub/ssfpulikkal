import prisma from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EventsPortal } from "@/components/EventsPortal";

export const revalidate = 60;

export default async function EventsPage() {
    let events: any[] = [];
    let navbar = null;
    let footer = null;
    let contact = null;

    try {
        [events, navbar, footer, contact] = await Promise.all([
            prisma.event.findMany({
                where: { NOT: { status: "DRAFT" } },
                orderBy: { createdAt: "desc" },
                take: 30,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    date: true,
                    time: true,
                    venue: true,
                    category: true,
                    status: true,
                    image: true,
                },
            }),
            prisma.navbar.findUnique({ where: { id: "navbar-settings" } }),
            prisma.footer.findUnique({ where: { id: "footer-content" } }),
            prisma.contact.findUnique({ where: { id: "contact-info" } }),
        ]);
    } catch (err) {
        console.warn("Could not load EventsPage data:", err);
    }

    if (!navbar || !footer || !contact) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl text-gray-500 italic">Initializing database. Please run seed script.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar data={navbar as any} />

            {/* Banner Section */}
            <div className="pt-40 pb-20 bg-black text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#111,transparent)] opacity-60"></div>
                <div className="container mx-auto px-6 md:px-12 relative z-10">
                    <span className="inline-block tracking-[0.2em] text-[10px] font-bold text-white/40 uppercase mb-8">Calendar & Schedules</span>
                    <h1 className="text-6xl md:text-8xl font-display font-medium tracking-tight">Events</h1>
                </div>
            </div>

            {/* Main Interactive Portal */}
            <div className="container mx-auto px-6 md:px-12 py-16">
                <EventsPortal events={events as any} />
            </div>

            <Footer data={footer} contact={contact} />
        </main>
    );
}
