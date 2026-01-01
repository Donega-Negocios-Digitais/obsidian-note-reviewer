/**
 * Development server for Obsidian Note Reviewer Portal
 * Serves config API endpoints for local development
 */

import { join } from "path";

const projectRoot = join(import.meta.dir, "../..");

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
          return Response.json({ ok: true, files: [] });
        }

        const files = await fs.readdir(configDir);
        const mdFiles = files
          .filter(f => f.endsWith('.md'))
          .map(f => ({
            name: f,
            displayName: f.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            path: pathModule.join(configDir, f)
          }));

        return Response.json({ ok: true, files: mdFiles });
      } catch (error) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : "Erro ao listar configurações" },
          { status: 500 }
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
            { status: 400 }
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
            { status: 403 }
          );
        }

        const content = await fs.readFile(filePath, "utf-8");

        return Response.json({ ok: true, content, fileName });
      } catch (error) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : "Erro ao ler configuração" },
          { status: 500 }
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
            { status: 400 }
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
            { status: 403 }
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

        return Response.json({ ok: true, message: "Configuração salva com sucesso" });
      } catch (error) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : "Erro ao salvar configuração" },
          { status: 500 }
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

        return Response.json({ ok: true, validationResults });
      } catch (error) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : "Erro na validação" },
          { status: 500 }
        );
      }
    }

    return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  },
});

console.log(`[DevServer] Development API server running on http://localhost:${server.port}`);
console.log(`[DevServer] Project root: ${projectRoot}`);
