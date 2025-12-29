const EMPTY_HALSTEAD_METRICS = {
  distinctOperators: 0,
  distinctOperands: 0,
  totalOperators: 0,
  totalOperands: 0,
  vocabulary: 0,
  length: 0,
  calculatedLength: 0,
  volume: 0,
  difficulty: 0,
  effort: 0,
  time: 0,
  bugs: 0
};
const DEFAULT_THRESHOLDS = {
  cyclomaticHigh: 10,
  cyclomaticCritical: 20,
  cognitiveHigh: 15,
  cognitiveCritical: 25,
  maxNestingDepth: 4,
  maxFunctionLength: 50
};
export {
  DEFAULT_THRESHOLDS,
  EMPTY_HALSTEAD_METRICS
};
//# sourceMappingURL=types.js.map
