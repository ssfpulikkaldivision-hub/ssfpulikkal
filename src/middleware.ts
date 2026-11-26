import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();

    // Short-circuit legacy /uploads/ requests immediately so they don't invoke Next.js SSR
    if (url.pathname.startsWith("/uploads/")) {
        return new NextResponse("Not Found", {
            status: 404,
            headers: { "Cache-Control": "public, max-age=86400" },
        });
    }

    const hostname = request.headers.get("host") || "";

    // Check if the request is coming via a "portal" subdomain (e.g. portal.domain.com or portal.localhost:3000)
    const isPortalSubdomain =
        hostname.startsWith("portal.") ||
        hostname.startsWith("portal-") ||
        process.env.PORTAL_SUBDOMAIN_FORCE === "true";

    // If accessing via portal subdomain and path does not already start with /portal or /api or /_next
    if (isPortalSubdomain) {
        if (
            !url.pathname.startsWith("/portal") &&
            !url.pathname.startsWith("/api") &&
            !url.pathname.startsWith("/_next") &&
            !url.pathname.includes(".")
        ) {
            url.pathname = `/portal${url.pathname === "/" ? "" : url.pathname}`;
            return NextResponse.rewrite(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)).*)",
    ],
};
