import type { Metadata } from "next";
import { PortalLayoutClient } from "@/components/portal/PortalLayoutClient";

export const metadata: Metadata = {
    title: "SSF Pulikkal Division Portal",
    description: "Division Management Portal for SSF Pulikkal",
    icons: {
        icon: "/portal-icon.png",
        shortcut: "/portal-icon.png",
        apple: "/portal-icon.png",
    },
    openGraph: {
        title: "SSF Pulikkal Division Portal",
        description: "Division Management Portal for SSF Pulikkal",
        siteName: "SSF Pulikkal Division Portal",
        images: [
            {
                url: "/portal-share.png",
                width: 512,
                height: 512,
                alt: "SSF Pulikkal Division Portal",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "SSF Pulikkal Division Portal",
        description: "Division Management Portal for SSF Pulikkal",
        images: ["/portal-share.png"],
    },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return <PortalLayoutClient>{children}</PortalLayoutClient>;
}
