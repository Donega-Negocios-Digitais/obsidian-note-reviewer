/**
 * Development server for Obsidian Note Reviewer Portal
 * Serves config API endpoints for local development
 *
 * Security: This server includes CSP headers on all API responses.
 * While the main Vite dev server handles CSP for HTML/static assets,
 * this API server also enforces security headers for defense-in-depth.
 */

import { join } from "path";
import { getPortalCSP } from "@obsidian-note-reviewer/security/csp";
import { Liveblocks } from "@liveblocks/node";
import type { AuthorizeResult } from "@liveblocks/node";

const projectRoot = join(import.meta.dir, "../..");

// Initialize Liveblocks with secret key (only if configured)
const liveblocksSecretKey = process.env.LIVEBLOCKS_SECRET_KEY;
const liveblocks = liveblocksSecretKey ? new Liveblocks({
  secret: liveblocksSecretKey,
}) : null;

// CSP header for API responses (development mode)
const cspHeader = getPortalCSP(true);

/**
 * Security headers applied to all API responses
 * CSP prevents XSS attacks even when handling user-generated content
 */
function getSecurityHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": cspHeader,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

const server = Bun.serve({
  port: 3002,

  async fetch(req) {
    const url = new URL(req.url);

    console.log(`[DevServer] ${req.method} ${url.pathname}`);

    // API: List configuration files
    if (url.pathname === "/api/config/list" && req.method === "GET") {
      try {
        const fs = await import("fs/promises");
        const pathModule = await import("path");

        const configDir = pathModule.join(projectRoot, "references");
        console.log(`[DevServer] Config dir: ${configDir}`);

        // Ensure directory exists
        try {
          await fs.access(configDir);
        } catch {
          return Response.json({ ok: true, files: [] }, { headers: getSecurityHeaders() });
        }

        const files = await fs.readdir(configDir);
        const mdFiles = files
          .filter(f => f.endsWith('.md'))
          .map(f => ({
            name: f,
            displayName: f.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            path: pathModule.join(configDir, f)
          }));

        return Response.json({ ok: true, files: mdFiles }, { headers: getSecurityHeaders() });
      } catch (error) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : "Erro ao listar configurações" },
          { status: 500, headers: getSecurityHeaders() }
        );
      }
    }

    // API: Read configuration file
    if (url.pathname === "/api/config/read" && req.method === "GET") {
      try {
        const fileName = url.searchParams.get("file");
        if (!fileName) {
          return Response.json(
            { ok: false, error: "Parâmetro 'file' é obrigatório" },
            { status: 400, headers: getSecurityHeaders() }
          );
        }

        const fs = await import("fs/promises");
        const pathModule = await import("path");

        const configDir = pathModule.join(projectRoot, "references");
        const filePath = pathModule.join(configDir, fileName);

        // Security: Ensure file is within references directory
        if (!filePath.startsWith(configDir)) {
          return Response.json(
            { ok: false, error: "Caminho de arquivo inválido" },
            { status: 403, headers: getSecurityHeaders() }
          );
        }

        const content = await fs.readFile(filePath, "utf-8");

        return Response.json({ ok: true, content, fileName }, { headers: getSecurityHeaders() });
      } catch (error) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : "Erro ao ler configuração" },
          { status: 500, headers: getSecurityHeaders() }
        );
      }
    }

    // API: Save configuration file
    if (url.pathname === "/api/config/save" && req.method === "POST") {
      try {
        const body = await req.json() as { fileName: string; content: string };

        if (!body.fileName || body.content === undefined) {
          return Response.json(
            { ok: false, error: "Parâmetros 'fileName' e 'content' são obrigatórios" },
            { status: 400, headers: getSecurityHeaders() }
          );
        }

        const fs = await import("fs/promises");
        const pathModule = await import("path");

        const configDir = pathModule.join(projectRoot, "references");
        const filePath = pathModule.join(configDir, body.fileName);

        // Security: Ensure file is within references directory
        if (!filePath.startsWith(configDir)) {
          return Response.json(
            { ok: false, error: "Caminho de arquivo inválido" },
            { status: 403, headers: getSecurityHeaders() }
          );
        }

        // Ensure directory exists
        await fs.mkdir(configDir, { recursive: true });

        // CRITICAL: Create backup before saving
        const backupPath = `${filePath}.bak`;
        try {
          // Check if file exists before backing up
          await fs.access(filePath);
          // File exists, create backup
          await fs.copyFile(filePath, backupPath);
        } catch {
          // File doesn't exist yet (first save), skip backup
        }

        // Save file
        await fs.writeFile(filePath, body.content, "utf-8");

        return Response.json({ ok: true, message: "Configuração salva com sucesso" }, { headers: getSecurityHeaders() });
      } catch (error) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : "Erro ao salvar configuração" },
          { status: 500, headers: getSecurityHeaders() }
        );
      }
    }

    // API: Validate config paths (templates, folders)
    if (url.pathname === "/api/config/validate-paths" && req.method === "POST") {
      try {
        const body = await req.json() as { content: string };
        const fs = await import("fs/promises");

        // Extract paths from content (templates and folders)
        const pathRegex = /(?:template|Template|pasta|Pasta|Atlas|Work)[^\n]*?([A-Z]:[\\\/][^\s`"'\n]+(?:\.md)?)/g;
        const matches = [...body.content.matchAll(pathRegex)];

        const validationResults: { path: string; exists: boolean }[] = [];

        for (const match of matches) {
          const path = match[1].replace(/`$/, ''); // Remove trailing backtick if present
          try {
            await fs.access(path);
            validationResults.push({ path, exists: true });
          } catch {
            validationResults.push({ path, exists: false });
          }
        }

        return Response.json({ ok: true, validationResults }, { headers: getSecurityHeaders() });
      } catch (error) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : "Erro na validação" },
          { status: 500, headers: getSecurityHeaders() }
        );
      }
    }

    // API: Liveblocks authentication endpoint
    // Authorizes access to Liveblocks rooms for real-time collaboration
    if (url.pathname === "/api/liveblocks-auth" && req.method === "POST") {
      try {
        // Check if Liveblocks is configured
        if (!liveblocks) {
          console.error("[DevServer] Liveblocks not configured - LIVEBLOCKS_SECRET_KEY not set");
          return new Response(
            JSON.stringify({ error: "Liveblocks not configured. Set LIVEBLOCKS_SECRET_KEY environment variable." }),
            { status: 500, headers: { ...getSecurityHeaders(), "Content-Type": "application/json" } }
          );
        }

        // Parse request body
        const body = await req.json() as { roomId: string };
        const { roomId } = body;

        if (!roomId) {
          return new Response(
            JSON.stringify({ error: "roomId is required" }),
            { status: 400, headers: { ...getSecurityHeaders(), "Content-Type": "application/json" } }
          );
        }

        // Get user from session (if authenticated)
        // For dev purposes, allow anonymous access with a default user
        const userId = "anonymous-user";
        const userName = "Anonymous User";

        // Authorize the room access
        const result: AuthorizeResult = await liveblocks.authorize({
          room: roomId,
          userId: userId,
        });

        // Return the token to the client
        if (result.error) {
          console.error("[DevServer] Liveblocks auth error:", result.error);
          return new Response(
            JSON.stringify({ error: result.error.message }),
            { status: 403, headers: { ...getSecurityHeaders(), "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ token: result.data?.token }),
          { headers: { ...getSecurityHeaders(), "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("[DevServer] Liveblocks auth exception:", error);
        return new Response(
          JSON.stringify({ error: "Authentication failed" }),
          { status: 500, headers: { ...getSecurityHeaders(), "Content-Type": "application/json" } }
        );
      }
    }

    // API: Send collaboration invite email via Resend
    if (url.pathname === "/api/invite" && req.method === "POST") {
      const { POST } = await import("./api/invite");
      return POST(req);
    }

    return Response.json({ ok: false, error: "Not found" }, { status: 404, headers: getSecurityHeaders() });
  },
});

console.log(`[DevServer] Development API server running on http://localhost:${server.port}`);
console.log(`[DevServer] Project root: ${projectRoot}`);
