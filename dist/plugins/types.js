function isAnalyzerPlugin(plugin) {
  return plugin.type === "analyzer" && "analyze" in plugin && typeof plugin.analyze === "function" && "supportedContentTypes" in plugin && Array.isArray(plugin.supportedContentTypes);
}
function isPluginManifest(obj) {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  const manifest = obj;
  return typeof manifest.name === "string" && typeof manifest.version === "string" && typeof manifest["kg-plugin"] === "object" && manifest["kg-plugin"] !== null && typeof manifest["kg-plugin"].type === "string" && typeof manifest["kg-plugin"].main === "string";
}
function isAnalysisResult(obj) {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  const result = obj;
  return typeof result.success === "boolean" && typeof result.analysisType === "string";
}
function createPluginId(name) {
  return `plugin_${name}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function isValidSemver(version) {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}
function createDefaultPluginMetadata(name, version, type) {
  return {
    name,
    version,
    type,
    status: "unloaded",
    hooks: [],
    capabilities: []
  };
}
export {
  createDefaultPluginMetadata,
  createPluginId,
  isAnalysisResult,
  isAnalyzerPlugin,
  isPluginManifest,
  isValidSemver
};
//# sourceMappingURL=types.js.map
