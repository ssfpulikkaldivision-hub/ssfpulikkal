"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube, ExternalLink } from "lucide-react";
import { formatSSF } from "@/lib/ssf-formatter";

interface FooterData {
    aboutText: string;
    socialLinks: string; // JSON
    copyright: string;
    links?: string | null;
}

interface ContactData {
    address: string;
    phone: string;
    email: string;
}

export function Footer({ data, contact }: { data: FooterData; contact?: ContactData }) {
    let socials: Record<string, string> = {};
    try {
        socials = JSON.parse(data.socialLinks || "{}");
    } catch (e) {}

    let orgLinks = [
        { name: "Home", href: "/" },
        { name: "News", href: "/news" },
        { name: "Gallery", href: "/gallery" },
        { name: "About SSF", href: "/about" },
        { name: "Privacy Policy", href: "/privacy" },
    ];
    if (data.links) {
        try {
            const parsed = JSON.parse(data.links);
            if (Array.isArray(parsed) && parsed.length > 0) {
                orgLinks = parsed.filter((item: any) => !item.hidden);
            }
        } catch (e) {}
    }

    const socialIcons: Record<string, any> = {
        facebook: <Facebook size={16} />,
        instagram: <Instagram size={16} />,
        twitter: <Twitter size={16} />,
        youtube: <Youtube size={16} />,
    };

    return (
        <footer id="contact" className="bg-black text-white pt-24 pb-12">
            <div className="container mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">

                    {/* Brand */}
                    <div className="md:col-span-4 space-y-6">
                        <Link href="/" className="inline-block">
                            <span className="font-display text-2xl tracking-tight text-white">
                                <span className="ssf-font font-black">SSF</span> <span className="font-light">Pulikkal</span>
                            </span>
                        </Link>
                        <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                            {data.aboutText}
                        </p>
                        <div className="flex items-center gap-4">
                            {Object.entries(socials).map(([platform, url]) => (
                                <a
                                    key={platform}
                                    href={url as string}
                                    target="_blank"
                                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-white/40 hover:bg-white/5 transition-all text-white/50 hover:text-white"
                                >
                                    {socialIcons[platform] || <ExternalLink size={16} />}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    {contact && (
                        <div className="md:col-span-3 md:col-start-7 space-y-6">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Contact</h4>
                            <div className="space-y-5">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Location</p>
                                    <p className="text-white/50 text-sm leading-relaxed">{contact.address}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Phone</p>
                                    <p className="text-white/50 text-sm">{contact.phone}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Email</p>
                                    <p className="text-white/50 text-sm hover:text-white transition-colors cursor-pointer">{contact.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Organization Links */}
                    <div className="md:col-span-3 space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Organization</h4>
                        <ul className="space-y-3">
                            {orgLinks.map((link: any, idx: number) => (
                                <li key={idx}>
                                    <Link href={link.href} className="text-white/50 hover:text-white transition-colors text-sm block">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex justify-center items-center">
                    <p className="text-white/20 text-xs text-center">© 2026 {formatSSF("SSF Pulikkal Division")}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
