const currency = require('../currency');

describe('CurrencyConversionError', () => {
  const obj = new currency.CurrencyConversionError(
    'some_message',
  );

  test('constructor', () => {
    expect(obj.name).toBe('CurrencyConversionError');
    expect(obj.message).toBe('some_message');
  });

  test('parent class', () => {
    expect(obj).toBeInstanceOf(Error);
  });
});

describe('convertCurrencyToSatoshi', () => {
  test.each([
    [0, 0],
    [5678, 5678],
    [-5678, -5678],
  ])(
    'convert from satoshi', (input, expected) => {
      expect(currency.convertCurrencyToSatoshi(input, 'satoshi')).toBe(expected);
    },
  );
  test.each([
    [0, 0],
    [4321, 432100000],
    [-4321, -432100000],
  ])(
    'convert from mbtc', (input, expected) => {
      expect(currency.convertCurrencyToSatoshi(input, 'mbtc')).toBe(expected);
    },
  );
  test.each([
    [0, 0],
    [1234, 123400000000],
    [-1234, -123400000000],
  ])(
    'convert from btc', (input, expected) => {
      expect(currency.convertCurrencyToSatoshi(input, 'btc')).toBe(expected);
    },
  );

  function convertFromEuros() {
    currency.convertCurrencyToSatoshi(1234, 'euro');
  }
  test('convert from euros', () => {
    expect(convertFromEuros).toThrowError(
      new currency.CurrencyConversionError('Unsupported conversion origin format: euro.'),
    );
  });
});

describe('convertCurrencyTo x from satoshi', () => {
  test.each([
    [0, 0],
    [5678, 5678],
    [-5678, -5678],
  ])(
    'convert from satoshi to satoshi', (input, expected) => {
      expect(currency.convertCurrencyTo(input, 'satoshi', 'satoshi')).toBe(expected);
    },
  );
  test.each([
    [0, '0.00000'],
    [5678, '0.05678'],
    [-5678, '-0.05678'],
  ])(
    'convert from satoshi to mbtc', (input, expected) => {
      expect(currency.convertCurrencyTo(input, 'mbtc', 'satoshi')).toBe(expected);
    },
  );
  test.each([
    [0, '0.00000000'],
    [5678, '0.00005678'],
    [-5678, '-0.00005678'],
  ])(
    'convert from satoshi to btc', (input, expected) => {
      expect(currency.convertCurrencyTo(input, 'btc', 'satoshi')).toBe(expected);
    },
  );
});

describe('convertCurrencyTo x from mbtc', () => {
  test.each([
    [0, 0],
    [1234, 123400000],
    [-1234, -123400000],
  ])(
    'convert from mbtc to satoshi', (input, expected) => {
      expect(currency.convertCurrencyTo(input, 'satoshi', 'mbtc')).toBe(expected);
    },
  );
  test.each([
    [0, '0.00000'],
    [1234, '1234.00000'],
    [-1234, '-1234.00000'],
  ])(
    'convert from mbtc to mbtc', (input, expected) => {
      expect(currency.convertCurrencyTo(input, 'mbtc', 'mbtc')).toBe(expected);
    },
  );
  test.each([
    [0, '0.00000000'],
    [1234, '1.23400000'],
    [-1234, '-1.23400000'],
  ])(
    'convert from mbtc to btc', (input, expected) => {
      expect(currency.convertCurrencyTo(input, 'btc', 'mbtc')).toBe(expected);
    },
  );
});

describe('convertCurrencyTo x from btc', () => {
  test.each([
    [0, 0],
    [4567, 456700000000],
    [-4567, -456700000000],
  ])(
    'convert from btc to satoshi', (input, expected) => {
      expect(currency.convertCurrencyTo(input, 'satoshi', 'btc')).toBe(expected);
    },
  );
  test.each([
    [0, '0.00000'],
    [4567, '4567000.00000'],
    [-4567, '-4567000.00000'],
  ])(
    'convert from btc to mbtc', (input, expected) => {
      expect(currency.convertCurrencyTo(input, 'mbtc', 'btc')).toBe(expected);
    },
  );
  test.each([
    [0, '0.00000000'],
    [4567, '4567.00000000'],
    [-4567, '-4567.00000000'],
  ])(
    'convert from btc to btc', (input, expected) => {
      expect(currency.convertCurrencyTo(input, 'btc', 'btc')).toBe(expected);
    },
  );
});

test('convertCurrencyTo: default conversion origin', () => {
  expect(currency.convertCurrencyTo('9876', 'btc')).toBe('0.00009876');
});

function convertToUSD() {
  currency.convertCurrencyTo(1234, 'usd');
}
test('convertCurrencyTo: unsupported conversion', () => {
  expect(convertToUSD).toThrowError(
    new currency.CurrencyConversionError('Unsupported conversion destination format: usd.'),
  );
});
