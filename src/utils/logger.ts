type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private static instance: Logger;
  private isDebugEnabled: boolean;

  private constructor() {
    this.isDebugEnabled = import.meta.env.DEV;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: unknown,
    fromBridge: boolean = false
  ): string {
    const prefix = fromBridge ? "[WebSpatial][Bridge]" : "[WebSpatial]";
    const formattedData = data ? JSON.stringify(data, null, 2) : "";
    return data
      ? `${prefix}[${level.toUpperCase()}] ${message}\n${formattedData}`
      : `${prefix}[${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, data?: unknown): void {
    if (this.isDebugEnabled) {
      console.debug(this.formatMessage("debug", message, data));
    }
  }

  info(message: string, data?: unknown): void {
    console.info(this.formatMessage("info", message, data));
  }

  warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage("warn", message, data));
  }

  error(message: string, error?: unknown): void {
    console.error(this.formatMessage("error", message, error));
  }
}

// Exporter une instance singleton du logger
export const logger = Logger.getInstance();
