export type PaymentStatus = "PAID" | "PENDING";
export type OrderSource = "PORTAL" | "PUBLIC_LINK";

export const PAYASAM_PRICE_PER_LITER = 250;

export function calculatePayasamAmount(liters: number): number {
    if (!Number.isFinite(liters)) return 0;
    return Math.round(liters * PAYASAM_PRICE_PER_LITER * 100) / 100;
}

export function formatRupees(amount: number): string {
    const rounded = Math.round((Number.isFinite(amount) ? amount : 0) * 100) / 100;
    return `₹${rounded.toLocaleString("en-IN")}`;
}

export function computeOrderMetrics(
    orders: Array<{
        liters: number;
        paymentStatus: string;
        handedOverToSector?: boolean;
        handedOverToDivision?: boolean;
    }>
) {
    let totalLiters = 0;
    let paidLiters = 0;
    let pendingLiters = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let sectorHandoverLiters = 0;
    let sectorHandoverCount = 0;
    let divisionHandoverLiters = 0;
    let divisionHandoverCount = 0;

    for (const o of orders) {
        const l = o.liters || 0;
        totalLiters += l;
        if (o.paymentStatus === "PAID") {
            paidLiters += l;
            paidCount += 1;
        } else {
            pendingLiters += l;
            pendingCount += 1;
        }
        if (o.handedOverToSector) {
            sectorHandoverLiters += l;
            sectorHandoverCount += 1;
        }
        if (o.handedOverToDivision) {
            divisionHandoverLiters += l;
            divisionHandoverCount += 1;
        }
    }

    const rTotal = roundLiters(totalLiters);
    const rPaid = roundLiters(paidLiters);
    const rPending = roundLiters(pendingLiters);
    const rSecHandover = roundLiters(sectorHandoverLiters);
    const rDivHandover = roundLiters(divisionHandoverLiters);

    return {
        totalOrders: orders.length,
        totalLiters: rTotal,
        totalAmount: calculatePayasamAmount(rTotal),
        paidLiters: rPaid,
        paidAmount: calculatePayasamAmount(rPaid),
        paidCount,
        pendingLiters: rPending,
        pendingAmount: calculatePayasamAmount(rPending),
        pendingCount,
        sectorHandoverLiters: rSecHandover,
        sectorHandoverAmount: calculatePayasamAmount(rSecHandover),
        sectorHandoverCount,
        divisionHandoverLiters: rDivHandover,
        divisionHandoverAmount: calculatePayasamAmount(rDivHandover),
        divisionHandoverCount,
    };
}

export function roundLiters(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 100) / 100;
}

export function formatLiters(value: number): string {
    const rounded = roundLiters(value);
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function normalizePaymentStatus(status?: string | null): PaymentStatus {
    return status?.toUpperCase() === "PAID" ? "PAID" : "PENDING";
}

export function normalizeMobile(mobile: string): string {
    return mobile.trim().replace(/\s+/g, "");
}

export function isEnglishName(name: string): boolean {
    const trimmed = name.trim();
    return /^[A-Za-z\s.'-]+$/.test(trimmed) && /[A-Za-z]/.test(trimmed);
}

export function sanitizeEnglishNameInput(value: string): string {
    return value.replace(/[^A-Za-z\s.'-]/g, "");
}

export function isTenDigitMobile(mobile: string): boolean {
    return /^\d{10}$/.test(mobile.trim());
}

export function sanitizeMobileInput(value: string): string {
    return value.replace(/\D/g, "").slice(0, 10);
}

export function validateOrderInput(body: {
    personName?: unknown;
    mobile?: unknown;
    liters?: unknown;
    paymentStatus?: unknown;
    notes?: unknown;
}) {
    const personName = typeof body.personName === "string" ? body.personName.trim() : "";
    const rawMobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
    const litersNum = Number(body.liters);
    const paymentStatus = normalizePaymentStatus(
        typeof body.paymentStatus === "string" ? body.paymentStatus : "PENDING"
    );
    const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

    if (!personName) {
        return { ok: false as const, error: "Person name is required." };
    }
    if (!isEnglishName(personName)) {
        return { ok: false as const, error: "Person name must be in English letters only." };
    }
    if (!isTenDigitMobile(rawMobile)) {
        return { ok: false as const, error: "Mobile number must be exactly 10 digits." };
    }
    if (!Number.isFinite(litersNum) || litersNum <= 0) {
        return { ok: false as const, error: "Liters must be greater than 0." };
    }

    return {
        ok: true as const,
        data: {
            personName,
            mobile: rawMobile,
            liters: roundLiters(litersNum),
            paymentStatus,
            notes,
        },
    };
}

export function buildWhatsAppShareUrl(text: string): string {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildUnitNamesAndLitersText(params: {
    unitName: string;
    sectorName?: string;
    orders: Array<{ personName: string; liters: number }>;
}): string {
    const { unitName, sectorName, orders } = params;
    const totalLiters = roundLiters(orders.reduce((sum, o) => sum + (o.liters || 0), 0));
    const lines = orders.map(
        (o, idx) => `${idx + 1}. ${o.personName} - ${formatLiters(o.liters)} L`
    );

    return [
        `*Payasam Challenge - Order List*`,
        `Unit: *${unitName}*${sectorName ? ` (${sectorName} Sector)` : ""}`,
        ``,
        ...(lines.length > 0 ? lines : ["No orders recorded yet."]),
        ``,
        `*Total Orders:* ${orders.length}`,
        `*Total Liters:* ${formatLiters(totalLiters)} L`,
    ].join("\n");
}

export function buildSectorAnalysisText(params: {
    sectorName: string;
    targetLiters: number;
    achievedLiters: number;
    paidLiters: number;
    pendingLiters: number;
    totalOrders: number;
    units: Array<{ unitName: string; totalLiters: number; ordersCount: number }>;
}): string {
    const {
        sectorName,
        targetLiters,
        achievedLiters,
        paidLiters,
        pendingLiters,
        totalOrders,
        units,
    } = params;

    const remaining = roundLiters(Math.max(0, targetLiters - achievedLiters));
    const pct = targetLiters > 0 ? Math.round((achievedLiters / targetLiters) * 100) : 0;

    const unitLines = units.map(
        (u, idx) => `${idx + 1}. ${u.unitName}: *${formatLiters(u.totalLiters)} L*`
    );

    return [
        `*Payasam Challenge - Analysis*`,
        ``,
        `Target: *${formatLiters(targetLiters)} L*`,
        `Achieved: *${formatLiters(achievedLiters)} L*${targetLiters > 0 ? ` (${pct}%)` : ""}`,
        `Remaining: *${formatLiters(remaining)} L*`,
        `Total Orders: ${totalOrders}`,
        ``,
        `*Unit-wise Status:*`,
        ...(unitLines.length > 0 ? unitLines : ["No units found."]),
        ``,
        `©️ SSF ${sectorName} Sector`,
    ].join("\n");
}

export function buildDivisionAnalysisText(params: {
    totalTarget: number;
    totalAchieved: number;
    paidLiters: number;
    pendingLiters: number;
    totalOrders: number;
    sectors: Array<{
        name: string;
        targetLiters: number;
        achievedLiters: number;
        ordersCount: number;
    }>;
}): string {
    const {
        totalTarget,
        totalAchieved,
        paidLiters,
        pendingLiters,
        totalOrders,
        sectors,
    } = params;

    const remaining = roundLiters(Math.max(0, totalTarget - totalAchieved));
    const pct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

    const sectorLines = sectors.map(
        (s, idx) => `${idx + 1}. ${s.name}: *${formatLiters(s.achievedLiters)} L*`
    );

    return [
        `*Payasam Challenge - Analysis*`,
        ``,
        `Target: *${formatLiters(totalTarget)} L*`,
        `Achieved: *${formatLiters(totalAchieved)} L*${totalTarget > 0 ? ` (${pct}%)` : ""}`,
        `Remaining: *${formatLiters(remaining)} L*`,
        `Total Orders: ${totalOrders}`,
        ``,
        `*Sector-wise Status:*`,
        ...(sectorLines.length > 0 ? sectorLines : ["No sectors found."]),
        ``,
        `©️ SSF Pulikkal Division`,
    ].join("\n");
}
