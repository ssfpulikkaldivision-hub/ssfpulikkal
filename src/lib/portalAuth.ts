import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export interface PortalSession {
    id: string;
    type: "DIVISION" | "SECTOR" | "UNIT";
    name: string;
    code: string | null;
    username: string;
    sectorId?: string;
    sectorName?: string;
    presidentName?: string | null;
    presidentMobile?: string | null;
    secretaryName?: string | null;
    secretaryMobile?: string | null;
}

const COOKIE_NAME = "ssf_portal_session";
const SECRET_KEY = process.env.NEXTAUTH_SECRET || "ssf-pulikkal-division-portal-secret-key-2026";

// Helpers for UTF-8 base64url encoding/decoding
function base64UrlEncode(str: string): string {
    return Buffer.from(str, "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
        base64 += "=";
    }
    return Buffer.from(base64, "base64").toString("utf-8");
}

function bufferToBase64Url(buf: ArrayBuffer): string {
    return Buffer.from(buf)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function getHmacKey(): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return await crypto.subtle.importKey(
        "raw",
        enc.encode(SECRET_KEY),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

export async function signPortalToken(payload: PortalSession, expiresInSeconds = 60 * 60 * 24 * 30): Promise<string> {
    const key = await getHmacKey();
    const enc = new TextEncoder();
    const header = { alg: "HS256", typ: "JWT" };
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const body = { ...payload, exp };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedBody = base64UrlEncode(JSON.stringify(body));
    const message = `${encodedHeader}.${encodedBody}`;

    const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
    const signatureStr = bufferToBase64Url(signature);

    return `${message}.${signatureStr}`;
}

export async function verifyPortalToken(token: string): Promise<PortalSession | null> {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const [headerPart, bodyPart, sigPart] = parts;
        const key = await getHmacKey();
        const enc = new TextEncoder();
        const message = `${headerPart}.${bodyPart}`;

        let sigBase64 = sigPart.replace(/-/g, "+").replace(/_/g, "/");
        while (sigBase64.length % 4) sigBase64 += "=";
        const rawSig = new Uint8Array(Buffer.from(sigBase64, "base64"));

        const isValid = await crypto.subtle.verify("HMAC", key, rawSig, enc.encode(message));
        if (!isValid) return null;

        const body = JSON.parse(base64UrlDecode(bodyPart));
        if (body.exp && body.exp < Math.floor(Date.now() / 1000)) {
            return null; // Expired
        }

        return {
            id: body.id,
            type: body.type,
            name: body.name,
            code: body.code,
            username: body.username,
            sectorId: body.sectorId,
            sectorName: body.sectorName,
            presidentName: body.presidentName,
            presidentMobile: body.presidentMobile,
            secretaryName: body.secretaryName,
            secretaryMobile: body.secretaryMobile,
        };
    } catch (err) {
        return null;
    }
}

export async function getPortalSession(): Promise<PortalSession | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;
        if (!token) return null;
        return await verifyPortalToken(token);
    } catch {
        return null;
    }
}

export async function authenticatePortalEntity(
    identifier: string,
    passwordAttempt: string
): Promise<{ success: boolean; session?: PortalSession; error?: string }> {
    if (!identifier || !passwordAttempt) {
        return { success: false, error: "Username/Code and password are required" };
    }

    const trimmed = identifier.trim();
    const cleanId = trimmed.toLowerCase();

    // 1. Check Division / Admin account
    const admin = await prisma.admin.findFirst({
        where: {
            OR: [
                { username: trimmed },
                { username: cleanId },
            ],
        },
    });

    if (admin && admin.password) {
        const isMatch =
            admin.password === passwordAttempt.trim() ||
            (admin.password.startsWith("$2") && (await bcrypt.compare(passwordAttempt.trim(), admin.password)));

        if (isMatch) {
            const session: PortalSession = {
                id: admin.id,
                type: "DIVISION",
                name: "SSF Pulikkal Division",
                code: "DIV",
                username: admin.username,
                sectorId: "division",
                sectorName: "SSF Pulikkal Division",
            };
            return { success: true, session };
        }
    }

    // 2. Check Sector
    const sector = await prisma.sector.findFirst({
        where: {
            OR: [
                { username: trimmed },
                { code: trimmed },
                { code: cleanId },
                { username: cleanId },
                { name: trimmed },
            ],
        },
    });

    if (sector && sector.password) {
        const isMatch =
            sector.password === passwordAttempt.trim() ||
            (sector.password.startsWith("$2") && (await bcrypt.compare(passwordAttempt.trim(), sector.password)));

        if (isMatch) {
            const session: PortalSession = {
                id: sector.id,
                type: "SECTOR",
                name: sector.name,
                code: sector.code,
                username: sector.username || sector.code || sector.id,
                sectorId: sector.id,
                sectorName: sector.name,
                presidentName: sector.presidentName,
                presidentMobile: sector.presidentMobile,
                secretaryName: sector.secretaryName,
                secretaryMobile: sector.secretaryMobile,
            };
            return { success: true, session };
        }
    }

    // 2. Check Unit
    const unit = await prisma.unit.findFirst({
        where: {
            OR: [
                { username: trimmed },
                { code: trimmed },
                { code: cleanId },
                { username: cleanId },
                { name: trimmed },
            ],
        },
        include: {
            sector: true,
        },
    });

    if (unit && unit.password) {
        const isMatch =
            unit.password === passwordAttempt.trim() ||
            (unit.password.startsWith("$2") && (await bcrypt.compare(passwordAttempt.trim(), unit.password)));

        if (isMatch) {
            const session: PortalSession = {
                id: unit.id,
                type: "UNIT",
                name: unit.name,
                code: unit.code,
                username: unit.username || unit.code || unit.id,
                sectorId: unit.sectorId,
                sectorName: unit.sector?.name || "",
                presidentName: unit.presidentName,
                presidentMobile: unit.presidentMobile,
                secretaryName: unit.secretaryName,
                secretaryMobile: unit.secretaryMobile,
            };
            return { success: true, session };
        }
    }

    return { success: false, error: "Invalid username or password" };
}

export { COOKIE_NAME };
