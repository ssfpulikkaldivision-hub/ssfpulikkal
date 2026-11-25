/**
 * Councillor & Ticket Utilities
 */

/**
 * Normalizes a mobile number: removes non-digits, strips leading +91 or 0 if 10-digit Indian number.
 */
export function normalizeMobile(phone: string): string {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith("0")) {
        return digits.slice(1);
    }
    return digits;
}

/**
 * Formats a 10-digit mobile number for display: e.g. 98765 43210
 */
export function formatMobile(phone: string): string {
    const norm = normalizeMobile(phone);
    if (norm.length === 10) {
        return `${norm.slice(0, 5)} ${norm.slice(5)}`;
    }
    return phone;
}

/**
 * Generates the next sequential ticket number like DSC-26-0001
 */
export function formatTicketNumber(index: number, prefix: string = "DSC-26"): string {
    return `${prefix}-${String(index).padStart(4, "0")}`;
}
