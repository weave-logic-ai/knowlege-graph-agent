import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { join } from "path";
import { writeFile } from "fs/promises";
import { createAuditChainConfig } from "../../audit/config.js";
import { createAuditChain } from "../../audit/services/audit-chain.js";
import { createSyndicationService } from "../../audit/services/syndication.js";
import { validateProjectRoot } from "../../core/security.js";
function formatDate(date) {
  if (!date) return "N/A";
  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}
function formatHLC(hlc) {
  const date = new Date(hlc.physicalMs);
  return `${formatDate(date)} (L:${hlc.logical})`;
}
function formatDuration(ms) {
  if (ms < 1e3) return `${ms}ms`;
  if (ms < 6e4) return `${(ms / 1e3).toFixed(1)}s`;
  return `${(ms / 6e4).toFixed(1)}m`;
}
function printEventsTable(events) {
  if (events.length === 0) {
    console.log(chalk.gray("  No events found"));
    return;
  }
  console.log(
    chalk.gray(
      "  " + "ID".padEnd(16) + "Type".padEnd(24) + "Author".padEnd(20) + "Timestamp"
    )
  );
  console.log(chalk.gray("  " + "-".repeat(80)));
  for (const event of events) {
    const id = event.id.substring(0, 14) + "..";
    const type = event.envelope.payload.type;
    const author = event.envelope.author.substring(0, 18);
    const timestamp = formatHLC(event.envelope.hlc);
    const typeColor = type.includes("Created") ? chalk.green : type.includes("Deleted") ? chalk.red : type.includes("Updated") ? chalk.yellow : type.includes("Completed") ? chalk.cyan : type.includes("Started") ? chalk.blue : chalk.white;
    console.log(
      "  " + chalk.gray(id.padEnd(16)) + typeColor(type.padEnd(24)) + chalk.gray(author.padEnd(20)) + chalk.gray(timestamp)
    );
  }
}
function printChainStats(stats) {
  const statusColor = stats.status === "healthy" ? chalk.green : stats.status === "syncing" ? chalk.yellow : chalk.red;
  console.log(chalk.white("  Overview"));
  console.log(chalk.gray(`    Status:           `) + statusColor(stats.status));
  console.log(chalk.gray(`    Total events:     ${stats.totalEvents}`));
  console.log(chalk.gray(`    Checkpoint height: ${stats.checkpointHeight}`));
  console.log(chalk.gray(`    Unique authors:   ${stats.uniqueAuthors}`));
  if (stats.lastEventTime) {
    console.log(chalk.gray(`    Last event:       ${formatDate(stats.lastEventTime)}`));
  }
  if (Object.keys(stats.eventsByType).length > 0) {
    console.log();
    console.log(chalk.white("  Events by Type"));
    const sortedTypes = Object.entries(stats.eventsByType).sort((a, b) => b[1] - a[1]);
    for (const [type, count] of sortedTypes) {
      const bar = "|".repeat(Math.min(Math.ceil(count / 5), 30));
      console.log(
        chalk.gray(`    ${type.padEnd(24)} ${String(count).padStart(5)} `) + chalk.blue(bar)
      );
    }
  }
}
function printCheckpoint(checkpoint) {
  if (!checkpoint) {
    console.log(chalk.gray("  No checkpoints created yet"));
    return;
  }
  console.log(chalk.white("  Latest Checkpoint"));
  console.log(chalk.gray(`    Height:     ${checkpoint.height}`));
  console.log(chalk.gray(`    Event root: ${checkpoint.eventRoot.substring(0, 32)}...`));
  console.log(chalk.gray(`    State root: ${checkpoint.stateRoot.substring(0, 32)}...`));
  console.log(chalk.gray(`    Timestamp:  ${formatDate(checkpoint.timestamp)}`));
  console.log(chalk.gray(`    Signatures: ${checkpoint.validatorSignatures.length}`));
}
function printPeersTable(peers) {
  if (peers.length === 0) {
    console.log(chalk.gray("  No peers configured"));
    return;
  }
  console.log(
    chalk.gray(
      "  " + "ID".padEnd(16) + "Status".padEnd(14) + "Last Sync".padEnd(22) + "Events (Rx/Tx)"
    )
  );
  console.log(chalk.gray("  " + "-".repeat(70)));
  for (const peer of peers) {
    const statusColor = peer.status === "connected" ? chalk.green : peer.status === "syncing" ? chalk.yellow : peer.status === "error" ? chalk.red : chalk.gray;
    const lastSync = peer.lastSyncTime ? formatDate(peer.lastSyncTime) : "Never";
    const events = `${peer.eventsReceived}/${peer.eventsSent}`;
    console.log(
      "  " + chalk.gray(peer.id.padEnd(16)) + statusColor(peer.status.padEnd(14)) + chalk.gray(lastSync.padEnd(22)) + chalk.gray(events)
    );
    if (peer.lastError) {
      console.log(chalk.red(`     Error: ${peer.lastError}`));
    }
  }
}
function printSyncResults(results) {
  if (results.length === 0) {
    console.log(chalk.gray("  No sync operations performed"));
    return;
  }
  console.log(
    chalk.gray(
      "  " + "Peer".padEnd(16) + "Status".padEnd(10) + "Received".padEnd(10) + "Sent".padEnd(10) + "Duration"
    )
  );
  console.log(chalk.gray("  " + "-".repeat(60)));
  for (const result of results) {
    const statusColor = result.success ? chalk.green : chalk.red;
    const status = result.success ? "OK" : "FAIL";
    console.log(
      "  " + chalk.gray(result.peerId.substring(0, 14).padEnd(16)) + statusColor(status.padEnd(10)) + chalk.gray(String(result.eventsReceived).padEnd(10)) + chalk.gray(String(result.eventsSent).padEnd(10)) + chalk.gray(formatDuration(result.duration))
    );
    if (result.error) {
      console.log(chalk.red(`     Error: ${result.error}`));
    }
  }
}
function parseDateToHLC(dateStr) {
  if (!dateStr) return void 0;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return {
    physicalMs: date.getTime(),
    logical: 0
  };
}
function createAuditCommand() {
  const audit = new Command("audit").description("Query and manage the exochain audit log");
  audit.command("query").description("Query the audit log").option("-t, --type <type>", "Filter by event type (e.g., NodeCreated, WorkflowCompleted)").option("-s, --start <date>", "Start date (ISO format, e.g., 2024-01-01)").option("-e, --end <date>", "End date (ISO format)").option("-l, --limit <n>", "Maximum results to return", "50").option("-a, --author <did>", "Filter by author DID").option("--json", "Output as JSON").option("-p, --path <path>", "Project root path", ".").action(async (options) => {
    const spinner = ora("Querying audit log...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const auditChain = createAuditChain(createAuditChainConfig());
      const queryOptions = {
        limit: parseInt(options.limit, 10) || 50,
        includeProof: false
      };
      if (options.type) {
        queryOptions.type = options.type;
      }
      if (options.author) {
        queryOptions.author = options.author;
      }
      if (options.start) {
        queryOptions.since = parseDateToHLC(options.start);
      }
      if (options.end) {
        queryOptions.until = parseDateToHLC(options.end);
      }
      const result = await auditChain.queryEvents(queryOptions);
      spinner.stop();
      if (options.json) {
        console.log(JSON.stringify({
          events: result.events.map((e) => ({
            id: e.id,
            type: e.envelope.payload.type,
            author: e.envelope.author,
            timestamp: e.envelope.hlc.physicalMs,
            parents: e.envelope.parents,
            payload: e.envelope.payload
          })),
          totalCount: result.totalCount,
          hasMore: result.hasMore
        }, null, 2));
        return;
      }
      console.log(chalk.cyan("\n  Audit Log Query Results\n"));
      console.log(chalk.gray(`  Found ${result.totalCount} events (showing ${result.events.length})`));
      if (result.hasMore) {
        console.log(chalk.gray("  (more results available, increase --limit to see more)"));
      }
      console.log();
      printEventsTable(result.events);
      console.log();
      const stats = auditChain.getStats();
      console.log(chalk.gray(`  Chain status: `) + chalk.green(stats.status));
      console.log();
    } catch (error) {
      spinner.fail("Query failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  audit.command("checkpoint").description("Create a checkpoint in the audit chain").option("-n, --name <name>", "Checkpoint name/label").option("-t, --tags <tags>", "Comma-separated tags").option("--json", "Output as JSON").option("-p, --path <path>", "Project root path", ".").action(async (options) => {
    const spinner = ora("Creating checkpoint...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const auditChain = createAuditChain(createAuditChainConfig());
      const checkpoint = await auditChain.createCheckpoint();
      spinner.succeed("Checkpoint created!");
      if (options.json) {
        console.log(JSON.stringify({
          height: checkpoint.height,
          eventRoot: checkpoint.eventRoot,
          stateRoot: checkpoint.stateRoot,
          timestamp: checkpoint.timestamp.toISOString(),
          signatures: checkpoint.validatorSignatures.length,
          name: options.name,
          tags: options.tags?.split(",").map((t) => t.trim())
        }, null, 2));
        return;
      }
      console.log(chalk.cyan("\n  Checkpoint Details\n"));
      if (options.name) {
        console.log(chalk.white(`  Name: ${options.name}`));
      }
      if (options.tags) {
        const tags = options.tags.split(",").map((t) => t.trim());
        console.log(chalk.white(`  Tags: ${tags.join(", ")}`));
      }
      console.log();
      printCheckpoint(checkpoint);
      console.log();
    } catch (error) {
      spinner.fail("Checkpoint creation failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  audit.command("verify").description("Verify audit chain integrity").option("--full", "Perform full chain verification (slower)").option("--json", "Output as JSON").option("-p, --path <path>", "Project root path", ".").action(async (options) => {
    const spinner = ora("Verifying audit chain integrity...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const auditChain = createAuditChain(createAuditChainConfig());
      const startTime = Date.now();
      const stats = auditChain.getStats();
      const checkpoint = auditChain.getLatestCheckpoint();
      const issues = [];
      const warnings = [];
      if (stats.status === "degraded") {
        issues.push("Chain status is degraded");
      }
      if (stats.checkpointHeight > 0 && !checkpoint) {
        issues.push("Checkpoint height > 0 but no checkpoint found");
      }
      const chainData = auditChain.export();
      let genesisCount = 0;
      for (const event of chainData.events) {
        if (event.envelope.parents.length === 0) {
          genesisCount++;
        }
      }
      if (genesisCount > 1) {
        warnings.push(`Multiple genesis events found: ${genesisCount}`);
      }
      const tips = auditChain.getTips();
      if (tips.length === 0 && chainData.events.length > 0) {
        issues.push("No chain tips but events exist");
      }
      if (options.full) {
        spinner.text = "Performing full chain verification...";
        for (const event of chainData.events) {
          for (const parentId of event.envelope.parents) {
            const parent = chainData.events.find((e) => e.id === parentId);
            if (!parent) {
              issues.push(`Event ${event.id.substring(0, 12)}.. references missing parent ${parentId.substring(0, 12)}..`);
            }
          }
        }
      }
      const duration = Date.now() - startTime;
      const valid = issues.length === 0;
      spinner.stop();
      if (options.json) {
        console.log(JSON.stringify({
          valid,
          issues,
          warnings,
          stats: {
            totalEvents: stats.totalEvents,
            checkpointHeight: stats.checkpointHeight,
            status: stats.status,
            tips: tips.length
          },
          duration
        }, null, 2));
        return;
      }
      console.log(chalk.cyan("\n  Audit Chain Verification\n"));
      if (valid) {
        console.log(chalk.green("  Status: VALID"));
      } else {
        console.log(chalk.red("  Status: INVALID"));
      }
      console.log();
      console.log(chalk.white("  Statistics"));
      console.log(chalk.gray(`    Events verified:    ${stats.totalEvents}`));
      console.log(chalk.gray(`    Checkpoint height:  ${stats.checkpointHeight}`));
      console.log(chalk.gray(`    Chain tips:         ${tips.length}`));
      console.log(chalk.gray(`    Verification time:  ${formatDuration(duration)}`));
      if (issues.length > 0) {
        console.log();
        console.log(chalk.red("  Issues Found"));
        for (const issue of issues) {
          console.log(chalk.red(`    - ${issue}`));
        }
      }
      if (warnings.length > 0) {
        console.log();
        console.log(chalk.yellow("  Warnings"));
        for (const warning of warnings) {
          console.log(chalk.yellow(`    - ${warning}`));
        }
      }
      console.log();
      if (!valid) {
        process.exit(1);
      }
    } catch (error) {
      spinner.fail("Verification failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  const sync = audit.command("sync").description("Manage audit chain synchronization");
  sync.command("status").description("Check synchronization status").option("--json", "Output as JSON").option("-p, --path <path>", "Project root path", ".").action(async (options) => {
    const spinner = ora("Checking sync status...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const auditChain = createAuditChain(createAuditChainConfig());
      const syndication = createSyndicationService({ auditChain });
      const stats = syndication.getStats();
      const chainStats = auditChain.getStats();
      spinner.stop();
      if (options.json) {
        console.log(JSON.stringify({
          service: {
            running: stats.isRunning,
            autoSyncEnabled: stats.autoSyncEnabled,
            syncInterval: stats.syncInterval
          },
          peers: {
            total: stats.totalPeers,
            connected: stats.connectedPeers,
            syncing: stats.syncingPeers,
            error: stats.errorPeers
          },
          transfer: {
            received: stats.totalEventsReceived,
            sent: stats.totalEventsSent,
            errors: stats.totalErrors
          },
          chain: {
            status: chainStats.status,
            events: chainStats.totalEvents,
            checkpointHeight: chainStats.checkpointHeight
          }
        }, null, 2));
        return;
      }
      console.log(chalk.cyan("\n  Sync Status\n"));
      console.log(chalk.white("  Service"));
      console.log(chalk.gray(`    Running:      `) + (stats.isRunning ? chalk.green("Yes") : chalk.gray("No")));
      console.log(chalk.gray(`    Auto-sync:    `) + (stats.autoSyncEnabled ? chalk.green("Enabled") : chalk.gray("Disabled")));
      if (stats.autoSyncEnabled) {
        console.log(chalk.gray(`    Interval:     ${formatDuration(stats.syncInterval)}`));
      }
      console.log();
      console.log(chalk.white("  Peers"));
      console.log(chalk.gray(`    Total:        ${stats.totalPeers}`));
      console.log(chalk.gray(`    Connected:    `) + chalk.green(String(stats.connectedPeers)));
      if (stats.syncingPeers > 0) {
        console.log(chalk.gray(`    Syncing:      `) + chalk.yellow(String(stats.syncingPeers)));
      }
      if (stats.errorPeers > 0) {
        console.log(chalk.gray(`    Errors:       `) + chalk.red(String(stats.errorPeers)));
      }
      console.log();
      console.log(chalk.white("  Transfer Statistics"));
      console.log(chalk.gray(`    Events received: ${stats.totalEventsReceived}`));
      console.log(chalk.gray(`    Events sent:     ${stats.totalEventsSent}`));
      if (stats.totalErrors > 0) {
        console.log(chalk.gray(`    Errors:          `) + chalk.red(String(stats.totalErrors)));
      }
      console.log();
      console.log(chalk.white("  Chain"));
      const chainStatusColor = chainStats.status === "healthy" ? chalk.green : chainStats.status === "syncing" ? chalk.yellow : chalk.red;
      console.log(chalk.gray(`    Status:       `) + chainStatusColor(chainStats.status));
      console.log(chalk.gray(`    Events:       ${chainStats.totalEvents}`));
      console.log(chalk.gray(`    Checkpoint:   ${chainStats.checkpointHeight}`));
      console.log();
    } catch (error) {
      spinner.fail("Status check failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  sync.command("peers").description("List sync peers").option("--json", "Output as JSON").option("-p, --path <path>", "Project root path", ".").action(async (options) => {
    const spinner = ora("Fetching peer list...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const auditChain = createAuditChain(createAuditChainConfig());
      const syndication = createSyndicationService({ auditChain });
      const peers = syndication.getAllPeers();
      spinner.stop();
      if (options.json) {
        console.log(JSON.stringify({
          peers: peers.map((p) => ({
            id: p.id,
            endpoint: p.endpoint,
            did: p.did,
            status: p.status,
            lastSync: p.lastSyncTime?.toISOString(),
            lastCheckpointHeight: p.lastCheckpointHeight,
            eventsReceived: p.eventsReceived,
            eventsSent: p.eventsSent,
            errors: p.errors,
            lastError: p.lastError,
            latency: p.latency
          })),
          summary: {
            total: peers.length,
            connected: peers.filter((p) => p.status === "connected").length,
            error: peers.filter((p) => p.status === "error").length
          }
        }, null, 2));
        return;
      }
      console.log(chalk.cyan("\n  Sync Peers\n"));
      printPeersTable(peers);
      const connected = peers.filter((p) => p.status === "connected").length;
      const errors = peers.filter((p) => p.status === "error").length;
      console.log();
      console.log(chalk.gray(`  Total: ${peers.length}, Connected: ${connected}, Errors: ${errors}`));
      console.log();
    } catch (error) {
      spinner.fail("Failed to fetch peers");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  sync.command("now").description("Force immediate synchronization with all peers").option("--json", "Output as JSON").option("-p, --path <path>", "Project root path", ".").action(async (options) => {
    const spinner = ora("Syncing with peers...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const auditChain = createAuditChain(createAuditChainConfig());
      const syndication = createSyndicationService({ auditChain });
      await syndication.start();
      const results = await syndication.forceSyncNow();
      await syndication.stop();
      spinner.stop();
      if (options.json) {
        console.log(JSON.stringify({
          results: results.map((r) => ({
            peerId: r.peerId,
            success: r.success,
            eventsReceived: r.eventsReceived,
            eventsSent: r.eventsSent,
            newCheckpointHeight: r.newCheckpointHeight,
            duration: r.duration,
            error: r.error
          })),
          summary: {
            total: results.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length
          }
        }, null, 2));
        return;
      }
      console.log(chalk.cyan("\n  Sync Results\n"));
      printSyncResults(results);
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      const totalReceived = results.reduce((sum, r) => sum + r.eventsReceived, 0);
      const totalSent = results.reduce((sum, r) => sum + r.eventsSent, 0);
      console.log();
      console.log(chalk.gray(`  Peers: ${results.length} (${successful} successful, ${failed} failed)`));
      console.log(chalk.gray(`  Events: ${totalReceived} received, ${totalSent} sent`));
      console.log();
      if (failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      spinner.fail("Sync failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  audit.command("export").description("Export audit log data").option("-o, --output <file>", "Output file path").option("-f, --format <format>", "Export format (json|jsonl)", "json").option("-t, --type <type>", "Filter by event type").option("-s, --start <date>", "Start date filter").option("-e, --end <date>", "End date filter").option("-l, --limit <n>", "Maximum events to export").option("-p, --path <path>", "Project root path", ".").action(async (options) => {
    const spinner = ora("Exporting audit log...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const auditChain = createAuditChain(createAuditChainConfig());
      const queryOptions = {
        includeProof: true
      };
      if (options.type) {
        queryOptions.type = options.type;
      }
      if (options.start) {
        queryOptions.since = parseDateToHLC(options.start);
      }
      if (options.end) {
        queryOptions.until = parseDateToHLC(options.end);
      }
      if (options.limit) {
        queryOptions.limit = parseInt(options.limit, 10);
      }
      const result = await auditChain.queryEvents(queryOptions);
      const chainData = auditChain.export();
      const checkpoint = auditChain.getLatestCheckpoint();
      const exportData = {
        metadata: {
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          chainStatus: auditChain.getStats().status,
          totalEvents: result.totalCount,
          exportedEvents: result.events.length,
          checkpointHeight: checkpoint?.height ?? 0,
          filters: {
            type: options.type,
            startDate: options.start,
            endDate: options.end,
            limit: options.limit
          }
        },
        checkpoint: checkpoint ? {
          height: checkpoint.height,
          eventRoot: checkpoint.eventRoot,
          stateRoot: checkpoint.stateRoot,
          timestamp: checkpoint.timestamp.toISOString(),
          signatures: checkpoint.validatorSignatures.length
        } : null,
        events: result.events.map((e) => ({
          id: e.id,
          type: e.envelope.payload.type,
          author: e.envelope.author,
          timestamp: new Date(e.envelope.hlc.physicalMs).toISOString(),
          hlc: e.envelope.hlc,
          parents: e.envelope.parents,
          payload: e.envelope.payload,
          signature: e.signature
        })),
        tips: chainData.tips
      };
      let output;
      if (options.format === "jsonl") {
        const lines = [
          JSON.stringify({ type: "metadata", data: exportData.metadata }),
          ...exportData.checkpoint ? [JSON.stringify({ type: "checkpoint", data: exportData.checkpoint })] : [],
          ...exportData.events.map((e) => JSON.stringify({ type: "event", data: e }))
        ];
        output = lines.join("\n");
      } else {
        output = JSON.stringify(exportData, null, 2);
      }
      spinner.stop();
      if (options.output) {
        const outputPath = join(projectRoot, options.output);
        await writeFile(outputPath, output, "utf-8");
        console.log(chalk.green(`
  Exported ${result.events.length} events to ${outputPath}
`));
      } else {
        console.log(output);
      }
    } catch (error) {
      spinner.fail("Export failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  audit.command("stats").description("Show audit chain statistics").option("--json", "Output as JSON").option("-p, --path <path>", "Project root path", ".").action(async (options) => {
    try {
      const projectRoot = validateProjectRoot(options.path);
      const auditChain = createAuditChain(createAuditChainConfig());
      const stats = auditChain.getStats();
      const checkpoint = auditChain.getLatestCheckpoint();
      const tips = auditChain.getTips();
      if (options.json) {
        console.log(JSON.stringify({
          stats,
          checkpoint: checkpoint ? {
            height: checkpoint.height,
            eventRoot: checkpoint.eventRoot,
            stateRoot: checkpoint.stateRoot,
            timestamp: checkpoint.timestamp.toISOString(),
            signatures: checkpoint.validatorSignatures.length
          } : null,
          tips: {
            count: tips.length,
            ids: tips
          }
        }, null, 2));
        return;
      }
      console.log(chalk.cyan("\n  Audit Chain Statistics\n"));
      printChainStats(stats);
      console.log();
      printCheckpoint(checkpoint);
      if (tips.length > 0) {
        console.log();
        console.log(chalk.white("  Chain Tips"));
        console.log(chalk.gray(`    Count: ${tips.length}`));
        for (const tip of tips.slice(0, 5)) {
          console.log(chalk.gray(`    - ${tip.substring(0, 32)}...`));
        }
        if (tips.length > 5) {
          console.log(chalk.gray(`    ... and ${tips.length - 5} more`));
        }
      }
      console.log();
    } catch (error) {
      console.error(chalk.red("Failed to get statistics:"), String(error));
      process.exit(1);
    }
  });
  return audit;
}
export {
  createAuditCommand
};
//# sourceMappingURL=audit.js.map
