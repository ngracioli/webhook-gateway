export const logger = {
  isEnabled(): boolean {
    // By default, logs are enabled. Set TEST_SILENCE_LOGS='true' to silence logs (useful in tests).
    return process.env.TEST_SILENCE_LOGS !== 'true';
  },
  log(...args: unknown[]) {
    if (this.isEnabled()) console.log(...args);
  },
  info(...args: unknown[]) {
    if (this.isEnabled()) console.info(...args);
  },
  debug(...args: unknown[]) {
    if (this.isEnabled()) console.debug(...args);
  },
  warn(...args: unknown[]) {
    if (this.isEnabled()) console.warn(...args);
  },
  error(...args: unknown[]) {
    if (this.isEnabled()) console.error(...args);
  },
};

export default logger;
