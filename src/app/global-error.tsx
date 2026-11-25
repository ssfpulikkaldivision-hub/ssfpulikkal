"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        if (
            error.message?.includes("Loading chunk") ||
            error.name === "ChunkLoadError" ||
            error.message?.includes("Failed to fetch dynamically imported module")
        ) {
            window.location.reload();
        }
    }, [error]);

    return (
        <html lang="en">
            <body className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-8 shadow-xl text-center space-y-5">
                    <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle size={28} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                            Application Error
                        </h2>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            A critical error occurred while loading application resources. Please refresh the page to load the latest version.
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => {
                                if (typeof window !== "undefined") {
                                    window.location.reload();
                                } else {
                                    reset();
                                }
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <RotateCcw size={14} /> Refresh Page
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
