export interface HookAuthRuntimeArgs {
  runtime: "portal" | "hook";
  sessionId?: string | null;
  reviewKey?: string | null;
}

function hasValue(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

// Local hook runtime must stay usable without login.
// Auth is required only for portal hook-review sessions with session credentials.
export function isHookAuthRequiredForRuntime(
  args: HookAuthRuntimeArgs
): boolean {
  return args.runtime === "portal" && hasValue(args.sessionId) && hasValue(args.reviewKey);
}
