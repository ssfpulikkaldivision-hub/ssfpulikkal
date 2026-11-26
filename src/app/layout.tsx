import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css"; // Cache busted for neon migration

import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const anekMalayalam = localFont({
  src: "../../public/fonts/AnekMalayalam.ttf",
  variable: "--font-anek-malayalam",
  display: "swap",
});

const cooperBlack = localFont({
  src: "../../public/fonts/CooperBlack.ttf",
  variable: "--font-cooper-black",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ssfpulikkaldivision.online"),
  title: "SSF Pulikkal Division",
  description: "Official website of SSF Pulikkal Division. Empowering the society through moral excellence.",
  icons: {
    icon: "/portal-icon.png",
    shortcut: "/portal-icon.png",
    apple: "/portal-icon.png",
  },
  openGraph: {
    title: "SSF Pulikkal Division",
    description: "Official website of SSF Pulikkal Division. Empowering the society through moral excellence.",
    url: "https://ssfpulikkaldivision.online",
    siteName: "SSF Pulikkal Division",
    images: [
      {
        url: "/api/hero-image",
        width: 1200,
        height: 630,
        alt: "SSF Pulikkal Division",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SSF Pulikkal Division",
    description: "Official website of SSF Pulikkal Division. Empowering the society through moral excellence.",
    images: ["/api/hero-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${anekMalayalam.variable} ${cooperBlack.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
