import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  handleSaveEndpoint,
  parseAllowedSavePaths,
} from "../saveEndpoint";

const EMPTY_HEADERS = {};

async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

describe("saveEndpoint", () => {
  const originalAllowed = process.env.ALLOWED_SAVE_PATHS;

  afterEach(() => {
    if (originalAllowed === undefined) {
      delete process.env.ALLOWED_SAVE_PATHS;
    } else {
      process.env.ALLOWED_SAVE_PATHS = originalAllowed;
    }
  });

  test("saves markdown file to disk", async () => {
    const baseDir = await mkdtemp(join(tmpdir(), "obsreview-save-"));
    const targetPath = join(baseDir, "nested", "note.md");

    const request = new Request("http://localhost/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: targetPath,
        content: "# Test note",
      }),
    });

    const response = await handleSaveEndpoint(request, EMPTY_HEADERS);
    const payload = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);

    const savedContent = await readFile(targetPath, "utf-8");
    expect(savedContent).toBe("# Test note");
  });

  test("blocks traversal paths", async () => {
    const request = new Request("http://localhost/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "../../../etc/passwd",
        content: "malicious",
      }),
    });

    const response = await handleSaveEndpoint(request, EMPTY_HEADERS);
    const payload = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error).toBe("Path traversal detected");
  });

  test("enforces ALLOWED_SAVE_PATHS when configured", async () => {
    const allowedDir = await mkdtemp(join(tmpdir(), "obsreview-allowed-"));
    const forbiddenDir = await mkdtemp(join(tmpdir(), "obsreview-forbidden-"));
    process.env.ALLOWED_SAVE_PATHS = allowedDir;

    const allowedRequest = new Request("http://localhost/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: join(allowedDir, "ok.md"),
        content: "allowed",
      }),
    });
    const allowedResponse = await handleSaveEndpoint(allowedRequest, EMPTY_HEADERS);
    expect(allowedResponse.status).toBe(200);

    const forbiddenRequest = new Request("http://localhost/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: join(forbiddenDir, "blocked.md"),
        content: "blocked",
      }),
    });
    const forbiddenResponse = await handleSaveEndpoint(forbiddenRequest, EMPTY_HEADERS);
    const forbiddenPayload = await parseResponse(forbiddenResponse);

    expect(forbiddenResponse.status).toBe(403);
    expect(forbiddenPayload.ok).toBe(false);
    expect(forbiddenPayload.error).toBe("Path is not within any allowed directory");
  });

  test("parses ALLOWED_SAVE_PATHS list", () => {
    const parsed = parseAllowedSavePaths("C:/vault1, C:/vault2 , ,C:/vault3");
    expect(parsed).toEqual(["C:/vault1", "C:/vault2", "C:/vault3"]);
  });
});
