import { auth0 } from "@/lib/auth0";

// Default tenant ID from .env
const DEFAULT_TENANT_ID =
  process.env.TENANT_ID || "484fb776-2077-410f-a4dd-1432df766103";

export interface SessionUser {
  userId: string; // Auth0 user ID (sub claim)
  tenantId: string;
  email?: string;
  name?: string;
}

/**
 * Get the current authenticated user from the Auth0 session.
 * Returns null if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return null;

    return {
      userId: session.user.sub,
      tenantId: DEFAULT_TENANT_ID,
      email: session.user.email,
      name: session.user.name,
    };
  } catch {
    return null;
  }
}
