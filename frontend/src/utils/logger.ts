/**
 * Production-ready logging service
 * Replaces console.log/error with structured logging and analytics
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  enableAnalytics: boolean;
  maxStoredLogs: number;
  storageKey: string;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private logQueue: LogEntry[] = [];
  private flushTimeoutId: NodeJS.Timeout | null = null;

  private static instance: Logger | null = null;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      enableConsole: process.env.NODE_ENV !== 'production',
      enableStorage: true,
      enableAnalytics: process.env.NODE_ENV === 'production',
      maxStoredLogs: 1000,
      storageKey: 'game-logs',
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initializeErrorHandlers();
  }

  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorHandlers(): void {
    // Capture unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Uncaught error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', {
          reason: event.reason,
          promise: event.promise
        });
      });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      critical: 4
    };

    return levels[level] >= levels[this.config.level];
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    component?: string,
    action?: string
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      context,
      component,
      action,
      metadata: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        viewport: typeof window !== 'undefined' ? 
          `${window.innerWidth}x${window.innerHeight}` : undefined
      }
    };
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    component?: string,
    action?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, component, action);

    // Console logging for development
    if (this.config.enableConsole) {
      const consoleMethod = level === 'critical' ? 'error' : level;
      const method = console[consoleMethod] || console.log;
      
      if (context || component || action) {
        method(`[${level.toUpperCase()}] ${message}`, {
          component,
          action,
          context,
          timestamp: entry.timestamp
        });
      } else {
        method(`[${level.toUpperCase()}] ${message}`);
      }
    }

    // Store for analytics and debugging
    if (this.config.enableStorage) {
      this.queueLog(entry);
    }

    // Send to analytics service for critical errors
    if (this.config.enableAnalytics && (level === 'error' || level === 'critical')) {
      this.sendToAnalytics(entry);
    }
  }

  private queueLog(entry: LogEntry): void {
    this.logQueue.push(entry);

    // Limit queue size
    if (this.logQueue.length > this.config.maxStoredLogs) {
      this.logQueue = this.logQueue.slice(-this.config.maxStoredLogs);
    }

    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimeoutId) return;

    this.flushTimeoutId = setTimeout(() => {
      this.flushLogs();
      this.flushTimeoutId = null;
    }, 5000); // Flush every 5 seconds
  }

  private flushLogs(): void {
    if (this.logQueue.length === 0) return;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const existingLogs = window.localStorage.getItem(this.config.storageKey);
        const logs = existingLogs ? JSON.parse(existingLogs) : [];
        
        logs.push(...this.logQueue);
        
        // Keep only recent logs
        const recentLogs = logs.slice(-this.config.maxStoredLogs);
        
        window.localStorage.setItem(this.config.storageKey, JSON.stringify(recentLogs));
      }
    } catch (error) {
      // Silently fail if storage is not available
    }

    this.logQueue = [];
  }

  private async sendToAnalytics(entry: LogEntry): Promise<void> {
    try {
      // In a real implementation, this would send to your analytics service
      // For now, we'll just queue it for potential future sending
      if (typeof window !== 'undefined' && 'navigator' in window && 'sendBeacon' in navigator) {
        const payload = JSON.stringify(entry);
        // navigator.sendBeacon('/api/analytics/logs', payload);
      }
    } catch (error) {
      // Silently fail to prevent logging loops
    }
  }

  // Public logging methods
  public debug(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    this.log('debug', message, context, component, action);
  }

  public info(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    this.log('info', message, context, component, action);
  }

  public warn(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    this.log('warn', message, context, component, action);
  }

  public error(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    this.log('error', message, context, component, action);
  }

  public critical(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    this.log('critical', message, context, component, action);
  }

  // Game-specific logging methods
  public logBattleEvent(event: string, context?: Record<string, any>): void {
    this.info(`Battle: ${event}`, context, 'BattleSystem', event);
  }

  public logUserAction(action: string, context?: Record<string, any>): void {
    this.info(`User: ${action}`, context, 'UserInterface', action);
  }

  public logPerformance(metric: string, value: number, context?: Record<string, any>): void {
    this.info(`Performance: ${metric}`, { ...context, value, metric }, 'Performance', metric);
  }

  public logAPICall(endpoint: string, method: string, duration: number, status: number): void {
    const level = status >= 400 ? 'error' : 'info';
    this.log(level, `API: ${method} ${endpoint}`, {
      endpoint,
      method,
      duration,
      status
    }, 'APIClient', `${method}_${endpoint}`);
  }

  // Utility methods
  public getStoredLogs(): LogEntry[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const logs = window.localStorage.getItem(this.config.storageKey);
        return logs ? JSON.parse(logs) : [];
      }
    } catch (error) {
      return [];
    }
    return [];
  }

  public clearLogs(): void {
    this.logQueue = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.config.storageKey);
      }
    } catch (error) {
      // Silently fail
    }
  }

  public setUserId(userId: string): void {
    // Update all future logs with user ID
    this.sessionId = `${userId}_${this.sessionId}`;
  }

  public setLogLevel(level: LogLevel): void {
    this.config.level = level;
  }

  public flush(): void {
    this.flushLogs();
  }
}

// Create singleton instance
const logger = Logger.getInstance();

// Export convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>, component?: string, action?: string) => 
    logger.debug(message, context, component, action),
  
  info: (message: string, context?: Record<string, any>, component?: string, action?: string) => 
    logger.info(message, context, component, action),
  
  warn: (message: string, context?: Record<string, any>, component?: string, action?: string) => 
    logger.warn(message, context, component, action),
  
  error: (message: string, context?: Record<string, any>, component?: string, action?: string) => 
    logger.error(message, context, component, action),
  
  critical: (message: string, context?: Record<string, any>, component?: string, action?: string) => 
    logger.critical(message, context, component, action),

  // Game-specific methods
  battle: (event: string, context?: Record<string, any>) => 
    logger.logBattleEvent(event, context),
  
  user: (action: string, context?: Record<string, any>) => 
    logger.logUserAction(action, context),
  
  performance: (metric: string, value: number, context?: Record<string, any>) => 
    logger.logPerformance(metric, value, context),
  
  api: (endpoint: string, method: string, duration: number, status: number) => 
    logger.logAPICall(endpoint, method, duration, status),

  // Utility methods
  setUserId: (userId: string) => logger.setUserId(userId),
  setLevel: (level: LogLevel) => logger.setLogLevel(level),
  getLogs: () => logger.getStoredLogs(),
  clearLogs: () => logger.clearLogs(),
  flush: () => logger.flush()
};

export { Logger, type LogLevel, type LogEntry };
export default logger;