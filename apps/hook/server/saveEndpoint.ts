import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { validatePath, validatePathWithAllowedDirs } from "./pathValidation";

interface SaveRequestBody {
  content?: unknown;
  path?: unknown;
}

function buildJsonHeaders(
  securityHeaders: Record<string, string>
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...securityHeaders,
  };
}

export function parseAllowedSavePaths(
  rawValue = process.env.ALLOWED_SAVE_PATHS
): string[] {
  if (!rawValue) return [];
  return rawValue
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function handleSaveEndpoint(
  req: Request,
  securityHeaders: Record<string, string>
): Promise<Response> {
  const headers = buildJsonHeaders(securityHeaders);

  let body: SaveRequestBody;
  try {
    body = (await req.json()) as SaveRequestBody;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400, headers }
    );
  }

  if (typeof body.path !== "string" || !body.path.trim()) {
    return Response.json(
      { ok: false, error: "Field 'path' is required" },
      { status: 400, headers }
    );
  }

  if (body.content !== undefined && typeof body.content !== "string") {
    return Response.json(
      { ok: false, error: "Field 'content' must be a string" },
      { status: 400, headers }
    );
  }

  const rawPath = body.path.trim();
  const content = typeof body.content === "string" ? body.content : "";

  const basicValidation = validatePath(rawPath);
  if (!basicValidation.valid) {
    return Response.json(
      { ok: false, error: basicValidation.error || "Invalid path" },
      { status: 400, headers }
    );
  }

  let safePath = basicValidation.normalizedPath || rawPath;
  const allowedSavePaths = parseAllowedSavePaths();
  if (allowedSavePaths.length > 0) {
    const restrictedValidation = validatePathWithAllowedDirs(
      safePath,
      allowedSavePaths
    );
    if (!restrictedValidation.valid) {
      return Response.json(
        {
          ok: false,
          error:
            restrictedValidation.error || "Path is not allowed for write access",
        },
        { status: 403, headers }
      );
    }
    safePath = restrictedValidation.normalizedPath || safePath;
  }

  try {
    await mkdir(dirname(safePath), { recursive: true });
    await writeFile(safePath, content, "utf-8");
    return Response.json(
      { ok: true, message: "Nota salva com sucesso", path: safePath },
      { headers }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao salvar nota",
      },
      { status: 500, headers }
    );
  }
}
