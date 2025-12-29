var SOPCategory = /* @__PURE__ */ ((SOPCategory2) => {
  SOPCategory2["PROGRAM_MANAGEMENT"] = "program-management";
  SOPCategory2["OPERATIONS"] = "operations";
  SOPCategory2["DEVELOPMENT"] = "development";
  SOPCategory2["GOVERNANCE"] = "governance";
  SOPCategory2["QUALITY"] = "quality";
  return SOPCategory2;
})(SOPCategory || {});
var ComplianceStatus = /* @__PURE__ */ ((ComplianceStatus2) => {
  ComplianceStatus2["COMPLIANT"] = "compliant";
  ComplianceStatus2["PARTIAL"] = "partial";
  ComplianceStatus2["NON_COMPLIANT"] = "non-compliant";
  ComplianceStatus2["NOT_APPLICABLE"] = "not-applicable";
  ComplianceStatus2["PENDING"] = "pending";
  return ComplianceStatus2;
})(ComplianceStatus || {});
var SOPPriority = /* @__PURE__ */ ((SOPPriority2) => {
  SOPPriority2["CRITICAL"] = "critical";
  SOPPriority2["HIGH"] = "high";
  SOPPriority2["MEDIUM"] = "medium";
  SOPPriority2["LOW"] = "low";
  return SOPPriority2;
})(SOPPriority || {});
var IRBStatus = /* @__PURE__ */ ((IRBStatus2) => {
  IRBStatus2["REQUIRED"] = "required";
  IRBStatus2["IN_REVIEW"] = "in-review";
  IRBStatus2["APPROVED"] = "approved";
  IRBStatus2["NOT_REQUIRED"] = "not-required";
  IRBStatus2["PENDING"] = "pending";
  return IRBStatus2;
})(IRBStatus || {});
var GraphLayer = /* @__PURE__ */ ((GraphLayer2) => {
  GraphLayer2["STANDARDS"] = "standards";
  GraphLayer2["PROJECT"] = "project";
  GraphLayer2["COMPLIANCE"] = "compliance";
  GraphLayer2["CUSTOM"] = "custom";
  return GraphLayer2;
})(GraphLayer || {});
export {
  ComplianceStatus,
  GraphLayer,
  IRBStatus,
  SOPCategory,
  SOPPriority
};
//# sourceMappingURL=types.js.map
