import { getDefaultExportFromCjs } from "./_commonjsHelpers.js";
import { __require as requireGlobalPonyfill } from "../node_modules/@whatwg-node/fetch/dist/global-ponyfill.js";
var globalPonyfillExports = /* @__PURE__ */ requireGlobalPonyfill();
const globalPonyfill = /* @__PURE__ */ getDefaultExportFromCjs(globalPonyfillExports);
export {
  globalPonyfill as default,
  globalPonyfillExports as g
};
//# sourceMappingURL=global-ponyfill.js.map
