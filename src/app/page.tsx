import prisma from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { AboutSection } from "@/components/AboutSection";
import { NewsSection } from "@/components/NewsSection";
import { Footer } from "@/components/Footer";

export const revalidate = 60;

export default async function Home() {
  let hero = null;
  let news: any[] = [];
  let contact = null;
  let footer = null;
  let navbar = null;
  let upcomingEvents: any[] = [];

  try {
    [hero, news, contact, footer, navbar, upcomingEvents] = await Promise.all([
      prisma.hero.findUnique({
        where: { id: "hero-section" },
        select: {
          bannerImage: true,
          bannerImages: true,
          title: true,
          subtitle: true,
          btn1Text: true,
          btn1Link: true,
          btn2Text: true,
          btn2Link: true,
          showBtn1: true,
          showBtn2: true,
        },
      }),
      prisma.news.findMany({
        where: { NOT: { status: "DRAFT" } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          image: true,
          createdAt: true,
        },
      }),
      prisma.contact.findUnique({ where: { id: "contact-info" } }),
      prisma.footer.findUnique({ where: { id: "footer-content" } }),
      prisma.navbar.findUnique({ where: { id: "navbar-settings" } }),
      prisma.event.findMany({
        where: { status: "UPCOMING" },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          date: true,
          time: true,
          venue: true,
          category: true,
        },
      }),
    ]);
  } catch (err) {
    console.warn("Could not load Home page data:", err);
  }

  if (!hero || !contact || !footer || !navbar) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-xl text-gray-500 italic">Initializing content. Please run the seed command.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar data={navbar} />
      <Hero data={hero} />
      {upcomingEvents.length > 0 && (
        <UpcomingEvents 
          events={upcomingEvents as any}
        />
      )}
      <AboutSection />
      <div className="container mx-auto px-6 md:px-12">
        <hr className="border-gray-100" />
      </div>
      <NewsSection news={news} />
      <Footer data={footer} contact={contact} />
    </main>
  );
}
