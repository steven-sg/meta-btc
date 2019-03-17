const { OrderedDict } = require('./models');

/**
 *
 * @param {Array|OrderedDict} logger
 * @param {*|Object} arg
 */
function log(logger, arg) {
  if (Array.isArray(logger)) {
    logger.push(arg);
  } else if (logger instanceof OrderedDict) {
    const key = arg[0];
    const param = arg[1];
    logger.pushTo(key, param);
  } else {
    // TODO: this should throw an error but we need to catch this in frontend
  }
}

module.exports = {
  log,
};
