class HealthMonitor {
  checks = /* @__PURE__ */ new Map();
  results = /* @__PURE__ */ new Map();
  startTime = /* @__PURE__ */ new Date();
  intervalId;
  config;
  constructor(config = {}) {
    this.config = {
      interval: config.interval || 6e4,
      timeout: config.timeout || 5e3,
      autoStart: config.autoStart ?? false
    };
    if (this.config.autoStart) {
      this.start();
    }
  }
  register(check) {
    this.checks.set(check.name, check);
  }
  unregister(name) {
    this.checks.delete(name);
    this.results.delete(name);
  }
  async check() {
    const components = [];
    for (const [name, check] of this.checks) {
      try {
        const result = await Promise.race([
          check.check(),
          this.timeout(check.name)
        ]);
        this.results.set(name, result);
        components.push(result);
      } catch (error) {
        const errorResult = {
          name,
          status: "unhealthy",
          message: error instanceof Error ? error.message : String(error),
          lastCheck: /* @__PURE__ */ new Date()
        };
        this.results.set(name, errorResult);
        components.push(errorResult);
      }
    }
    const status = this.calculateOverallStatus(components);
    return {
      status,
      components,
      timestamp: /* @__PURE__ */ new Date(),
      uptime: Date.now() - this.startTime.getTime()
    };
  }
  getLastStatus() {
    const components = Array.from(this.results.values());
    return {
      status: this.calculateOverallStatus(components),
      components,
      timestamp: /* @__PURE__ */ new Date(),
      uptime: Date.now() - this.startTime.getTime()
    };
  }
  getPerformanceMetrics() {
    const memoryUsage = process.memoryUsage();
    return {
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      }
    };
  }
  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.check().catch(() => {
      });
    }, this.config.interval);
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = void 0;
    }
  }
  timeout(name) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check timeout: ${name}`));
      }, this.config.timeout);
    });
  }
  calculateOverallStatus(components) {
    if (components.length === 0) return "unknown";
    const hasUnhealthy = components.some((c) => c.status === "unhealthy");
    const hasDegraded = components.some((c) => c.status === "degraded");
    if (hasUnhealthy) return "unhealthy";
    if (hasDegraded) return "degraded";
    return "healthy";
  }
}
function createHealthMonitor(config) {
  return new HealthMonitor(config);
}
function createDatabaseCheck(dbPath) {
  return {
    name: "database",
    critical: true,
    check: async () => {
      const startTime = Date.now();
      const { existsSync } = await import("fs");
      const exists = existsSync(dbPath);
      return {
        name: "database",
        status: exists ? "healthy" : "unhealthy",
        message: exists ? "Database accessible" : "Database file not found",
        lastCheck: /* @__PURE__ */ new Date(),
        responseTime: Date.now() - startTime
      };
    }
  };
}
function createCacheCheck() {
  return {
    name: "cache",
    check: async () => {
      return {
        name: "cache",
        status: "healthy",
        message: "Cache operational",
        lastCheck: /* @__PURE__ */ new Date()
      };
    }
  };
}
function createMemoryCheck(thresholdMB = 500) {
  return {
    name: "memory",
    check: async () => {
      const { heapUsed } = process.memoryUsage();
      const usedMB = heapUsed / (1024 * 1024);
      let status = "healthy";
      if (usedMB > thresholdMB * 0.9) {
        status = "unhealthy";
      } else if (usedMB > thresholdMB * 0.7) {
        status = "degraded";
      }
      return {
        name: "memory",
        status,
        message: `Heap usage: ${usedMB.toFixed(2)}MB`,
        lastCheck: /* @__PURE__ */ new Date(),
        metadata: { heapUsedMB: usedMB, thresholdMB }
      };
    }
  };
}
function createDiskCheck(path) {
  return {
    name: "disk",
    check: async () => {
      const { accessSync, constants } = await import("fs");
      try {
        accessSync(path, constants.R_OK | constants.W_OK);
        return {
          name: "disk",
          status: "healthy",
          message: "Disk accessible",
          lastCheck: /* @__PURE__ */ new Date()
        };
      } catch {
        return {
          name: "disk",
          status: "unhealthy",
          message: "Disk not accessible",
          lastCheck: /* @__PURE__ */ new Date()
        };
      }
    }
  };
}
export {
  HealthMonitor,
  createCacheCheck,
  createDatabaseCheck,
  createDiskCheck,
  createHealthMonitor,
  createMemoryCheck
};
//# sourceMappingURL=index.js.map
