"use client";

import { useEffect, useState } from "react";
import {
    UserCircle,
    Building2,
    Lock,
    Save,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Key,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EntityProfile {
    id: string;
    type: "SECTOR" | "UNIT";
    name: string;
    code: string | null;
    username: string;
    sectorId: string;
    sectorName?: string;
    notes: string | null;
}

export default function PortalProfilePage() {
    const [profile, setProfile] = useState<EntityProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Password form states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/portal/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    if (data.entity) {
                        setProfile(data.entity);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, []);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirmation do not match.");
            return;
        }

        setSavingPassword(true);

        try {
            const res = await fetch("/api/portal/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setPasswordError(data.error || "Failed to change password.");
                setSavingPassword(false);
                return;
            }

            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSavingPassword(false);
        } catch {
            setPasswordError("Network error. Please try again.");
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
                <Loader2 size={28} className="animate-spin text-emerald-600 mb-2" />
                <p className="text-xs text-gray-500 font-medium">Loading profile...</p>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-950 font-sans tracking-tight flex items-center gap-2.5">
                    <UserCircle className="text-emerald-700" size={26} />
                    <span>My Account</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Entity details and account credentials management
                </p>
            </div>

            {/* Entity Info Banner */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                                profile.type === "SECTOR"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-emerald-100 text-emerald-800"
                            )}
                        >
                            {profile.type}
                        </span>
                        {profile.code && (
                            <span className="text-xs text-gray-400 font-mono">#{profile.code}</span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 font-sans">{profile.name}</h2>
                    {profile.type === "UNIT" && profile.sectorName && (
                        <p className="text-xs text-gray-500">Parent Sector: {profile.sectorName}</p>
                    )}
                </div>

                <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 text-xs">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Portal Username</span>
                    <span className="font-mono font-bold text-gray-900 text-sm">{profile.username}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Entity Information Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-base font-bold text-gray-900 font-sans flex items-center gap-2">
                            <Building2 size={17} className="text-emerald-700" />
                            <span>Entity Information</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Official entity details in SSF Pulikkal Division directory
                        </p>
                    </div>

                    <div className="space-y-3.5 text-xs">
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-400">Entity Name:</span>
                            <span className="font-bold text-gray-800">{profile.name}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-400">Entity Type:</span>
                            <span className="font-semibold text-gray-700">{profile.type}</span>
                        </div>
                        {profile.code && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-400">Code:</span>
                                <span className="font-mono text-gray-700">#{profile.code}</span>
                            </div>
                        )}
                        {profile.type === "UNIT" && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-400">Affiliated Sector:</span>
                                <span className="font-semibold text-gray-800">{profile.sectorName || "Pulikkal"}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-400">Division:</span>
                            <span className="font-medium text-gray-800">SSF Pulikkal Division</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400">Status:</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                                ACTIVE
                            </span>
                        </div>
                    </div>
                </div>

                {/* Change Password Form */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-base font-bold text-gray-900 font-sans flex items-center gap-2">
                            <Lock size={17} className="text-emerald-700" />
                            <span>Change Portal Password</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Update your login password for secure portal access
                        </p>
                    </div>

                    {passwordSuccess && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            <span>Password changed successfully!</span>
                        </div>
                    )}

                    {passwordError && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                            <AlertCircle size={16} className="text-red-600 shrink-0" />
                            <span>{passwordError}</span>
                        </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
                        <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-sans"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimum 6 characters"
                                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-sans"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-sans"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={savingPassword}
                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-semibold text-xs bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] transition-all shadow-xs disabled:opacity-70"
                        >
                            {savingPassword ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Updating Password...</span>
                                </>
                            ) : (
                                <>
                                    <Key size={14} />
                                    <span>Update Password</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
