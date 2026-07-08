import log4js from 'log4js';
const { warn, error } = $config.log;

const maxLogSize = Math.pow(1024, 2) * 5;

log4js.configure({
  appenders: {
    errorLogs: {
      type: 'file',
      filename: './log/error.log',
      maxLogSize,
      keepFileExt: true
    },
    warnLogs: {
      type: 'file',
      filename: './log/warn.log',
      maxLogSize,
      keepFileExt: true
    },
    console: { type: 'console' }
  },
  categories: {
    warn: { appenders: warn, level: 'warn' },
    error: { appenders: error, level: 'error', enableCallStack: true },
    default: { appenders: ['console'], level: 'trace' }
  }
});

class Log {
  constructor() {
    this.logger = log4js.getLogger();
    this.warnLogger = log4js.getLogger('warn');
    this.errorLogger = log4js.getLogger('error');
  }
  info(...arg) {
    this.logger.info(...arg);
  }
  warn(data, ...arg) {
    this.warnLogger.warn(data, ...arg);
  }
  error(err, ...arg) {
    this.errorLogger.error(err, ...arg);
  }
  fatal(err, ...arg) {
    this.errorLogger.fatal(err, ...arg);
  }
}

export default new Log();
