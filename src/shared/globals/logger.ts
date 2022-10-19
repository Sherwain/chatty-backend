import bunyan from "bunyan";
import Logger from "bunyan";

export default (function (name: string) {
  let logger: Logger;

  function createInstance(name: string): Logger {
    const log: Logger = bunyan.createLogger({ name, level: "debug" });
    log.info("Creating instance of logger");
    return log;
  }

  return {
    getInstance: function (name: string): Logger {
      if (!logger) {
        logger = createInstance(name);
      }
      return logger;
    },
  };
})("");
