class ServiceManager {
  services = /* @__PURE__ */ new Map();
  configs = /* @__PURE__ */ new Map();
  states = /* @__PURE__ */ new Map();
  /**
   * Register a service
   */
  register(config, handler) {
    this.services.set(config.id, handler);
    this.configs.set(config.id, config);
    this.states.set(config.id, {
      status: "stopped",
      restartCount: 0
    });
  }
  /**
   * Start a service
   */
  async start(id) {
    const handler = this.services.get(id);
    const state = this.states.get(id);
    if (!handler || !state) {
      throw new Error(`Service not found: ${id}`);
    }
    state.status = "starting";
    try {
      await handler.start();
      state.status = "running";
      state.startedAt = /* @__PURE__ */ new Date();
    } catch (error) {
      state.status = "error";
      state.lastError = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }
  /**
   * Stop a service
   */
  async stop(id) {
    const handler = this.services.get(id);
    const state = this.states.get(id);
    if (!handler || !state) {
      throw new Error(`Service not found: ${id}`);
    }
    state.status = "stopping";
    try {
      await handler.stop();
      state.status = "stopped";
    } catch (error) {
      state.status = "error";
      state.lastError = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }
  /**
   * Start all services
   */
  async startAll() {
    for (const [id, config] of this.configs) {
      if (config.autoStart !== false) {
        await this.start(id);
      }
    }
  }
  /**
   * Stop all services
   */
  async stopAll() {
    for (const id of this.services.keys()) {
      const state = this.states.get(id);
      if (state?.status === "running") {
        await this.stop(id);
      }
    }
  }
  /**
   * Get service state
   */
  getState(id) {
    return this.states.get(id);
  }
  /**
   * Get all service states
   */
  getAllStates() {
    return new Map(this.states);
  }
  /**
   * Get service metrics
   */
  getMetrics(id) {
    return this.services.get(id)?.getMetrics();
  }
}
function createServiceManager() {
  return new ServiceManager();
}
class FileWatcherService {
  constructor(watchPaths, onChange) {
    this.watchPaths = watchPaths;
    this.onChange = onChange;
  }
  status = "stopped";
  metrics = {
    uptime: 0,
    operationCount: 0,
    errorCount: 0
  };
  startTime;
  watcher = null;
  async start() {
    this.status = "running";
    this.startTime = /* @__PURE__ */ new Date();
  }
  async stop() {
    this.status = "stopped";
    this.watcher = null;
  }
  getStatus() {
    return this.status;
  }
  getMetrics() {
    if (this.startTime && this.status === "running") {
      this.metrics.uptime = Date.now() - this.startTime.getTime();
    }
    return { ...this.metrics };
  }
}
export {
  FileWatcherService,
  ServiceManager,
  createServiceManager
};
//# sourceMappingURL=index.js.map
