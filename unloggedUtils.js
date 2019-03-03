class CurrencyConversionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CurrencyConversionError';
    this.message = message;
  }
}

class UnsupportedScriptFormat extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnsupportedScriptFormat';
    this.message = message;
  }
}

class InvalidScriptFormat extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidScriptFormat';
    this.message = message;
  }
}

function formatFee(bytes) {
  return (bytes * 1000) / bytes;
}

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

function getScriptFormat(script) {
  const pscript = script.toUpperCase();
  if (pscript.startsWith('76A914') && pscript.endsWith('88AC') && /^[0-9A-F]+$/.test(pscript)) {
    return 'pay-to-pubkey-hash';
  }
  throw new InvalidScriptFormat('Invalid or unsupported script format. Please use pay-to-pubkey-hash.');
}

module.exports = {
  formatFee,
  convertCurrencyTo,
  CurrencyConversionError,
  convertCurrencyToSatoshi,
  UnsupportedScriptFormat,
  getScriptFormat,
  InvalidScriptFormat,
};
