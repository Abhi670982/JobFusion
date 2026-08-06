export interface Logger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: unknown, meta?: Record<string, any>): void;
}

export class ConsoleLogger implements Logger {
  constructor(private prefix = "JobPortal") {}

  info(message: string, meta?: Record<string, any>): void {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[INFO][${this.prefix}] ${message}`, meta ? JSON.stringify(meta) : "");
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[WARN][${this.prefix}] ${message}`, meta ? JSON.stringify(meta) : "");
  }

  error(message: string, error?: unknown, meta?: Record<string, any>): void {
    const errObj = error instanceof Error ? { name: error.name, message: error.message } : error;
    console.error(`[ERROR][${this.prefix}] ${message}`, errObj || "", meta ? JSON.stringify(meta) : "");
  }
}

export const defaultLogger: Logger = new ConsoleLogger();
