import { createAnalyzeLinksCommand } from "./analyze-links.js";
import { LinkAnalyzer } from "./analyze-links.js";
import { createFindConnectionsCommand } from "./find-connections.js";
import { ConnectionFinder } from "./find-connections.js";
import { createValidateNamesCommand } from "./validate-names.js";
import { NameValidator } from "./validate-names.js";
import { createAddFrontmatterCommand } from "./add-frontmatter.js";
import { FrontmatterEnricher } from "./add-frontmatter.js";
import { Command } from "commander";
function createHiveMindCommand() {
  const command = new Command("hive-mind").description("Knowledge graph reconnection tools - reduce orphan rate and increase link density").alias("hm");
  command.addCommand(createAnalyzeLinksCommand());
  command.addCommand(createFindConnectionsCommand());
  command.addCommand(createValidateNamesCommand());
  command.addCommand(createAddFrontmatterCommand());
  command.action(() => {
    command.help();
  });
  return command;
}
export {
  ConnectionFinder,
  FrontmatterEnricher,
  LinkAnalyzer,
  NameValidator,
  createAddFrontmatterCommand,
  createAnalyzeLinksCommand,
  createFindConnectionsCommand,
  createHiveMindCommand,
  createValidateNamesCommand,
  createHiveMindCommand as default
};
//# sourceMappingURL=index.js.map
