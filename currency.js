class CurrencyConversionError extends Error {
  /**
   *
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'CurrencyConversionError';
    this.message = message;
  }
}

/**
 *
 * @param {number} bytes
 * @returns {number}
 */
function formatFee(bytes) {
  return (bytes * 1000) / bytes;
}

/**
 *
 * @param {number} value
 * @param {'satoshi'|'mbtc'|'btc'} convertFrom
 * @returns {number}
 * @throws {CurrencyConversionError}
 */
function convertCurrencyToSatoshi(value, convertFrom) {
  switch (convertFrom.toLowerCase()) {
    case 'satoshi':
      return value;
    case 'mbtc':
      return (value * 100000);
    case 'btc':
      return (value * 100000000);
    default:
      throw new CurrencyConversionError(`Unsupported conversion origin format: ${convertFrom}.`);
  }
}

/**
 *
 * @param {number} value
 * @param {'satoshi'|'mbtc'|'btc'} convertTo
 * @param {'satoshi'|'mbtc'|'btc'} convertFrom
 * @returns {number}
 * @throws {CurrencyConversionError}
 */
function convertCurrencyTo(value, convertTo, convertFrom = 'satoshi') {
  const pvalue = convertCurrencyToSatoshi(value, convertFrom);
  switch (convertTo.toLowerCase()) {
    case 'satoshi':
      return pvalue;
    case 'mbtc':
      return (pvalue / 100000).toFixed(5);
    case 'btc':
      return (pvalue / 100000000).toFixed(8);
    default:
      throw new CurrencyConversionError(`Unsupported conversion destination format: ${convertTo}.`);
  }
}

module.exports = {
  formatFee,
  convertCurrencyTo,
  CurrencyConversionError,
  convertCurrencyToSatoshi,
};
