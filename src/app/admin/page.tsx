"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AdminPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/admin/dashboard");
        } else if (status === "unauthenticated") {
            router.push("/admin/login");
        }
    }, [status, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
    );
}
