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
 * @param {number|string} value
 * @param {'satoshi'|'mbtc'|'btc'} convertFrom
 * @returns {number|string}
 * @throws {CurrencyConversionError}
 */
function convertCurrencyToSatoshi(value, convertFrom) {
  switch (convertFrom.toUpperCase()) {
    case 'SATOSHI':
      return value;
    case 'MBTC':
      return (value * 100000);
    case 'BTC':
      return (value * 100000000);
    default:
      throw new CurrencyConversionError(`Unsupported conversion origin format: ${convertFrom}.`);
  }
}

/**
 *
 * @param {number|string} value
 * @param {'satoshi'|'mbtc'|'btc'} convertTo
 * @param {'satoshi'|'mbtc'|'btc'} convertFrom
 * @returns {number|string}
 * @throws {CurrencyConversionError}
 */
function convertCurrencyTo(value, convertTo, convertFrom = 'satoshi') {
  const pvalue = convertCurrencyToSatoshi(value, convertFrom);
  switch (convertTo.toUpperCase()) {
    case 'SATOSHI':
      return pvalue;
    case 'MBTC':
      return (pvalue / 100000).toFixed(5);
    case 'BTC':
      return (pvalue / 100000000).toFixed(8);
    default:
      throw new CurrencyConversionError(`Unsupported conversion destination format: ${convertTo}.`);
  }
}

module.exports = {
  convertCurrencyTo,
  CurrencyConversionError,
  convertCurrencyToSatoshi,
};
