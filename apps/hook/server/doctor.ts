import { spawnSync } from "node:child_process";
import { access, readdir, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface DoctorRunOptions {
  version: string;
  usage: string;
}

interface DoctorCheck {
  name: string;
  ok: boolean;
  details: string;
  fix?: string;
}

interface DoctorReport {
  ok: boolean;
  timestamp: string;
  version: string;
  cwd: string;
  checks: DoctorCheck[];
}

function runCommand(command: string, args: string[]): {
  ok: boolean;
  output: string;
  status: number | null;
} {
  const result = spawnSync(command, args, {
    encoding: "utf-8",
    shell: process.platform === "win32",
    timeout: 5_000,
  });

  if (result.error) {
    return {
      ok: false,
      output: result.error.message,
      status: result.status ?? null,
    };
  }

  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  const ok = result.status === 0 && output.length > 0;
  return {
    ok,
    output,
    status: result.status ?? null,
  };
}

function hasHookCommand(commands: string[], pattern: RegExp): boolean {
  return commands.some((command) => pattern.test(command));
}

function hasPlanFallbackCommand(commands: string[]): boolean {
  return commands.some((command) => /(?:^|\s)plan(?:\s|$)/.test(command));
}

function extractHookCommands(settings: unknown): string[] {
  if (!settings || typeof settings !== "object") return [];
  const typedSettings = settings as {
    hooks?: Record<string, Array<{ hooks?: Array<{ command?: string }> }>>;
  };
  const hooks = typedSettings.hooks;
  if (!hooks || typeof hooks !== "object") return [];

  const commands: string[] = [];
  for (const entries of Object.values(hooks)) {
    if (!Array.isArray(entries)) continue;
    for (const matcherEntry of entries) {
      if (!matcherEntry || typeof matcherEntry !== "object") continue;
      const matcherHooks = matcherEntry.hooks;
      if (!Array.isArray(matcherHooks)) continue;
      for (const hook of matcherHooks) {
        if (hook && typeof hook.command === "string" && hook.command.trim()) {
          commands.push(hook.command.trim());
        }
      }
    }
  }

  return commands;
}

async function collectHookFiles(hooksDir: string): Promise<string[]> {
  const entries = await readdir(hooksDir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isFile()) {
      files.push(join(hooksDir, entry.name));
    }
  }
  return files;
}

async function checkBinaryVersion(version: string): Promise<DoctorCheck> {
  const result = runCommand("obsreview", ["--version"]);
  if (!result.ok) {
    const emptyButZero = result.status === 0 && !result.output;
    return {
      name: "obsreview no PATH",
      ok: false,
      details: emptyButZero
        ? "obsreview --version retornou sem saida (binario invalido/desatualizado)."
        : result.output || "Command failed with no output.",
      fix: emptyButZero
        ? "Reinstale o binario oficial, reabra o terminal e rode obsreview --version novamente."
        : "Reinstale o binario e confira se ~/.local/bin (ou %USERPROFILE%\\.local\\bin) esta no PATH.",
    };
  }

  const normalized = result.output.replace(/\s+/g, " ").trim();
  const hasExpectedVersion = normalized.includes(version);
  return {
    name: "versao do binario",
    ok: hasExpectedVersion,
    details: hasExpectedVersion
      ? `obsreview --version -> ${normalized}`
      : `obsreview --version retornou '${normalized}', esperado conter '${version}'.`,
    fix: hasExpectedVersion
      ? undefined
      : "Atualize o binario para a release mais recente.",
  };
}

async function checkClaudeHooks(settingsPath: string): Promise<DoctorCheck> {
  let rawSettings = "";
  try {
    rawSettings = await readFile(settingsPath, "utf-8");
  } catch (error) {
    return {
      name: "hooks no Claude Code",
      ok: false,
      details: `Nao foi possivel ler ${settingsPath}: ${error instanceof Error ? error.message : String(error)}`,
      fix: "Instale o plugin no chat do Claude Code com /plugin marketplace add e /plugin install.",
    };
  }

  let parsedSettings: unknown;
  try {
    parsedSettings = JSON.parse(rawSettings);
  } catch (error) {
    return {
      name: "hooks no Claude Code",
      ok: false,
      details: `settings.json invalido: ${error instanceof Error ? error.message : String(error)}`,
      fix: "Corrija o JSON de ~/.claude/settings.json e reinstale o plugin.",
    };
  }

  const commands = extractHookCommands(parsedSettings);
  const hasPlanLive = hasHookCommand(commands, /\bplan-live\b/);
  const hasObsidian = hasHookCommand(commands, /\bobsidian\b/);
  const hasPlanFallback = hasPlanFallbackCommand(commands);

  const missing: string[] = [];
  if (!hasPlanLive) missing.push("obsreview plan-live");
  if (!hasObsidian) missing.push("obsreview obsidian");
  if (!hasPlanFallback) missing.push("obsreview plan (fallback)");

  if (missing.length > 0) {
    return {
      name: "hooks no Claude Code",
      ok: false,
      details: `Comandos ausentes em ~/.claude/settings.json: ${missing.join(", ")}`,
      fix: "Reinstale o plugin e reinicie o Claude Code.",
    };
  }

  return {
    name: "hooks no Claude Code",
    ok: true,
    details: "Hooks principais encontrados (plan-live, obsidian, plan fallback).",
  };
}

async function checkLegacyHardcodedPaths(hooksDir: string): Promise<DoctorCheck> {
  try {
    const metadata = await stat(hooksDir);
    if (!metadata.isDirectory()) {
      return {
        name: "hooks hardcoded legados",
        ok: true,
        details: "Diretorio ~/.claude/hooks nao existe como pasta. Nada legado detectado.",
      };
    }
  } catch {
    return {
      name: "hooks hardcoded legados",
      ok: true,
      details: "Diretorio ~/.claude/hooks nao encontrado. Nada legado detectado.",
    };
  }

  const files = await collectHookFiles(hooksDir);
  const offenders: string[] = [];

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, "utf-8");
      if (
        content.includes("C:/dev/tools/obsidian-note-reviewer") ||
        content.includes("C:\\dev\\tools\\obsidian-note-reviewer")
      ) {
        offenders.push(filePath);
      }
    } catch {
      // ignore unreadable files
    }
  }

  if (offenders.length > 0) {
    return {
      name: "hooks hardcoded legados",
      ok: false,
      details: `Arquivos com caminho hardcoded antigo: ${offenders.join(", ")}`,
      fix: "Remova os hooks legados e mantenha apenas os hooks instalados pelo plugin atual.",
    };
  }

  return {
    name: "hooks hardcoded legados",
    ok: true,
    details: "Nenhum caminho hardcoded C:/dev/tools encontrado nos hooks locais.",
  };
}

async function checkWritableWorkspace(cwd: string): Promise<DoctorCheck> {
  try {
    await access(cwd, constants.W_OK);
  } catch (error) {
    return {
      name: "workspace com escrita",
      ok: false,
      details: `Sem permissao de escrita em ${cwd}: ${error instanceof Error ? error.message : String(error)}`,
      fix: "Abra o Claude Code em uma pasta de projeto com permissao de escrita.",
    };
  }

  const normalized = cwd.replace(/\\/g, "/").toLowerCase();
  if (normalized.includes("/windows/system32")) {
    return {
      name: "workspace com escrita",
      ok: false,
      details: `Pasta atual parece ser de sistema (${cwd}).`,
      fix: "Abra uma pasta de projeto comum e rode o teste novamente.",
    };
  }

  return {
    name: "workspace com escrita",
    ok: true,
    details: `Permissao de escrita detectada em ${cwd}.`,
  };
}

export async function runDoctorCommand(
  args: string[],
  options: DoctorRunOptions
): Promise<number> {
  const allowedFlags = new Set(["--json"]);
  const unknownFlags = args.filter((arg) => arg.startsWith("-") && !allowedFlags.has(arg));
  if (unknownFlags.length > 0) {
    console.error(`Flags nao suportadas: ${unknownFlags.join(", ")}`);
    console.error(options.usage);
    return 1;
  }

  const jsonOutput = args.includes("--json");
  const cwd = process.cwd();
  const claudeDir = join(homedir(), ".claude");
  const settingsPath = join(claudeDir, "settings.json");
  const hooksDir = join(claudeDir, "hooks");

  const checks = await Promise.all([
    checkBinaryVersion(options.version),
    checkClaudeHooks(settingsPath),
    checkLegacyHardcodedPaths(hooksDir),
    checkWritableWorkspace(cwd),
  ]);

  const ok = checks.every((check) => check.ok);
  const report: DoctorReport = {
    ok,
    timestamp: new Date().toISOString(),
    version: options.version,
    cwd,
    checks,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return ok ? 0 : 1;
  }

  console.log(`obsreview doctor (${options.version})`);
  console.log(`cwd: ${cwd}`);
  console.log("");

  for (const check of checks) {
    const prefix = check.ok ? "[OK]" : "[FAIL]";
    console.log(`${prefix} ${check.name}`);
    console.log(`  ${check.details}`);
    if (check.fix) {
      console.log(`  fix: ${check.fix}`);
    }
  }

  console.log("");
  console.log(ok ? "Status geral: OK" : "Status geral: FALHA");
  return ok ? 0 : 1;
}
