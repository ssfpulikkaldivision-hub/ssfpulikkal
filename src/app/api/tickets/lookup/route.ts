import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeMobile } from "@/lib/councillor-utils";
import { generateQRCodeDataURL } from "@/lib/qrcode";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mobile = searchParams.get("mobile");
        const ticket = searchParams.get("ticket");

        if (!mobile && !ticket) {
            return NextResponse.json(
                { error: "Mobile number or ticket number is required" },
                { status: 400 }
            );
        }

        let councillors: any[] = [];

        if (ticket) {
            const c = await prisma.councillor.findUnique({
                where: { ticketNumber: ticket.trim() },
            });
            if (c) councillors.push(c);
        } else if (mobile) {
            const norm = normalizeMobile(mobile.trim());
            if (norm.length >= 6) {
                // Find matching mobile numbers
                councillors = await prisma.councillor.findMany({
                    where: {
                        OR: [
                            { mobile: norm },
                            { mobile: { contains: norm } },
                        ],
                    },
                    orderBy: { name: "asc" },
                });
            }
        }

        if (councillors.length === 0) {
            return NextResponse.json({
                found: false,
                message: "No ticket found for the provided details. Please verify your mobile number.",
                delegates: [],
            });
        }

        // Fetch event info (default to Students Council event or first matching)
        let event = await prisma.event.findFirst({
            where: {
                OR: [
                    { title: { contains: "Students Council" } },
                    { title: { contains: "Students' Council" } },
                ],
            },
        });

        const eventInfo = {
            title: event?.title || "DIVISION Students' Council",
            date: event?.date || "December 11, 2026",
            time: event?.time || "10:00 AM - 07:00 PM",
            venue: event?.venue || "Legrande, Pulikkal",
            image: event?.image || "/uploads/1795433713667-Division-Council-26.jpg",
        };

        const delegates = councillors.map((c) => {
            const qrCode = generateQRCodeDataURL(c.ticketNumber, {
                size: 240,
                margin: 2,
            });

            return {
                id: c.id,
                ticketNumber: c.ticketNumber,
                name: c.name,
                mobile: c.mobile,
                sector: c.sector,
                unit: c.unit,
                designation: c.designation,
                isAdmitted: c.isAdmitted,
                admittedAt: c.admittedAt,
                qrCode,
                event: eventInfo,
            };
        });

        return NextResponse.json({
            found: true,
            count: delegates.length,
            delegates,
        });
    } catch (error: any) {
        console.error("Ticket lookup error:", error);
        return NextResponse.json(
            { error: "Failed to look up ticket", details: error?.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mobile, ticket } = body;

        const url = new URL(request.url);
        if (mobile) url.searchParams.set("mobile", mobile);
        if (ticket) url.searchParams.set("ticket", ticket);

        return GET(new NextRequest(url));
    } catch (error: any) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
