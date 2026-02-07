/**
 * Liveblocks Authentication Utilities
 *
 * Handles client-side authentication for Liveblocks rooms.
 * Fetches auth tokens from the server-side endpoint.
 */

/**
 * Response from Liveblocks auth endpoint
 */
export interface AuthResponse {
  token: string;
  error?: string;
}

/**
 * Request a Liveblocks room token from the server
 *
 * This function calls the backend auth endpoint which:
 * 1. Validates the user's session (Supabase auth)
 * 2. Generates a Liveblocks token using the secret key
 * 3. Returns the token for client-side use
 *
 * @param roomId - The Liveblocks room ID to authenticate for
 * @returns Auth response with token or error
 */
export async function getLiveblocksToken(roomId: string): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { token: data.token };
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return { token: "", error: "Failed to authenticate with Liveblocks" };
  }
}

/**
 * Check if Liveblocks authentication is properly configured
 *
 * Validates that the required environment variables are set.
 *
 * @returns true if configured, false otherwise
 */
export function isLiveblocksConfigured(): boolean {
  // Check if public key is available (will be injected by Vite)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return !!import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY;
  }

  // Fallback: assume configured in production
  return typeof window !== "undefined" && window.location.hostname !== "localhost";
}
