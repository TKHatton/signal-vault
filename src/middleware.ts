import { auth0 } from "@/lib/auth0";
import { NextRequest } from "next/server";

// Auth0 middleware — intercepts requests and handles the OAuth flow
// Automatically mounts these routes:
//   /auth/login    — Redirects to Auth0 login page
//   /auth/logout   — Logs out and clears session
//   /auth/callback — Handles OAuth callback
//   /auth/profile  — Returns user profile as JSON
//   /auth/access-token — Returns access token
export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

// Force Node.js runtime (Auth0 SDK requires Node.js APIs not available in Edge)
export const runtime = "nodejs";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
