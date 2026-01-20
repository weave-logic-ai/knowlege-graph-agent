import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { validateProjectRoot } from "../../core/security.js";
import "../../claude/types.js";
import { generateHookConfig, processHookEvent, HookCaptureSystem } from "../../claude/hook-capture.js";
const KG_HOOK_MARKER = "@weavelogic/knowledge-graph-agent";
function getClaudeSettingsPath(scope) {
  if (scope === "user") {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    return join(home, ".claude", "settings.json");
  }
  return join(process.cwd(), ".claude", "settings.json");
}
function loadSettings(path) {
  if (!existsSync(path)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}
function saveSettings(path, settings) {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(settings, null, 2));
}
function isKgHook(entry) {
  if (entry.command?.includes(KG_HOOK_MARKER)) {
    return true;
  }
  if (entry.hooks?.some((h) => h.command?.includes(KG_HOOK_MARKER))) {
    return true;
  }
  return false;
}
function removeKgHooksFromArray(entries) {
  return entries.filter((entry) => !isKgHook(entry));
}
function mergeHooksConfig(existingHooks, kgHooks) {
  const merged = {
    UserPromptSubmit: [],
    PreToolUse: [],
    PostToolUse: [],
    Stop: [],
    PreCompact: []
  };
  if (existingHooks) {
    for (const [event, entries] of Object.entries(existingHooks)) {
      if (Array.isArray(entries)) {
        merged[event] = removeKgHooksFromArray(entries);
      }
    }
  }
  for (const [event, entries] of Object.entries(kgHooks)) {
    if (Array.isArray(entries)) {
      merged[event] = [
        ...merged[event],
        ...entries
      ];
    }
  }
  for (const event of Object.keys(merged)) {
    if (merged[event].length === 0) {
      delete merged[event];
    }
  }
  return merged;
}
function removeKgHooksOnly(existingHooks) {
  if (!existingHooks) return null;
  const cleaned = {};
  let hasRemainingHooks = false;
  for (const [event, entries] of Object.entries(existingHooks)) {
    if (Array.isArray(entries)) {
      const remaining = removeKgHooksFromArray(entries);
      if (remaining.length > 0) {
        cleaned[event] = remaining;
        hasRemainingHooks = true;
      }
    }
  }
  return hasRemainingHooks ? cleaned : null;
}
function hasKgHooks(hooks) {
  if (!hooks) return false;
  for (const entries of Object.values(hooks)) {
    if (Array.isArray(entries) && entries.some(isKgHook)) {
      return true;
    }
  }
  return false;
}
function createHooksCommand() {
  const command = new Command("hooks");
  command.description("Claude Code hooks for capturing interactions in the knowledge graph");
  command.command("install").description("Install Claude Code hooks to capture all interactions (merges with existing hooks)").option("-p, --path <path>", "Project root path", ".").option("-s, --scope <scope>", "Installation scope: project or user", "project").option("-f, --force", "Reinstall even if KG hooks already present").option("--replace", "Replace all hooks instead of merging (not recommended)").option("--no-markdown", "Disable markdown document generation").option("--no-tool-outputs", "Disable separate tool output storage").action(async (options) => {
    const spinner = ora("Installing Claude Code hooks...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const settingsPath = getClaudeSettingsPath(options.scope);
      const settings = loadSettings(settingsPath);
      const existingHooks = settings.hooks;
      if (hasKgHooks(existingHooks) && !options.force) {
        spinner.info("KG capture hooks already installed.");
        console.log();
        console.log(chalk.gray("  Use --force to reinstall."));
        console.log(chalk.gray("  Settings:"), chalk.white(settingsPath));
        return;
      }
      const kgHookConfig = generateHookConfig(projectRoot);
      const kgHooks = kgHookConfig.hooks;
      let mergedHooks;
      if (options.replace) {
        mergedHooks = kgHooks;
        spinner.text = "Replacing all hooks with KG capture hooks...";
      } else {
        mergedHooks = mergeHooksConfig(existingHooks, kgHooks);
        if (existingHooks && Object.keys(existingHooks).length > 0) {
          spinner.text = "Merging KG capture hooks with existing hooks...";
        }
      }
      const newSettings = {
        ...settings,
        hooks: mergedHooks
      };
      saveSettings(settingsPath, newSettings);
      const storageDir = join(projectRoot, ".kg", "claude");
      if (!existsSync(storageDir)) {
        mkdirSync(storageDir, { recursive: true });
      }
      spinner.succeed("Claude Code hooks installed!");
      console.log();
      console.log(chalk.cyan("  Hook Configuration"));
      console.log(chalk.gray("  Settings file:"), chalk.white(settingsPath));
      console.log(chalk.gray("  Storage dir:"), chalk.white(storageDir));
      console.log();
      if (!options.replace && existingHooks && Object.keys(existingHooks).length > 0) {
        const preservedCount = Object.values(existingHooks).flat().filter((e) => !isKgHook(e)).length;
        if (preservedCount > 0) {
          console.log(chalk.cyan("  Compatibility:"));
          console.log(chalk.gray(`  - Preserved ${preservedCount} existing hook(s) (e.g., claude-flow)`));
          console.log();
        }
      }
      console.log(chalk.cyan("  KG Hooks Added:"));
      console.log(chalk.gray("  - UserPromptSubmit: Captures all user prompts"));
      console.log(chalk.gray("  - PreToolUse: Captures tool invocations"));
      console.log(chalk.gray("  - PostToolUse: Captures tool results"));
      console.log(chalk.gray("  - Stop: Finalizes session on completion"));
      console.log();
      console.log(chalk.green("  All Claude interactions will now be stored in the knowledge graph."));
      console.log();
    } catch (error) {
      spinner.fail("Failed to install hooks");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  command.command("uninstall").description("Remove KG capture hooks (preserves other hooks like claude-flow)").option("-s, --scope <scope>", "Installation scope: project or user", "project").option("--all", "Remove ALL hooks, not just KG hooks (use with caution)").action(async (options) => {
    const spinner = ora("Removing KG capture hooks...").start();
    try {
      const settingsPath = getClaudeSettingsPath(options.scope);
      const settings = loadSettings(settingsPath);
      const existingHooks = settings.hooks;
      if (!existingHooks) {
        spinner.info("No hooks configured.");
        return;
      }
      if (options.all) {
        delete settings.hooks;
        saveSettings(settingsPath, settings);
        spinner.succeed("All hooks removed.");
        return;
      }
      if (!hasKgHooks(existingHooks)) {
        spinner.info("No KG capture hooks found.");
        console.log();
        console.log(chalk.gray("  Other hooks are still configured."));
        console.log(chalk.gray("  Use --all to remove all hooks."));
        return;
      }
      const remainingHooks = removeKgHooksOnly(existingHooks);
      if (remainingHooks) {
        settings.hooks = remainingHooks;
        saveSettings(settingsPath, settings);
        const preservedCount = Object.values(remainingHooks).flat().length;
        spinner.succeed("KG capture hooks removed.");
        console.log();
        console.log(chalk.gray(`  Preserved ${preservedCount} other hook(s) (e.g., claude-flow).`));
        console.log(chalk.gray("  Use --all to remove all hooks."));
      } else {
        delete settings.hooks;
        saveSettings(settingsPath, settings);
        spinner.succeed("KG capture hooks removed (no other hooks remaining).");
      }
    } catch (error) {
      spinner.fail("Failed to remove hooks");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  command.command("capture").description("Capture a hook event (internal use)").option("-e, --event <type>", "Event type", "UserPromptSubmit").option("-p, --path <path>", "Project root path", ".").action(async (options) => {
    try {
      const projectRoot = validateProjectRoot(options.path);
      const eventType = options.event;
      await processHookEvent(projectRoot, eventType);
    } catch (error) {
      console.error(`Hook capture error: ${error}`);
    }
  });
  command.command("status").description("Show hooks status and recent captures").option("-p, --path <path>", "Project root path", ".").option("-s, --scope <scope>", "Check scope: project or user", "project").action(async (options) => {
    try {
      const projectRoot = validateProjectRoot(options.path);
      const settingsPath = getClaudeSettingsPath(options.scope);
      const settings = loadSettings(settingsPath);
      const existingHooks = settings.hooks;
      console.log();
      console.log(chalk.cyan("  Claude Code Hooks Status"));
      console.log();
      if (existingHooks) {
        const kgInstalled = hasKgHooks(existingHooks);
        const totalHooks = Object.values(existingHooks).flat().length;
        const kgHookCount = Object.values(existingHooks).flat().filter((e) => isKgHook(e)).length;
        const otherHookCount = totalHooks - kgHookCount;
        console.log(chalk.green("  ✓ Hooks configured"));
        console.log(chalk.gray("    Settings:"), chalk.white(settingsPath));
        console.log();
        if (kgInstalled) {
          console.log(chalk.green("  ✓ KG capture hooks installed"));
          console.log(chalk.gray(`    KG hooks: ${kgHookCount} active`));
        } else {
          console.log(chalk.yellow("  ✗ KG capture hooks not installed"));
          console.log(chalk.gray("    Run:"), chalk.white("kg hooks install"));
        }
        if (otherHookCount > 0) {
          console.log(chalk.green(`  ✓ Other hooks present (${otherHookCount})`));
          console.log(chalk.gray("    (e.g., claude-flow, custom hooks)"));
        }
        console.log();
        console.log(chalk.gray("    All configured events:"));
        for (const [event, handlers] of Object.entries(existingHooks)) {
          const arr = handlers;
          const kgCount = arr.filter(isKgHook).length;
          const otherCount = arr.length - kgCount;
          let info = "";
          if (kgCount > 0 && otherCount > 0) {
            info = `(${kgCount} KG, ${otherCount} other)`;
          } else if (kgCount > 0) {
            info = "(KG)";
          } else {
            info = "(other)";
          }
          console.log(chalk.gray(`      - ${event}:`), chalk.white(`${arr.length} handler(s) ${info}`));
        }
      } else {
        console.log(chalk.yellow("  ✗ No hooks configured"));
        console.log(chalk.gray("    Run:"), chalk.white("kg hooks install"));
      }
      console.log();
      const storageDir = join(projectRoot, ".kg", "claude");
      if (existsSync(storageDir)) {
        console.log(chalk.green("  ✓ Storage directory exists"));
        console.log(chalk.gray("    Path:"), chalk.white(storageDir));
        const capture = new HookCaptureSystem(projectRoot);
        const sessions = capture.listSessions();
        if (sessions.length > 0) {
          console.log(chalk.gray("    Sessions:"), chalk.white(`${sessions.length} stored`));
          const recent = sessions.slice(-3);
          for (const sessionId of recent) {
            const session = capture.loadSession(sessionId);
            if (session) {
              console.log(
                chalk.gray(`      - ${sessionId}:`),
                chalk.white(session.name),
                chalk.gray(`(${session.status})`)
              );
            }
          }
        } else {
          console.log(chalk.gray("    Sessions:"), chalk.white("None yet"));
        }
      } else {
        console.log(chalk.yellow("  ✗ Storage directory not found"));
        console.log(chalk.gray("    Will be created on first capture"));
      }
      console.log();
    } catch (error) {
      console.error(chalk.red("Failed to get status:"), String(error));
      process.exit(1);
    }
  });
  command.command("sessions").description("List captured sessions").option("-p, --path <path>", "Project root path", ".").option("-l, --limit <number>", "Limit number of sessions", "10").option("--json", "Output as JSON").action(async (options) => {
    try {
      const projectRoot = validateProjectRoot(options.path);
      const limit = parseInt(options.limit, 10);
      const capture = new HookCaptureSystem(projectRoot);
      const sessions = capture.listSessions();
      if (options.json) {
        const sessionData = sessions.slice(-limit).map((id) => capture.loadSession(id));
        console.log(JSON.stringify(sessionData, null, 2));
        return;
      }
      console.log();
      console.log(chalk.cyan("  Captured Sessions"));
      console.log();
      if (sessions.length === 0) {
        console.log(chalk.gray("  No sessions captured yet."));
        console.log();
        return;
      }
      const recentSessions = sessions.slice(-limit);
      for (const sessionId of recentSessions) {
        const session = capture.loadSession(sessionId);
        if (session) {
          const statusColor = session.status === "completed" ? chalk.green : chalk.yellow;
          console.log(
            chalk.white(`  ${session.id}`),
            chalk.gray("|"),
            chalk.cyan(session.name)
          );
          console.log(
            chalk.gray("    Status:"),
            statusColor(session.status),
            chalk.gray("|"),
            chalk.gray("Conversations:"),
            chalk.white(String(session.conversationIds.length)),
            chalk.gray("|"),
            chalk.gray("Tokens:"),
            chalk.white(String(session.tokenUsage.totalTokens))
          );
          console.log(
            chalk.gray("    Started:"),
            chalk.white(new Date(session.startedAt).toLocaleString())
          );
          console.log();
        }
      }
      if (sessions.length > limit) {
        console.log(chalk.gray(`  ... and ${sessions.length - limit} more sessions`));
        console.log();
      }
    } catch (error) {
      console.error(chalk.red("Failed to list sessions:"), String(error));
      process.exit(1);
    }
  });
  command.command("export").description("Export captured sessions").option("-p, --path <path>", "Project root path", ".").option("-o, --output <file>", "Output file path").option("-f, --format <format>", "Output format: json or markdown", "json").option("--session <id>", "Export specific session").action(async (options) => {
    const spinner = ora("Exporting sessions...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const capture = new HookCaptureSystem(projectRoot);
      let sessionsToExport;
      if (options.session) {
        sessionsToExport = [options.session];
      } else {
        sessionsToExport = capture.listSessions();
      }
      if (sessionsToExport.length === 0) {
        spinner.info("No sessions to export.");
        return;
      }
      const exportData = sessionsToExport.map((id) => capture.loadSession(id)).filter(Boolean);
      if (options.format === "json") {
        const output = JSON.stringify(exportData, null, 2);
        if (options.output) {
          writeFileSync(options.output, output);
          spinner.succeed(`Exported ${exportData.length} session(s) to ${options.output}`);
        } else {
          spinner.stop();
          console.log(output);
        }
      } else if (options.format === "markdown") {
        let markdown = "# Claude Interaction Sessions\n\n";
        for (const session of exportData) {
          if (!session) continue;
          markdown += `## ${session.name}

`;
          markdown += `- **ID:** ${session.id}
`;
          markdown += `- **Status:** ${session.status}
`;
          markdown += `- **Purpose:** ${session.purpose || "N/A"}
`;
          markdown += `- **Started:** ${new Date(session.startedAt).toISOString()}
`;
          if (session.endedAt) {
            markdown += `- **Ended:** ${new Date(session.endedAt).toISOString()}
`;
          }
          markdown += `- **Conversations:** ${session.conversationIds.length}
`;
          markdown += `- **Tokens:** ${session.tokenUsage.totalTokens}

`;
        }
        if (options.output) {
          writeFileSync(options.output, markdown);
          spinner.succeed(`Exported ${exportData.length} session(s) to ${options.output}`);
        } else {
          spinner.stop();
          console.log(markdown);
        }
      }
    } catch (error) {
      spinner.fail("Failed to export sessions");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  return command;
}
export {
  createHooksCommand
};
//# sourceMappingURL=hooks.js.map
