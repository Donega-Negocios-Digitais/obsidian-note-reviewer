import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handlePreflightRequest, setCorsHeaders } from "../../utils/cors";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin;
  setCorsHeaders(res, origin);
  if (handlePreflightRequest(req.method, res)) return;

  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  res.status(200).json({
    ok: true,
    status: "ok",
    mode: "hook-review-remote",
    timestamp: new Date().toISOString(),
  });
}
