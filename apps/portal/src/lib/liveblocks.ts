/**
 * Liveblocks Client Configuration
 *
 * Configures Liveblocks v3 client for real-time presence and collaboration.
 * Uses client-side auth endpoint for secure token generation.
 */

import { createClient } from "@liveblocks/core";
import { createClientContext } from "@liveblocks/react";

/**
 * Liveblocks client with auth endpoint for token generation
 *
 * The authEndpoint is called by Liveblocks to obtain a room token.
 * This keeps the secret key secure on the server side.
 */
export const liveblocksClient = createClient({
  authEndpoint: "/api/liveblocks-auth",
  throttle: 100,
});

/**
 * React context provider for Liveblocks client
 *
 * Wrap your app with this provider to enable Liveblocks hooks.
 */
export const LiveblocksClientProvider = createClientContext(liveblocksClient);
