import chalk from "chalk";
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["TRACE"] = 0] = "TRACE";
  LogLevel2[LogLevel2["DEBUG"] = 1] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 3] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 4] = "ERROR";
  LogLevel2[LogLevel2["FATAL"] = 5] = "FATAL";
  LogLevel2[LogLevel2["SILENT"] = 6] = "SILENT";
  return LogLevel2;
})(LogLevel || {});
const LOG_LEVEL_NAMES = {
  [
    0
    /* TRACE */
  ]: "TRACE",
  [
    1
    /* DEBUG */
  ]: "DEBUG",
  [
    2
    /* INFO */
  ]: "INFO",
  [
    3
    /* WARN */
  ]: "WARN",
  [
    4
    /* ERROR */
  ]: "ERROR",
  [
    5
    /* FATAL */
  ]: "FATAL",
  [
    6
    /* SILENT */
  ]: "SILENT"
};
const LOG_LEVEL_COLORS = {
  [
    0
    /* TRACE */
  ]: chalk.gray,
  [
    1
    /* DEBUG */
  ]: chalk.blue,
  [
    2
    /* INFO */
  ]: chalk.green,
  [
    3
    /* WARN */
  ]: chalk.yellow,
  [
    4
    /* ERROR */
  ]: chalk.red,
  [
    5
    /* FATAL */
  ]: chalk.bgRed.white,
  [
    6
    /* SILENT */
  ]: (s) => s
};
function sanitizeStackTrace(stack) {
  if (!stack) return void 0;
  if (process.env.NODE_ENV !== "production") return stack;
  return stack.replace(/\(\/[^)]+\/([^/]+:\d+:\d+)\)/g, "($1)");
}
function parseLogLevel(level) {
  const upper = level.toUpperCase();
  switch (upper) {
    case "TRACE":
      return 0;
    case "DEBUG":
      return 1;
    case "INFO":
      return 2;
    case "WARN":
    case "WARNING":
      return 3;
    case "ERROR":
      return 4;
    case "FATAL":
      return 5;
    case "SILENT":
    case "NONE":
      return 6;
    default:
      return 2;
  }
}
class Logger {
  level;
  name;
  timestamps;
  json;
  colors;
  output;
  constructor(options = {}) {
    this.level = options.level ?? 2;
    this.name = options.name;
    this.timestamps = options.timestamps ?? true;
    this.json = options.json ?? false;
    this.colors = options.colors ?? true;
    this.output = options.output ?? this.defaultOutput.bind(this);
  }
  /**
   * Default output implementation
   */
  defaultOutput(entry) {
    if (this.json) {
      console.log(JSON.stringify({
        level: LOG_LEVEL_NAMES[entry.level],
        message: entry.message,
        timestamp: entry.timestamp.toISOString(),
        name: entry.name,
        ...entry.context,
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: sanitizeStackTrace(entry.error.stack)
        } : void 0
      }));
      return;
    }
    const parts = [];
    if (this.timestamps) {
      const time = entry.timestamp.toISOString().slice(11, 23);
      parts.push(this.colors ? chalk.gray(`[${time}]`) : `[${time}]`);
    }
    const levelName = LOG_LEVEL_NAMES[entry.level].padEnd(5);
    const colorFn = LOG_LEVEL_COLORS[entry.level];
    parts.push(this.colors ? colorFn(levelName) : levelName);
    if (entry.name) {
      parts.push(this.colors ? chalk.cyan(`[${entry.name}]`) : `[${entry.name}]`);
    }
    parts.push(entry.message);
    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = JSON.stringify(entry.context);
      parts.push(this.colors ? chalk.gray(contextStr) : contextStr);
    }
    const line = parts.join(" ");
    if (entry.level >= 4) {
      console.error(line);
      if (entry.error?.stack) {
        console.error(this.colors ? chalk.gray(entry.error.stack) : entry.error.stack);
      }
    } else {
      console.log(line);
    }
  }
  /**
   * Log at specified level
   */
  log(level, message, context) {
    if (level < this.level) return;
    const entry = {
      level,
      message,
      timestamp: /* @__PURE__ */ new Date(),
      name: this.name,
      context
    };
    this.output(entry);
  }
  /**
   * Log trace message
   */
  trace(message, context) {
    this.log(0, message, context);
  }
  /**
   * Log debug message
   */
  debug(message, context) {
    this.log(1, message, context);
  }
  /**
   * Log info message
   */
  info(message, context) {
    this.log(2, message, context);
  }
  /**
   * Log warning message
   */
  warn(message, context) {
    this.log(3, message, context);
  }
  /**
   * Log error message
   */
  error(message, error, context) {
    const entry = {
      level: 4,
      message,
      timestamp: /* @__PURE__ */ new Date(),
      name: this.name,
      context,
      error
    };
    if (4 >= this.level) {
      this.output(entry);
    }
  }
  /**
   * Log fatal message
   */
  fatal(message, error, context) {
    const entry = {
      level: 5,
      message,
      timestamp: /* @__PURE__ */ new Date(),
      name: this.name,
      context,
      error
    };
    if (5 >= this.level) {
      this.output(entry);
    }
  }
  /**
   * Create a child logger with additional context
   */
  child(name) {
    const childName = this.name ? `${this.name}:${name}` : name;
    return new Logger({
      level: this.level,
      name: childName,
      timestamps: this.timestamps,
      json: this.json,
      colors: this.colors,
      output: this.output
    });
  }
  /**
   * Set log level
   */
  setLevel(level) {
    this.level = level;
  }
  /**
   * Get current log level
   */
  getLevel() {
    return this.level;
  }
  /**
   * Check if level is enabled
   */
  isLevelEnabled(level) {
    return level >= this.level;
  }
}
let defaultLogger = null;
function getLogger() {
  if (!defaultLogger) {
    const level = parseLogLevel(process.env.LOG_LEVEL ?? "info");
    defaultLogger = new Logger({
      level,
      name: "kg",
      colors: process.stdout.isTTY ?? true
    });
  }
  return defaultLogger;
}
function createLogger(name, options = {}) {
  return new Logger({ ...options, name });
}
function setDefaultLogger(logger) {
  defaultLogger = logger;
}
function createProgressLogger(logger = getLogger()) {
  let currentMessage = "";
  return {
    start(message) {
      currentMessage = message;
      logger.info(`⏳ ${message}`);
    },
    update(message) {
      currentMessage = message;
      logger.debug(`   ${message}`);
    },
    succeed(message) {
      logger.info(`✅ ${message ?? currentMessage}`);
    },
    fail(message) {
      logger.error(`❌ ${message ?? currentMessage}`);
    },
    stop() {
    }
  };
}
export {
  LogLevel,
  Logger,
  createLogger,
  createProgressLogger,
  getLogger,
  parseLogLevel,
  setDefaultLogger
};
//# sourceMappingURL=logger.js.map
