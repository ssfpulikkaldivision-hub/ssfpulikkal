import { Suspense } from "react";
import { PayasamPublicForm } from "@/components/PayasamPublicForm";
import { formatSSF } from "@/lib/ssf-formatter";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Payasam Challenge | SSF Pulikkal Division",
    description:
        "Submit Payasam Challenge orders directly by selecting your Sector and Unit hierarchy.",
};

export default function PayasamChallengePublicPage() {
    return (
        <main className="min-h-screen bg-[#f8faf9] py-10 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Compact Header matching Portal design */}
                <div className="text-center space-y-2">

                    <h1 className="text-2xl sm:text-3xl font- text-gray-950 tracking-tight font-sans">
                        Payasam Challenge
                    </h1>

                </div>

                {/* Order Form */}
                <Suspense
                    fallback={
                        <div className="py-16 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                        </div>
                    }
                >
                    <PayasamPublicForm />
                </Suspense>
            </div>
        </main>
    );
}
