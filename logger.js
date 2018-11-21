const { OrderedDict } = require('./dataStructures');

function log(logger, arg) {
  if (Array.isArray(logger)) {
    logger.push(arg);
  } else if (logger instanceof OrderedDict) {
    const key = arg[0];
    const param = arg[1];
    logger.pushTo(key, param);
  }
}

module.exports = {
  log,
};
