import { EventEmitter } from "events";
import { createLogger } from "../utils/logger.js";
const logger = createLogger("event-bus");
class TypedEventBus {
  emitter;
  history = [];
  options;
  metrics = /* @__PURE__ */ new Map();
  handlers = /* @__PURE__ */ new Map();
  wildcardHandlers = /* @__PURE__ */ new Set();
  eventCounter = 0;
  cleanupInterval;
  constructor(options = {}) {
    this.options = {
      maxHistorySize: options.maxHistorySize ?? 1e3,
      historyRetention: options.historyRetention ?? 60 * 60 * 1e3,
      // 1 hour
      maxListeners: options.maxListeners ?? 100,
      debugEvents: options.debugEvents ?? false
    };
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(this.options.maxListeners);
    this.cleanupInterval = setInterval(
      () => this.pruneHistory(),
      Math.min(this.options.historyRetention / 10, 6e4)
      // At most every minute
    );
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
    logger.debug("TypedEventBus initialized", {
      maxHistorySize: this.options.maxHistorySize,
      historyRetention: this.options.historyRetention
    });
  }
  /**
   * Emit an event with typed data
   */
  emit(event, data, source = "unknown") {
    this.emitEvent(event, source, data);
  }
  /**
   * Emit an event using (type, source, data) signature
   * This method supports both typed events and arbitrary string events
   * for backwards compatibility with container and other components.
   *
   * @param type - Event type (can be EventType or any string)
   * @param source - Source of the event
   * @param data - Event data payload
   */
  emitEvent(type, source, data) {
    const startTime = Date.now();
    const id = this.generateEventId();
    const entry = {
      id,
      type,
      data,
      source,
      timestamp: /* @__PURE__ */ new Date()
    };
    if (this.options.debugEvents) {
      logger.debug(`Event emitted: ${type}`, { source, id, data });
    }
    this.addToHistory(entry);
    let handlersExecuted = { errors: 0 };
    if (this.isKnownEventType(type)) {
      handlersExecuted = this.executeHandlers(
        type,
        data,
        entry
      );
    }
    for (const handler of this.wildcardHandlers) {
      this.safeExecute(handler, entry, type);
    }
    const latency = Date.now() - startTime;
    entry.latency = latency;
    if (this.isKnownEventType(type)) {
      this.updateMetrics(type, latency, handlersExecuted.errors);
    }
    this.emitter.emit(type, entry);
    this.emitter.emit("*", entry);
  }
  /**
   * Check if an event type is a known typed event
   */
  isKnownEventType(type) {
    const knownTypes = /* @__PURE__ */ new Set([
      "NodeCreated",
      "NodeUpdated",
      "NodeDeleted",
      "RelationCreated",
      "RelationDeleted",
      "AgentSpawned",
      "AgentCompleted",
      "AgentFailed",
      "WorkflowStarted",
      "WorkflowProgress",
      "WorkflowCompleted",
      "PluginLoaded",
      "PluginError",
      "HealthCheckFailed",
      "HealthCheckRecovered",
      "CacheEviction"
    ]);
    return knownTypes.has(type);
  }
  /**
   * Subscribe to an event type
   */
  on(event, handler) {
    const handlers = this.getOrCreateHandlerSet(event);
    handlers.add(handler);
    logger.debug(`Handler subscribed to ${event}`, {
      totalHandlers: handlers.size
    });
    return () => this.off(event, handler);
  }
  /**
   * Subscribe to an event type for a single occurrence
   */
  once(event, handler) {
    const wrappedHandler = (data, entry) => {
      this.off(event, wrappedHandler);
      return handler(data, entry);
    };
    return this.on(event, wrappedHandler);
  }
  /**
   * Unsubscribe a specific handler
   */
  off(event, handler) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      logger.debug(`Handler unsubscribed from ${event}`, {
        remainingHandlers: handlers.size
      });
    }
  }
  /**
   * Subscribe to all events (wildcard)
   */
  onAny(handler) {
    this.wildcardHandlers.add(handler);
    logger.debug("Wildcard handler subscribed", {
      totalWildcardHandlers: this.wildcardHandlers.size
    });
    return () => {
      this.wildcardHandlers.delete(handler);
      logger.debug("Wildcard handler unsubscribed", {
        remainingWildcardHandlers: this.wildcardHandlers.size
      });
    };
  }
  /**
   * Get event history with optional filtering
   */
  getHistory(filter) {
    let result = [...this.history];
    if (!filter) {
      return result;
    }
    if (filter.types && filter.types.length > 0) {
      const typeSet = new Set(filter.types);
      result = result.filter((e) => typeSet.has(e.type));
    }
    if (filter.source) {
      result = result.filter((e) => e.source === filter.source);
    }
    if (filter.sourcePattern) {
      result = result.filter((e) => filter.sourcePattern.test(e.source));
    }
    if (filter.since) {
      result = result.filter((e) => e.timestamp >= filter.since);
    }
    if (filter.until) {
      result = result.filter((e) => e.timestamp < filter.until);
    }
    if (filter.offset && filter.offset > 0) {
      result = result.slice(filter.offset);
    }
    if (filter.limit && filter.limit > 0) {
      result = result.slice(0, filter.limit);
    }
    return result;
  }
  /**
   * Get event bus metrics
   */
  getMetrics() {
    let totalEvents = 0;
    let totalErrors = 0;
    const byType = {};
    for (const [type, metrics] of this.metrics) {
      totalEvents += metrics.count;
      totalErrors += metrics.errorCount;
      byType[type] = { ...metrics };
    }
    let subscriberCount = this.wildcardHandlers.size;
    for (const handlers of this.handlers.values()) {
      subscriberCount += handlers.size;
    }
    return {
      totalEvents,
      totalErrors,
      byType,
      historySize: this.history.length,
      subscriberCount
    };
  }
  /**
   * Clear event history
   */
  clearHistory() {
    this.history.length = 0;
    logger.debug("Event history cleared");
  }
  /**
   * Get the underlying EventEmitter for GraphQL subscriptions
   */
  getEmitter() {
    return this.emitter;
  }
  /**
   * Stop the event bus and cleanup resources
   */
  dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = void 0;
    }
    this.handlers.clear();
    this.wildcardHandlers.clear();
    this.history.length = 0;
    this.metrics.clear();
    this.emitter.removeAllListeners();
    logger.debug("TypedEventBus disposed");
  }
  // ============================================================================
  // Private Methods
  // ============================================================================
  /**
   * Generate a unique event ID
   */
  generateEventId() {
    this.eventCounter += 1;
    const timestamp = Date.now().toString(36);
    const counter = this.eventCounter.toString(36).padStart(4, "0");
    const random = Math.random().toString(36).substring(2, 6);
    return `evt_${timestamp}_${counter}_${random}`;
  }
  /**
   * Get or create handler set for an event type
   */
  getOrCreateHandlerSet(event) {
    let handlers = this.handlers.get(event);
    if (!handlers) {
      handlers = /* @__PURE__ */ new Set();
      this.handlers.set(event, handlers);
    }
    return handlers;
  }
  /**
   * Execute all handlers for an event with error isolation
   */
  executeHandlers(event, data, entry) {
    const handlers = this.handlers.get(event);
    let executed = 0;
    let errors = 0;
    if (!handlers || handlers.size === 0) {
      return { executed, errors };
    }
    for (const handler of handlers) {
      executed += 1;
      const success = this.safeExecute(
        () => handler(data, entry),
        entry,
        event
      );
      if (!success) {
        errors += 1;
      }
    }
    return { executed, errors };
  }
  /**
   * Safely execute a handler with error isolation
   */
  safeExecute(handler, entry, eventType) {
    try {
      const result = typeof handler === "function" ? handler(entry) : void 0;
      if (result && typeof result.catch === "function") {
        result.catch((error) => {
          this.handleHandlerError(error, eventType, entry.id);
        });
      }
      return true;
    } catch (error) {
      this.handleHandlerError(error, eventType, entry.id);
      return false;
    }
  }
  /**
   * Handle a handler error without affecting other handlers
   */
  handleHandlerError(error, eventType, eventId) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Handler error for ${eventType}`, error instanceof Error ? error : void 0, {
      eventId,
      eventType,
      errorMessage
    });
    this.emitter.emit("handler:error", {
      eventType,
      eventId,
      error,
      timestamp: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Add an event to history
   */
  addToHistory(entry) {
    this.history.push(entry);
    if (this.history.length > this.options.maxHistorySize) {
      const removeCount = this.history.length - this.options.maxHistorySize;
      this.history.splice(0, removeCount);
    }
  }
  /**
   * Prune old entries from history based on retention time
   */
  pruneHistory() {
    const cutoff = new Date(Date.now() - this.options.historyRetention);
    this.history.length;
    let firstValidIndex = 0;
    for (let i = 0; i < this.history.length; i++) {
      if (this.history[i].timestamp >= cutoff) {
        firstValidIndex = i;
        break;
      }
      firstValidIndex = this.history.length;
    }
    if (firstValidIndex > 0) {
      this.history.splice(0, firstValidIndex);
      logger.debug("Pruned old events from history", {
        removed: firstValidIndex,
        remaining: this.history.length
      });
    }
  }
  /**
   * Update metrics for an event type
   */
  updateMetrics(event, latency, errors) {
    let metrics = this.metrics.get(event);
    if (!metrics) {
      metrics = {
        count: 0,
        errorCount: 0,
        avgLatency: 0,
        maxLatency: 0
      };
      this.metrics.set(event, metrics);
    }
    metrics.count += 1;
    metrics.errorCount += errors;
    metrics.lastEvent = /* @__PURE__ */ new Date();
    metrics.avgLatency = (metrics.avgLatency * (metrics.count - 1) + latency) / metrics.count;
    metrics.maxLatency = Math.max(metrics.maxLatency, latency);
  }
}
function createTypedEventBus(options) {
  return new TypedEventBus(options);
}
function createSubscriptionIterator(eventBus, eventTypes) {
  const emitter = eventBus.getEmitter();
  const queue = [];
  let resolveNext = null;
  let done = false;
  const handler = (entry) => {
    if (eventTypes.includes(entry.type)) {
      if (resolveNext) {
        resolveNext({ value: entry, done: false });
        resolveNext = null;
      } else {
        queue.push(entry);
      }
    }
  };
  for (const eventType of eventTypes) {
    emitter.on(eventType, handler);
  }
  const iterator = {
    next() {
      if (done) {
        return Promise.resolve({ value: void 0, done: true });
      }
      if (queue.length > 0) {
        return Promise.resolve({ value: queue.shift(), done: false });
      }
      return new Promise((resolve) => {
        resolveNext = resolve;
      });
    },
    return() {
      done = true;
      for (const eventType of eventTypes) {
        emitter.off(eventType, handler);
      }
      return Promise.resolve({ value: void 0, done: true });
    },
    throw(error) {
      done = true;
      for (const eventType of eventTypes) {
        emitter.off(eventType, handler);
      }
      return Promise.reject(error);
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
  return iterator;
}
function createNodeTypeFilter(nodeTypes) {
  const typeSet = new Set(nodeTypes);
  return (entry) => typeSet.has(entry.data.type);
}
function createSourceFilter(sources) {
  const sourceSet = new Set(sources);
  return (entry) => sourceSet.has(entry.source);
}
export {
  TypedEventBus,
  createNodeTypeFilter,
  createSourceFilter,
  createSubscriptionIterator,
  createTypedEventBus
};
//# sourceMappingURL=event-bus.js.map
