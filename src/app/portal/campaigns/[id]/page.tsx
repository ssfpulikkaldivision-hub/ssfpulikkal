"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Calendar,
    Target,
    FileText,
    Download,
    CheckCircle2,
    Clock,
    AlertCircle,
    Send,
    Loader2,
    Users,
    Building2,
    MessageCircle,
    Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignDetail {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    targetAudience: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
    bannerImage: string | null;
    attachmentUrl: string | null;
    formFields: string | null;
    targetValue: number | null;
    targetUnit: string | null;
}

interface UnitSubmissionProgress {
    unit: {
        id: string;
        name: string;
        code: string | null;
        sectorName?: string;
    };
    submission: any | null;
    isSubmitted: boolean;
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [mySubmission, setMySubmission] = useState<any | null>(null);
    const [unitSubmissions, setUnitSubmissions] = useState<UnitSubmissionProgress[]>([]);
    const [sessionType, setSessionType] = useState<"DIVISION" | "SECTOR" | "UNIT">("UNIT");
    const [loading, setLoading] = useState(true);

    // Form inputs
    const [countValue, setCountValue] = useState("");
    const [amountValue, setAmountValue] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [remarks, setRemarks] = useState("");
    const [submittedBy, setSubmittedBy] = useState("");
    const [submittedMobile, setSubmittedMobile] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        async function loadCampaignData() {
            try {
                const [campRes, meRes] = await Promise.all([
                    fetch(`/api/portal/campaigns/${id}`),
                    fetch("/api/portal/auth/me"),
                ]);

                if (meRes.ok) {
                    const meData = await meRes.json();
                    if (meData.entity) {
                        setSessionType(meData.entity.type);
                        setSubmittedBy(meData.entity.name);
                        setSubmittedMobile("");
                    }
                }

                if (campRes.ok) {
                    const data = await campRes.json();
                    setCampaign(data.campaign);
                    setMySubmission(data.mySubmission);
                    setUnitSubmissions(data.unitSubmissions || []);

                    // Populate previous submission if exists
                    if (data.mySubmission) {
                        if (data.mySubmission.submittedBy) setSubmittedBy(data.mySubmission.submittedBy);
                        if (data.mySubmission.submittedMobile) setSubmittedMobile(data.mySubmission.submittedMobile);
                        if (data.mySubmission.numericValue !== null) setCountValue(String(data.mySubmission.numericValue));

                        try {
                            const parsed = JSON.parse(data.mySubmission.values);
                            if (parsed.amount) setAmountValue(String(parsed.amount));
                            if (parsed.eventDate) setEventDate(parsed.eventDate);
                            if (parsed.remarks) setRemarks(parsed.remarks);
                            if (parsed.count && !data.mySubmission.numericValue) setCountValue(String(parsed.count));
                        } catch {}
                    }
                }
            } catch (err) {
                console.error("Failed to load campaign detail", err);
            } finally {
                setLoading(false);
            }
        }

        loadCampaignData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMessage(null);
        setSubmitSuccess(false);

        const valuesPayload = {
            count: countValue ? Number(countValue) : 0,
            amount: amountValue ? Number(amountValue) : 0,
            eventDate: eventDate || null,
            remarks: remarks || null,
        };

        try {
            const res = await fetch("/api/portal/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaignId: id,
                    values: valuesPayload,
                    numericValue: countValue ? Number(countValue) : 0,
                    submittedBy,
                    submittedMobile,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.error || "Failed to submit report.");
                setSubmitting(false);
                return;
            }

            setMySubmission(data.submission);
            setSubmitSuccess(true);
            setSubmitting(false);

            // Refresh units list if sector
            const refreshRes = await fetch(`/api/portal/campaigns/${id}`);
            if (refreshRes.ok) {
                const refreshed = await refreshRes.json();
                setUnitSubmissions(refreshed.unitSubmissions || []);
            }
        } catch {
            setErrorMessage("Network error. Please try again.");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
                <Loader2 size={28} className="animate-spin text-emerald-600 mb-2" />
                <p className="text-xs text-gray-500 font-medium">Loading campaign details...</p>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="p-8 text-center space-y-3">
                <AlertCircle size={36} className="mx-auto text-red-500" />
                <h2 className="text-base font-bold text-gray-800">Campaign Not Found</h2>
                <Link
                    href="/portal/campaigns"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                >
                    <ArrowLeft size={14} />
                    <span>Back to Campaigns</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
            {/* Back link */}
            <div>
                <Link
                    href="/portal/campaigns"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={14} />
                    <span>Back to Campaigns</span>
                </Link>
            </div>

            {/* Campaign Overview Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {campaign.category}
                        </span>
                        <span
                            className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                campaign.status === "ACTIVE"
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-gray-100 text-gray-600"
                            )}
                        >
                            {campaign.status === "ACTIVE" ? "Active" : "Closed"}
                        </span>
                    </div>

                    {campaign.attachmentUrl && (
                        <a
                            href={campaign.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                        >
                            <Download size={13} />
                            <span>Download Guidelines / Circular</span>
                        </a>
                    )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-sans tracking-tight">
                    {campaign.title}
                </h1>

                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100">
                    {campaign.description}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    {campaign.endDate && (
                        <div className="flex items-center gap-2.5 text-gray-700 bg-white p-3 rounded-xl border border-gray-100">
                            <Calendar size={16} className="text-emerald-700 shrink-0" />
                            <div>
                                <span className="font-semibold block text-gray-900">Submission Deadline</span>
                                <span className="text-gray-500">
                                    {new Date(campaign.endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                </span>
                            </div>
                        </div>
                    )}

                    {campaign.targetValue && (
                        <div className="flex items-center gap-2.5 text-gray-700 bg-white p-3 rounded-xl border border-gray-100">
                            <Target size={16} className="text-emerald-700 shrink-0" />
                            <div>
                                <span className="font-semibold block text-gray-900">Assigned Goal / Target</span>
                                <span className="text-gray-500">{campaign.targetValue} {campaign.targetUnit || "Units"}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Submission Form Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 font-sans flex items-center gap-2">
                            <FileText size={18} className="text-emerald-700" />
                            <span>Submit Program Report</span>
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Enter your entity&apos;s metrics and achievement data
                        </p>
                    </div>

                    {mySubmission && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 size={13} className="text-blue-600" />
                            <span>Previously Reported</span>
                        </span>
                    )}
                </div>

                {submitSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <div>
                            <span className="font-bold">Report submitted successfully!</span> Your response is updated on the division records.
                        </div>
                    </div>
                )}

                {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                        <AlertCircle size={16} className="shrink-0 text-red-600" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                                {campaign.targetUnit
                                    ? `Achieved Count (${campaign.targetUnit}) *`
                                    : "Primary Metric / Count *"}
                            </label>
                            <input
                                type="number"
                                value={countValue}
                                onChange={(e) => setCountValue(e.target.value)}
                                placeholder="e.g. 50"
                                required
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-sans"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                                Total Amount Collected (₹)
                            </label>
                            <input
                                type="number"
                                value={amountValue}
                                onChange={(e) => setAmountValue(e.target.value)}
                                placeholder="e.g. 15000"
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-sans"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                                Activity / Completion Date
                            </label>
                            <input
                                type="date"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                                Reporter Name & Designation
                            </label>
                            <input
                                type="text"
                                value={submittedBy}
                                onChange={(e) => setSubmittedBy(e.target.value)}
                                placeholder="e.g. Paravoor Unit Representative"
                                required
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-sans"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block font-semibold text-gray-700 mb-1">
                                Reporter Mobile Number
                            </label>
                            <input
                                type="tel"
                                value={submittedMobile}
                                onChange={(e) => setSubmittedMobile(e.target.value)}
                                placeholder="10-digit phone number"
                                required
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block font-semibold text-gray-700 mb-1">
                                Remarks / Notes
                            </label>
                            <textarea
                                rows={3}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Any additional details, distribution venues, or observations..."
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-sans"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-xs bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] transition-all shadow-xs disabled:opacity-70"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={14} />
                                    <span>{mySubmission ? "Update Submitted Report" : "Submit Report"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* If Sector or Division Login: Units Monitoring Table */}
            {(sessionType === "SECTOR" || sessionType === "DIVISION") && unitSubmissions.length > 0 && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 font-sans flex items-center gap-2">
                                <Users size={18} className="text-purple-700" />
                                <span>Affiliated Units Progress</span>
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Submissions from units under your sector for {campaign.title}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold">
                            <span className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200">
                                {unitSubmissions.filter((u) => u.isSubmitted).length} Submitted
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                                {unitSubmissions.filter((u) => !u.isSubmitted).length} Pending
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/50">
                                    <th className="py-2.5 px-3">Unit</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3">Reported Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {unitSubmissions.map(({ unit, isSubmitted, submission }) => {
                                    return (
                                        <tr key={unit.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-3 px-3">
                                                <div className="font-bold text-gray-900">{unit.name}</div>
                                                {unit.code && (
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        #{unit.code}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3 px-3">
                                                {isSubmitted ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                                        <CheckCircle2 size={11} />
                                                        <span>Submitted</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <Clock size={11} />
                                                        <span>Pending</span>
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3 px-3">
                                                {isSubmitted && submission ? (
                                                    <span className="font-bold text-gray-900">
                                                        {submission.numericValue !== null
                                                            ? `${submission.numericValue} ${campaign.targetUnit || ""}`
                                                            : "Recorded"}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
