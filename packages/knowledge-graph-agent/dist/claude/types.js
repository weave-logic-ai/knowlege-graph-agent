import { z } from "zod";
const TokenUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cacheReadTokens: z.number().int().nonnegative().optional(),
  cacheWriteTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative(),
  estimatedCostUsd: z.number().nonnegative().optional()
});
const BaseMetadataSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  tags: z.array(z.string()),
  custom: z.record(z.unknown()).optional()
});
z.object({
  id: z.string().startsWith("session_"),
  name: z.string().min(1),
  purpose: z.string().optional(),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().optional(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled", "timeout"]),
  conversationIds: z.array(z.string().startsWith("conv_")),
  swarmIds: z.array(z.string().startsWith("swarm_")).optional(),
  workflowIds: z.array(z.string().startsWith("wf_")).optional(),
  tokenUsage: TokenUsageSchema.extend({
    operationCount: z.number().int().nonnegative(),
    byModel: z.record(TokenUsageSchema).optional(),
    byOperationType: z.record(TokenUsageSchema).optional()
  }),
  metadata: BaseMetadataSchema
});
function createSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function createConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function createMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function createToolCallId() {
  return `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function createSubAgentId() {
  return `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function createSwarmId() {
  return `swarm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
export {
  BaseMetadataSchema,
  TokenUsageSchema,
  createConversationId,
  createMessageId,
  createSessionId,
  createSubAgentId,
  createSwarmId,
  createToolCallId
};
//# sourceMappingURL=types.js.map
