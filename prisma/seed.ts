import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("puli3648", 10);

  await prisma.admin.upsert({
    where: { username: "Zpulikkal" },
    update: { password: adminPasswordHash },
    create: {
      username: "Zpulikkal",
      password: adminPasswordHash,
    },
  });

  await prisma.hero.upsert({
    where: { id: "hero-section" },
    update: {},
    create: {
      id: "hero-section",
      bannerImage: "/images/hero-banner.jpg",
      title: "SSF Pulikkal Division",
      subtitle: "Sunni Students Federation - Pulikkal Division Official Portal",
      btn1Text: "Explore News",
      btn1Link: "/news",
      btn2Text: "Upcoming Events",
      btn2Link: "/events",
      showBtn1: true,
      showBtn2: true,
    },
  });

  await prisma.contact.upsert({
    where: { id: "contact-info" },
    update: {},
    create: {
      id: "contact-info",
      address: "Pulikkal, Malappuram, Kerala",
      phone: "+91 00000 00000",
      email: "info@ssfpulikkal.org",
      mapEmbed: "",
    },
  });

  await prisma.footer.upsert({
    where: { id: "footer-content" },
    update: {},
    create: {
      id: "footer-content",
      aboutText:
        "SSF Pulikkal Division - Empowering students through knowledge, character, and service.",
      socialLinks: "[]",
      copyright: "© 2026 SSF Pulikkal Division. All rights reserved.",
      links: "[]",
    },
  });

  await prisma.navbar.upsert({
    where: { id: "navbar-settings" },
    update: {},
    create: {
      id: "navbar-settings",
      logoText: "SSF Pulikkal",
      links: JSON.stringify([
        { label: "Home", href: "/" },
        { label: "News", href: "/news" },
        { label: "Events", href: "/events" },
        { label: "Gallery", href: "/gallery" },
      ]),
      loginText: "Portal Login",
      loginLink: "/portal/login",
      ctaButtons: "[]",
    },
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
