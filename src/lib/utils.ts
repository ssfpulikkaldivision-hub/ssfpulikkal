import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatUrl(url?: string | null): string {
    if (!url) return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (
        trimmed.startsWith("/") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("mailto:") ||
        trimmed.startsWith("tel:")
    ) {
        return trimmed;
    }
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
        return trimmed;
    }
    return `https://${trimmed}`;
}
