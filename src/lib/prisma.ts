import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

// Helper to resolve Cloudflare D1 binding from environment or context
function getD1Binding(): any {
    let binding =
        (globalThis as any).DB ||
        (process.env as any).DB ||
        (globalThis as any).env?.DB ||
        (globalThis as any).__env__?.DB ||
        (globalThis as any)["division-project26"] ||
        (globalThis as any)["division_project26"] ||
        (globalThis as any).env?.["division-project26"] ||
        (globalThis as any).env?.["division_project26"] ||
        (process.env as any)["division-project26"] ||
        (process.env as any)["division_project26"];

    if (!binding) {
        try {
            const cfContextSymbol = Symbol.for("__cloudflare-context__");
            const cfContext = (globalThis as any)[cfContextSymbol];
            if (cfContext?.env?.DB) {
                binding = cfContext.env.DB;
            } else if (cfContext?.env?.["division-project26"]) {
                binding = cfContext.env["division-project26"];
            }
        } catch {}
    }

    if (!binding) {
        try {
            const { getCloudflareContext } = require("@opennextjs/cloudflare");
            const ctx = getCloudflareContext({ async: false });
            if (ctx?.env?.DB) {
                binding = ctx.env.DB;
            } else if (ctx?.env?.["division-project26"]) {
                binding = ctx.env["division-project26"];
            }
        } catch {}
    }

    return binding;
}

let cachedClient: PrismaClient | null = null;
let isBoundToD1 = false;

function getPrismaClient(): PrismaClient {
    const binding = getD1Binding();

    // If Cloudflare worker D1 binding is present, prioritize it
    if (binding && typeof binding.prepare === "function") {
        if (!cachedClient || !isBoundToD1) {
            const adapter = new PrismaD1(binding);
            cachedClient = new PrismaClient({ adapter });
            isBoundToD1 = true;
        }
        return cachedClient;
    }

    if (cachedClient) return cachedClient;

    // Cloudflare D1 over HTTP REST API (used in local development when token is in .env)
    const useLocal = process.env.USE_LOCAL_DB === "true" || process.env.USE_LOCAL_SQLITE === "true";
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
    const token = process.env.CLOUDFLARE_D1_TOKEN;

    if (!useLocal && accountId && databaseId && token) {
        try {
            const adapter = new PrismaD1({
                CLOUDFLARE_ACCOUNT_ID: accountId,
                CLOUDFLARE_DATABASE_ID: databaseId,
                CLOUDFLARE_D1_TOKEN: token,
            });
            cachedClient = new PrismaClient({ adapter });
            return cachedClient;
        } catch {
            // fallback below
        }
    }

    // Fallback to standard SQLite client (for local dev.db)
    cachedClient = new PrismaClient();
    return cachedClient;
}

// Export a proxy so that calls to `prisma.*` resolve the client dynamically at request time
declare global {
    var prisma: PrismaClient | undefined;
}

const prismaProxy = new Proxy({} as PrismaClient, {
    get(target, prop, receiver) {
        const client = getPrismaClient();
        const value = (client as any)[prop];
        if (typeof value === "function") {
            return value.bind(client);
        }
        return value;
    },
});

export default prismaProxy;

