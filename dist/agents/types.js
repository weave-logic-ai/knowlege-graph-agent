var AgentType = /* @__PURE__ */ ((AgentType2) => {
  AgentType2["RESEARCHER"] = "researcher";
  AgentType2["CODER"] = "coder";
  AgentType2["TESTER"] = "tester";
  AgentType2["ANALYST"] = "analyst";
  AgentType2["ARCHITECT"] = "architect";
  AgentType2["REVIEWER"] = "reviewer";
  AgentType2["COORDINATOR"] = "coordinator";
  AgentType2["OPTIMIZER"] = "optimizer";
  AgentType2["DOCUMENTER"] = "documenter";
  AgentType2["PLANNER"] = "planner";
  AgentType2["CUSTOM"] = "custom";
  return AgentType2;
})(AgentType || {});
var AgentStatus = /* @__PURE__ */ ((AgentStatus2) => {
  AgentStatus2["IDLE"] = "idle";
  AgentStatus2["RUNNING"] = "running";
  AgentStatus2["COMPLETED"] = "completed";
  AgentStatus2["FAILED"] = "failed";
  AgentStatus2["PAUSED"] = "paused";
  AgentStatus2["TERMINATED"] = "terminated";
  return AgentStatus2;
})(AgentStatus || {});
var TaskPriority = /* @__PURE__ */ ((TaskPriority2) => {
  TaskPriority2["LOW"] = "low";
  TaskPriority2["MEDIUM"] = "medium";
  TaskPriority2["HIGH"] = "high";
  TaskPriority2["CRITICAL"] = "critical";
  return TaskPriority2;
})(TaskPriority || {});
var MessageType = /* @__PURE__ */ ((MessageType2) => {
  MessageType2["REQUEST"] = "request";
  MessageType2["RESPONSE"] = "response";
  MessageType2["NOTIFICATION"] = "notification";
  MessageType2["ERROR"] = "error";
  MessageType2["STATUS"] = "status";
  MessageType2["COORDINATION"] = "coordination";
  return MessageType2;
})(MessageType || {});
function createMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function createTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function createAgentId(type) {
  return `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
export {
  AgentStatus,
  AgentType,
  MessageType,
  TaskPriority,
  createAgentId,
  createMessageId,
  createTaskId
};
//# sourceMappingURL=types.js.map
