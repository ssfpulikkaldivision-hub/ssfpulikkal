"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // If it's a chunk load error caused by a new deployment, reload to get fresh assets
        if (
            error.message?.includes("Loading chunk") ||
            error.name === "ChunkLoadError" ||
            error.message?.includes("Failed to fetch dynamically imported module")
        ) {
            window.location.reload();
        }
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-8 shadow-xl text-center space-y-5 animate-in fade-in">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={28} />
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        Something went wrong
                    </h2>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        An unexpected error occurred while loading this page. Please try refreshing or return to the homepage.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                    <button
                        onClick={() => {
                            if (typeof window !== "undefined") {
                                window.location.reload();
                            } else {
                                reset();
                            }
                        }}
                        className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer shadow-xs"
                    >
                        <RotateCcw size={14} /> Refresh Page
                    </button>
                    <Link
                        href="/"
                        className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        <Home size={14} /> Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
