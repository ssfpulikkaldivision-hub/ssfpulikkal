"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Lock,
    User,
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    AlertCircle,
    Home,
    HelpCircle
} from "lucide-react";
import { formatSSF } from "@/lib/ssf-formatter";

export default function PortalLoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!identifier.trim() || !password.trim()) {
            setError("Username and password are required.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/portal/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    identifier: identifier.trim(),
                    password: password.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Invalid username or password. Please try again.");
                setLoading(false);
                return;
            }

            router.push("/portal");
            router.refresh();
        } catch {
            setError("Network error. Please check your connection and retry.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8faf9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Back to main website */}
                <div className="flex justify-center mb-6">

                </div>

                {/* Logo & Header */}
                <div className="text-center">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white mx-auto mb-3 shadow-sm">
                        <span className="ssf-font font-black text-xl">SSF</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-950 tracking-tight font-sans">
                        {formatSSF("Pulikkal Division")}
                    </h1>
                </div>

                {/* Card */}
                <div className="mt-7 bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-sm border border-gray-200/80">
                    {error && (
                        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
                            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                            <div className="flex-1 font-medium leading-relaxed">{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <User size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Enter your usernam"
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-sans"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-sans"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-semibold text-xs bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] transition-all shadow-xs disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </form>


                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    {formatSSF("Sunni Students Federation (SSF) Pulikkal Division")}
                </p>
            </div>
        </div>
    );
}
