import { Command } from "commander";
import { resolve, join } from "path";
import { SeedGenerator } from "../../cultivation/seed-generator.js";
import "../../cultivation/deep-analyzer.js";
function createInitPrimitivesCommand() {
  const cmd = new Command("init-primitives").description("Bootstrap knowledge graph with primitive nodes from codebase").option("-p, --path <path>", "Project root path", process.cwd()).option("-d, --docs <path>", "Documentation path", "docs").option("-o, --output <path>", "Output path for primitives (defaults to docs path)").option("--dry-run", "Analyze only, do not write files").option("-v, --verbose", "Verbose output").option("--ecosystem <ecosystems>", "Filter to specific ecosystems (comma-separated: nodejs,python,rust,go,php,java)").option("--include-dev", "Include dev dependencies", false).option("--major-only", "Only generate nodes for major dependencies", false).action(async (options) => {
    const projectRoot = resolve(options.path);
    const docsPath = options.docs;
    const outputPath = options.output || docsPath;
    const verbose = options.verbose;
    const dryRun = options.dryRun;
    console.log(`
🌱 Initializing Primitives
`);
    console.log(`  Project: ${projectRoot}`);
    console.log(`  Docs: ${docsPath}`);
    if (dryRun) {
      console.log(`  Mode: Dry Run (no files will be written)`);
    }
    console.log("");
    try {
      let ecosystems;
      if (options.ecosystem) {
        ecosystems = options.ecosystem.split(",").map((e) => e.trim());
      }
      const cultivationOptions = {
        projectRoot,
        docsPath,
        outputPath: join(projectRoot, outputPath),
        dryRun,
        verbose,
        ecosystems,
        includeDev: options.includeDev,
        minImportance: options.majorOnly ? "major" : "all"
      };
      console.log("📊 Analyzing codebase...\n");
      const generator = await SeedGenerator.create(projectRoot, docsPath);
      const analysis = await generator.analyze();
      console.log("📦 Analysis Results:");
      console.log(`  Languages: ${analysis.languages.join(", ") || "none"}`);
      console.log(`  Dependencies: ${analysis.dependencies.length}`);
      console.log(`  Frameworks: ${analysis.frameworks.length}`);
      console.log(`  Services: ${analysis.services.length}`);
      console.log(`  Deployments: ${analysis.deployments.length}`);
      console.log(`  Existing Concepts: ${analysis.existingConcepts.length}`);
      console.log(`  Files Scanned: ${analysis.metadata.filesScanned}`);
      console.log(`  Duration: ${analysis.metadata.duration}ms`);
      console.log("");
      if (verbose) {
        if (analysis.frameworks.length > 0) {
          console.log("🏗️  Detected Frameworks:");
          for (const fw of analysis.frameworks) {
            console.log(`  - ${fw.name} (${fw.ecosystem}) v${fw.version}`);
          }
          console.log("");
        }
        if (analysis.services.length > 0) {
          console.log("🔧 Detected Services:");
          for (const svc of analysis.services) {
            console.log(`  - ${svc.name} (${svc.type}) - ${svc.technology}`);
          }
          console.log("");
        }
        if (analysis.deployments.length > 0) {
          console.log("🚀 Deployment Configurations:");
          for (const dep of analysis.deployments) {
            console.log(`  - ${dep}`);
          }
          console.log("");
        }
      }
      console.log("📝 Generating primitive nodes...\n");
      const documents = await generator.generatePrimitives(analysis);
      if (dryRun) {
        console.log(`📄 Would create ${documents.length} primitive nodes:
`);
        for (const doc of documents) {
          console.log(`  - ${doc.frontmatter.type}: ${doc.title}`);
          if (verbose) {
            console.log(`    Path: ${doc.path}`);
            console.log(`    Category: ${doc.frontmatter.category}`);
          }
        }
        console.log("\n✨ Dry run complete! Run without --dry-run to create files.\n");
      } else {
        const result = await generator.writePrimitives(documents);
        console.log("✅ Primitives Created:\n");
        console.log(`  Documents: ${result.documentsGenerated.length}`);
        console.log(`  Directories: ${result.directoriesCreated.length}`);
        if (result.warnings.length > 0) {
          console.log("\n⚠️  Warnings:");
          for (const warning of result.warnings) {
            console.log(`  - ${warning}`);
          }
        }
        if (result.errors.length > 0) {
          console.log("\n❌ Errors:");
          for (const error of result.errors) {
            console.log(`  - ${error}`);
          }
        }
        if (verbose && result.documentsGenerated.length > 0) {
          console.log("\n📄 Created Files:");
          for (const doc of result.documentsGenerated) {
            console.log(`  - ${doc.path}`);
          }
        }
        console.log("\n✨ Primitives initialization complete!\n");
        console.log("📚 Next Steps:");
        console.log("  1. Review generated primitives in docs/");
        console.log('  2. Run "kg generate" to build knowledge graph');
        console.log('  3. Run "kg sop init" to initialize compliance tracking');
        console.log("");
      }
    } catch (error) {
      console.error("\n❌ Initialization failed:", error);
      process.exit(1);
    }
  });
  return cmd;
}
function createAnalyzeCodebaseCommand() {
  const cmd = new Command("analyze-codebase").description("Analyze codebase dependencies and services without generating nodes").option("-p, --path <path>", "Project root path", process.cwd()).option("-d, --docs <path>", "Documentation path", "docs").option("-v, --verbose", "Verbose output").option("--json", "Output as JSON").action(async (options) => {
    const projectRoot = resolve(options.path);
    const docsPath = options.docs;
    const verbose = options.verbose;
    const jsonOutput = options.json;
    if (!jsonOutput) {
      console.log(`
🔍 Analyzing Codebase
`);
      console.log(`  Project: ${projectRoot}`);
      console.log("");
    }
    try {
      const generator = await SeedGenerator.create(projectRoot, docsPath);
      const analysis = await generator.analyze();
      if (jsonOutput) {
        console.log(JSON.stringify(analysis, null, 2));
        return;
      }
      console.log("📊 Analysis Summary:");
      console.log(`  Languages: ${analysis.languages.join(", ") || "none"}`);
      console.log(`  Total Dependencies: ${analysis.dependencies.length}`);
      console.log(`  Frameworks: ${analysis.frameworks.length}`);
      console.log(`  Services: ${analysis.services.length}`);
      console.log(`  Deployments: ${analysis.deployments.length}`);
      console.log("");
      const byEcosystem = /* @__PURE__ */ new Map();
      for (const dep of analysis.dependencies) {
        byEcosystem.set(dep.ecosystem, (byEcosystem.get(dep.ecosystem) || 0) + 1);
      }
      if (byEcosystem.size > 0) {
        console.log("📦 Dependencies by Ecosystem:");
        for (const [ecosystem, count] of byEcosystem.entries()) {
          console.log(`  - ${ecosystem}: ${count}`);
        }
        console.log("");
      }
      if (analysis.frameworks.length > 0) {
        console.log("🏗️  Frameworks:");
        for (const fw of analysis.frameworks) {
          console.log(`  - ${fw.name} (${fw.ecosystem}) v${fw.version}`);
          if (verbose && fw.usedBy.length > 0) {
            console.log(`    Used by: ${fw.usedBy.slice(0, 3).join(", ")}${fw.usedBy.length > 3 ? "..." : ""}`);
          }
        }
        console.log("");
      }
      if (analysis.services.length > 0) {
        console.log("🔧 Services:");
        for (const svc of analysis.services) {
          console.log(`  - ${svc.name}`);
          console.log(`    Type: ${svc.type}, Technology: ${svc.technology}`);
          if (svc.ports && svc.ports.length > 0) {
            console.log(`    Ports: ${svc.ports.join(", ")}`);
          }
        }
        console.log("");
      }
      if (analysis.deployments.length > 0) {
        console.log("🚀 Deployment Configurations:");
        for (const dep of analysis.deployments) {
          console.log(`  - ${dep}`);
        }
        console.log("");
      }
      if (analysis.existingConcepts.length > 0 || analysis.existingFeatures.length > 0) {
        console.log("📚 Existing Documentation:");
        console.log(`  Concepts: ${analysis.existingConcepts.length}`);
        console.log(`  Features: ${analysis.existingFeatures.length}`);
        console.log("");
      }
      console.log(`⏱️  Analysis completed in ${analysis.metadata.duration}ms`);
      console.log(`📄 Files scanned: ${analysis.metadata.filesScanned}`);
      console.log("");
    } catch (error) {
      console.error("\n❌ Analysis failed:", error);
      process.exit(1);
    }
  });
  return cmd;
}
export {
  createAnalyzeCodebaseCommand,
  createInitPrimitivesCommand
};
//# sourceMappingURL=init-primitives.js.map
