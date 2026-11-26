"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

interface CtaButton {
    text: string;
    link: string;
    isPrimary?: boolean;
}

interface NavbarData {
    logoText: string;
    links: string; // JSON
    loginText: string;
    loginLink: string;
    ctaButtons?: string | null;
}

export function Navbar({ data }: { data?: NavbarData }) {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    let navItems = [
        { name: "Home", href: "/" },
        { name: "Events", href: "/events" },
        { name: "News", href: "/#news" },
        { name: "Gallery", href: "/gallery" },
        { name: "Contact", href: "/#contact" },
    ];
    if (data?.links) {
        try {
            const parsed = JSON.parse(data.links);
            if (Array.isArray(parsed) && parsed.length > 0) {
                navItems = parsed.filter((item: any) => !item.hidden);
            }
        } catch (e) {}
    }

    let ctaButtons: CtaButton[] = [];
    if (data?.ctaButtons) {
        try {
            const parsed = JSON.parse(data.ctaButtons);
            if (Array.isArray(parsed) && parsed.length > 0) {
                ctaButtons = parsed.filter((b: any) => b && b.text && b.link && !b.hidden);
            }
        } catch (e) {}
    }
    if (ctaButtons.length === 0 && data?.loginText) {
        ctaButtons = [{ text: data.loginText, link: data.loginLink || "/admin", isPrimary: true }];
    }

    const logoText = data?.logoText || "Pulikkal";

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                scrolled ? "bg-white/95 backdrop-blur-sm border-b border-gray-100 py-3" : "bg-transparent py-5"
            )}
        >
            <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <span className={cn("font-display text-xl tracking-tight transition-colors", scrolled ? "text-primary" : "text-white")}> 
                      <span className="ssf-font font-black">SSF</span> <span className="font-light">{logoText}</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-8">
                        {navItems.map((item: any) => (
                            <Link
                                key={item.name + item.href}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors whitespace-nowrap",
                                    scrolled ? "text-gray-500 hover:text-black" : "text-white/80 hover:text-white"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {ctaButtons.length > 0 && (
                        <div className="flex items-center gap-3">
                            {ctaButtons.map((btn, idx) => (
                                <Link
                                    key={idx}
                                    href={btn.link}
                                    className={cn(
                                        "px-5 py-2 rounded-full text-sm font-medium transition-all shadow-xs whitespace-nowrap",
                                        btn.isPrimary === false
                                            ? (scrolled ? "bg-gray-100 text-gray-800 hover:bg-gray-200" : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-xs")
                                            : (scrolled ? "bg-black text-white hover:bg-gray-800" : "bg-white text-black hover:bg-gray-100")
                                    )}
                                >
                                    {btn.text}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className={cn("md:hidden p-2 transition-colors cursor-pointer", scrolled ? "text-black" : "text-white")}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <div
                className={cn(
                    "fixed inset-0 bg-white z-[60] flex flex-col items-start justify-start pt-28 px-8 space-y-6 transition-all duration-500 md:hidden overflow-y-auto",
                    isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                )}
            >
                <button
                    className="absolute top-6 right-6 text-black p-2 cursor-pointer"
                    onClick={() => setIsOpen(false)}
                >
                    <X size={24} />
                </button>
                <div className="flex flex-col space-y-4 w-full">
                    {navItems.map((item: any) => (
                        <Link
                            key={item.name + item.href}
                            href={item.href}
                            className="text-2xl font-display font-medium text-black hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                {ctaButtons.length > 0 && (
                    <div className="pt-6 border-t border-gray-100 w-full flex flex-col gap-3">
                        {ctaButtons.map((btn, idx) => (
                            <Link
                                key={idx}
                                href={btn.link}
                                className={cn(
                                    "w-full text-center py-3.5 rounded-full text-base font-medium transition-all",
                                    btn.isPrimary === false
                                        ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                        : "bg-black text-white hover:bg-gray-800"
                                )}
                                onClick={() => setIsOpen(false)}
                            >
                                {btn.text}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
