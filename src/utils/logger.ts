// Logger utility to control console logs in production
const isDevelopment = import.meta.env.DEV;
const ENABLE_VERBOSE_LOGS = false; // Set to true to enable all logs

export const logger = {
  // Critical errors - always show
  error: (...args: any[]) => {
    console.error(...args);
  },

  // Warnings - always show
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  // Info logs - only in development with verbose enabled
  info: (...args: any[]) => {
    if (isDevelopment && ENABLE_VERBOSE_LOGS) {
      console.log(...args);
    }
  },

  // Debug logs - only with verbose enabled
  debug: (...args: any[]) => {
    if (ENABLE_VERBOSE_LOGS) {
      console.log(...args);
    }
  },

  // Success logs - minimal
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
};

export default logger;

