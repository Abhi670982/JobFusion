import { NextResponse } from "next/server";
import { getOrCreateMongoUser } from "./auth-sync";

/**
 * Standard security helper to enforce Clerk authentication across all API routes.
 * Returns the authenticated user object or an explicit 401 Unauthorized response.
 */
export async function requireAuthUser() {
  try {
    const user = await getOrCreateMongoUser();
    if (!user) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        ),
      };
    }
    return { user, errorResponse: null };
  } catch (error) {
    console.error("[Security Auth Error]:", error);
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
}

/**
 * Verifies that the resource owner matches the authenticated user ID.
 * Returns a 403 Forbidden response if ownership check fails.
 */
export function verifyOwnership(resourceOwnerId: string, authenticatedUserId: string): NextResponse | null {
  if (!resourceOwnerId || !authenticatedUserId || resourceOwnerId !== authenticatedUserId) {
    return NextResponse.json(
      { success: false, error: "Forbidden: You do not have permission to access this resource" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Sanitizes server error responses to prevent stack traces, Prisma schema, or internal
 * credential leakage to clients while keeping full diagnostic logs on the server.
 */
export function safeErrorResponse(
  error: unknown,
  defaultMessage = "An internal server error occurred",
  status = 500
): NextResponse {
  console.error("[Internal API Exception]:", error);
  return NextResponse.json(
    { success: false, error: defaultMessage },
    { status }
  );
}
