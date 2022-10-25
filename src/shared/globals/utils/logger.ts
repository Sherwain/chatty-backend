import bunyan from "bunyan";
import Logger from "bunyan";

interface ILogger {
  [name: string]: Logger;
}

export default (function (name: string) {
  let logger: Logger;
  let loggers: ILogger = {};

  function createInstance(name: string): Logger {
    const log: Logger = bunyan.createLogger({ name, level: "debug" });
    loggers[name] = log;
    log.info("Creating instance of logger for", name);
    return log;
  }

  return {
    getInstance: function (name: string): Logger {
      if (name in loggers) {
        return loggers[name];
      }
      return createInstance(name);
    },
  };
})("");
