import { resolve, isAbsolute, normalize } from "path";
function validatePath(basePath, relativePath) {
  const resolvedBase = resolve(basePath);
  const targetPath = isAbsolute(relativePath) ? normalize(relativePath) : resolve(resolvedBase, relativePath);
  const normalizedTarget = normalize(targetPath);
  if (!normalizedTarget.startsWith(resolvedBase + "/") && normalizedTarget !== resolvedBase) {
    throw new Error(`Path traversal detected: "${relativePath}" escapes base directory`);
  }
  return normalizedTarget;
}
function validateProjectRoot(projectRoot) {
  if (!projectRoot || typeof projectRoot !== "string") {
    throw new Error("Project root path is required");
  }
  const resolved = resolve(projectRoot);
  if (resolved.includes("\0")) {
    throw new Error("Invalid null byte in path");
  }
  return resolved;
}
function validateDocsPath(projectRoot, docsPath) {
  const resolvedRoot = validateProjectRoot(projectRoot);
  const safeDocs = docsPath?.trim() || "docs";
  return validatePath(resolvedRoot, safeDocs);
}
export {
  validateDocsPath,
  validatePath,
  validateProjectRoot
};
//# sourceMappingURL=security.js.map
