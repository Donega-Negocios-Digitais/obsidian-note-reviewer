function normalizePath(input: string): string {
  return input.replace(/\\/g, "/").toLowerCase();
}

function splitSegments(input: string): string[] {
  return normalizePath(input)
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function hasSegmentSequence(pathSegments: string[], sequence: string[]): boolean {
  if (sequence.length === 0 || pathSegments.length < sequence.length) {
    return false;
  }

  for (let i = 0; i <= pathSegments.length - sequence.length; i += 1) {
    let matches = true;
    for (let j = 0; j < sequence.length; j += 1) {
      if (pathSegments[i + j] !== sequence[j]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }

  return false;
}

export function normalizePathForMatch(input: string): string {
  return normalizePath(input);
}

export function isClaudeInternalPlanPath(filePath: string): boolean {
  const segments = splitSegments(filePath);
  return hasSegmentSequence(segments, [".claude", "plans"]);
}

export function isObsidianPlanPath(filePath: string, planDirs: string[]): boolean {
  if (!filePath.trim()) {
    return false;
  }

  if (isClaudeInternalPlanPath(filePath)) {
    return false;
  }

  const fileSegments = splitSegments(filePath);

  for (const dir of planDirs) {
    const dirSegments = splitSegments(dir);
    if (hasSegmentSequence(fileSegments, dirSegments)) {
      return true;
    }
  }

  return false;
}
