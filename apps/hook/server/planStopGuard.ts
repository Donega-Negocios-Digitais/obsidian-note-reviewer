import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

interface StopHookEvent {
  stop_hook_active?: boolean;
  transcript_path?: string;
  cwd?: string;
  session_id?: string;
  sessionId?: string;
}

interface TranscriptEntry {
  type?: string;
  uuid?: string;
  isMeta?: boolean;
  message?: {
    role?: string;
    content?: unknown;
  };
}

interface GuardState {
  attempts: Record<string, number>;
}

interface PlanGuardAnalysis {
  shouldBlock: boolean;
  reason: string;
  promptUuid: string | null;
  isPlanPrompt: boolean;
  hasPlanWrite: boolean;
}

const MAX_BLOCK_ATTEMPTS_PER_PROMPT = 2;
const DEFAULT_BLOCK_REASON =
  "Pedido de plano detectado sem persistencia em /.claude/plans. Reescreva usando Write em /.claude/plans/<nome-do-plano>.md antes de responder no chat.";

function getStatePath(): string {
  return resolve(process.cwd(), ".temp", "plan-stop-guard-state.json");
}

function getLogPath(): string {
  return resolve(process.cwd(), ".logs", "plan-stop-guard.log");
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizePathForMatch(value: string): string {
  return value.replace(/\\/g, "/").toLowerCase();
}

function isClaudePlanPath(filePath: string): boolean {
  const normalized = normalizePathForMatch(filePath);
  return (
    normalized.includes("/.claude/plans/") ||
    normalized.startsWith(".claude/plans/") ||
    normalized.startsWith("./.claude/plans/")
  );
}

function extractPlanPathFromBashCommand(command: string): string {
  if (!command.trim()) {
    return "";
  }

  const matches = command.match(
    /[A-Za-z]:[\\/][^\s"'`<>|]+?\.claude[\\/]+plans[\\/][^\s"'`<>|]+?\.md|(?:^|[\s"'`])(?:\.[\\/])?\.claude[\\/]+plans[\\/][^\s"'`<>|]+?\.md/gi
  );
  if (!matches || matches.length === 0) {
    return "";
  }

  return matches[0].trim().replace(/^["'`]/, "").replace(/["'`]$/, "");
}

function pickFirstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function isLikelyPlanPrompt(text: string): boolean {
  const normalized = normalizeText(text);

  const hasPlanKeyword = /\b(plano|plan)\b/.test(normalized);
  const hasCreationKeyword =
    /\b(crie|criar|gere|gerar|elabore|escreva|monte|create|make|draft|outline)\b/.test(
      normalized
    );
  const hasStepsKeyword = /\b(passos?|steps?|etapas?)\b/.test(normalized);

  return hasPlanKeyword && (hasCreationKeyword || hasStepsKeyword);
}

function getPromptText(entry: TranscriptEntry): string {
  const content = entry.message?.content;
  if (typeof content === "string") return content;
  return "";
}

function hasPlanWriteBetween(entries: TranscriptEntry[], startIndex: number): boolean {
  const pendingPlanToolUseIds = new Set<string>();

  for (let i = startIndex; i < entries.length; i += 1) {
    const entry = entries[i];
    if (entry.type === "assistant") {
      const content = entry.message?.content;
      if (!Array.isArray(content)) continue;

      for (const block of content) {
        if (!block || typeof block !== "object") continue;
        const typedBlock = block as {
          type?: string;
          id?: string;
          name?: string;
          input?: {
            file_path?: unknown;
            filePath?: unknown;
            path?: unknown;
            command?: unknown;
          };
        };

        if (typedBlock.type !== "tool_use") continue;
        if (!typedBlock.name || !typedBlock.id) continue;

        let filePath = "";
        if (
          typedBlock.name === "Write" ||
          typedBlock.name === "Edit" ||
          typedBlock.name === "MultiEdit"
        ) {
          filePath = pickFirstString(
            typedBlock.input?.file_path,
            typedBlock.input?.filePath,
            typedBlock.input?.path
          );
        } else if (typedBlock.name === "Bash") {
          filePath = extractPlanPathFromBashCommand(
            pickFirstString(typedBlock.input?.command)
          );
        } else {
          continue;
        }

        if (filePath && isClaudePlanPath(filePath)) {
          pendingPlanToolUseIds.add(typedBlock.id);
        }
      }
      continue;
    }

    if (entry.type === "user") {
      const content = entry.message?.content;
      if (!Array.isArray(content)) continue;

      for (const block of content) {
        if (!block || typeof block !== "object") continue;
        const typedBlock = block as {
          type?: string;
          tool_use_id?: string;
          is_error?: boolean;
        };

        if (typedBlock.type !== "tool_result") continue;
        if (!typedBlock.tool_use_id) continue;
        if (!pendingPlanToolUseIds.has(typedBlock.tool_use_id)) continue;

        if (typedBlock.is_error !== true) {
          return true;
        }
      }
    }
  }

  return false;
}

function findLastExternalUserPrompt(entries: TranscriptEntry[]): {
  index: number;
  uuid: string;
  text: string;
} | null {
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const entry = entries[i];
    if (entry.type !== "user") continue;
    if (entry.isMeta) continue;
    if (entry.message?.role !== "user") continue;
    if (typeof entry.message?.content !== "string") continue;

    return {
      index: i,
      uuid: entry.uuid || `user-${i}`,
      text: getPromptText(entry),
    };
  }

  return null;
}

function parseTranscript(transcriptRaw: string): TranscriptEntry[] {
  return transcriptRaw
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as TranscriptEntry;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is TranscriptEntry => Boolean(entry));
}

export function analyzeTranscriptForMissingPlanWrite(
  transcriptRaw: string
): PlanGuardAnalysis {
  const entries = parseTranscript(transcriptRaw);
  const prompt = findLastExternalUserPrompt(entries);

  if (!prompt) {
    return {
      shouldBlock: false,
      reason: "No external user prompt found in transcript.",
      promptUuid: null,
      isPlanPrompt: false,
      hasPlanWrite: false,
    };
  }

  const isPlanPrompt = isLikelyPlanPrompt(prompt.text);
  if (!isPlanPrompt) {
    return {
      shouldBlock: false,
      reason: "Last user prompt is not a plan request.",
      promptUuid: prompt.uuid,
      isPlanPrompt,
      hasPlanWrite: false,
    };
  }

  const hasPlanWrite = hasPlanWriteBetween(entries, prompt.index);
  if (hasPlanWrite) {
    return {
      shouldBlock: false,
      reason: "Plan write detected in /.claude/plans.",
      promptUuid: prompt.uuid,
      isPlanPrompt,
      hasPlanWrite,
    };
  }

  return {
    shouldBlock: true,
    reason: DEFAULT_BLOCK_REASON,
    promptUuid: prompt.uuid,
    isPlanPrompt,
    hasPlanWrite,
  };
}

async function loadGuardState(): Promise<GuardState> {
  const statePath = getStatePath();
  try {
    const raw = await readFile(statePath, "utf-8");
    const parsed = JSON.parse(raw) as GuardState;
    if (!parsed || typeof parsed !== "object" || typeof parsed.attempts !== "object") {
      return { attempts: {} };
    }
    return parsed;
  } catch {
    return { attempts: {} };
  }
}

async function saveGuardState(state: GuardState): Promise<void> {
  const statePath = getStatePath();
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify(state, null, 2), "utf-8");
}

async function logGuardEvent(event: string, extra: Record<string, unknown>): Promise<void> {
  const logPath = getLogPath();
  await mkdir(dirname(logPath), { recursive: true });
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...extra,
  });
  await appendFile(logPath, `${line}\n`, "utf-8");
}

function getSessionIdFromEvent(event: StopHookEvent): string {
  return pickFirstString(event.session_id, event.sessionId) || "unknown-session";
}

export async function runPlanStopGuard(): Promise<void> {
  const raw = await Bun.stdin.text();
  if (!raw.trim()) {
    process.exit(0);
  }

  let event: StopHookEvent;
  try {
    event = JSON.parse(raw) as StopHookEvent;
  } catch {
    process.exit(0);
    return;
  }

  const transcriptPath = pickFirstString(event.transcript_path);
  if (!transcriptPath) {
    await logGuardEvent("skip_missing_transcript_path", {
      sessionId: getSessionIdFromEvent(event),
    });
    process.exit(0);
    return;
  }

  let transcriptRaw = "";
  try {
    transcriptRaw = await readFile(transcriptPath, "utf-8");
  } catch {
    await logGuardEvent("skip_transcript_read_failed", {
      sessionId: getSessionIdFromEvent(event),
      transcriptPath,
    });
    process.exit(0);
    return;
  }

  const analysis = analyzeTranscriptForMissingPlanWrite(transcriptRaw);
  const sessionId = getSessionIdFromEvent(event);
  const state = await loadGuardState();
  const stateKey = `${sessionId}:${analysis.promptUuid || "unknown-prompt"}`;

  if (!analysis.isPlanPrompt || analysis.hasPlanWrite || !analysis.shouldBlock) {
    delete state.attempts[stateKey];
    await saveGuardState(state);
    await logGuardEvent("allow", {
      sessionId,
      promptUuid: analysis.promptUuid,
      reason: analysis.reason,
      plan_prompt_detected: analysis.isPlanPrompt,
      has_successful_write: analysis.hasPlanWrite,
      blocked: false,
    });
    process.exit(0);
    return;
  }

  const attempts = state.attempts[stateKey] || 0;
  if (attempts >= MAX_BLOCK_ATTEMPTS_PER_PROMPT) {
    await logGuardEvent("allow_max_attempts_reached", {
      sessionId,
      promptUuid: analysis.promptUuid,
      attempts,
      stopHookActive: Boolean(event.stop_hook_active),
      plan_prompt_detected: analysis.isPlanPrompt,
      has_successful_write: analysis.hasPlanWrite,
      blocked: false,
    });
    process.exit(0);
    return;
  }

  state.attempts[stateKey] = attempts + 1;
  await saveGuardState(state);

  await logGuardEvent("block_missing_plan_write", {
    sessionId,
    promptUuid: analysis.promptUuid,
    attempts: attempts + 1,
    stopHookActive: Boolean(event.stop_hook_active),
    plan_prompt_detected: analysis.isPlanPrompt,
    has_successful_write: analysis.hasPlanWrite,
    blocked: true,
  });

  console.log(
    JSON.stringify({
      decision: "block",
      reason: analysis.reason,
    })
  );
  process.exit(0);
}

if (import.meta.main) {
  await runPlanStopGuard();
}
