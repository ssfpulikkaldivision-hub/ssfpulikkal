"use client";

import { useEffect, useState } from "react";

export function Countdown({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        isExpired: boolean;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

    useEffect(() => {
        const target = new Date(targetDate).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = target - now;

            if (difference <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    if (timeLeft.isExpired) {
        return (
            <div className="text-center py-6 px-8 bg-emerald-950/20 border border-emerald-800/30 rounded-2xl">
                <span className="text-xl md:text-2xl font-bold uppercase tracking-widest text-emerald-400">
                    The Festival is Live!
                </span>
            </div>
        );
    }

    const units = [
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Minutes", value: timeLeft.minutes },
        { label: "Seconds", value: timeLeft.seconds },
    ];

    return (
        <div className="grid grid-cols-4 gap-4 max-w-xl mx-auto">
            {units.map((unit) => (
                <div
                    key={unit.label}
                    className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-500/30 transition-all"
                >
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent group-hover:via-emerald-500/50 transition-all"></div>
                    <span className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">
                        {String(unit.value).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">
                        {unit.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
