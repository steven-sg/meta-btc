const fees = require('../fees');
const { getSampleModularTransaction } = require('./test_utils');

const sampleModularTransaction = getSampleModularTransaction();

describe('test formatSize', () => {
  test.each([
    [1.2],
    [0],
    [-53212],
  ])('format: byte', (input) => {
    expect(fees.formatSize(input, 'byte')).toBe(input);
  });

  test.each([
    [1.2],
    [0],
    [-53212],
  ])('format: bytes', (input) => {
    expect(fees.formatSize(input, 'bytes')).toBe(input);
  });

  test.each([
    [1.2, 0.0012],
    [0, 0],
    [-53212, -53.212],
  ])('format: kB', (input, expected) => {
    expect(fees.formatSize(input, 'kB')).toBe(expected);
  });
});

describe('test getFeeRate', () => {
  test.each([
    [0, 0],
    [1, 0.005235602094240838],
    [342, 1.7905759162303665],
    [-532, -2.7853403141361257],
  ])('format: byte', (fee, expected) => {
    expect(
      fees.getFeeRate(sampleModularTransaction, fee, 'byte'),
    ).toBe(expected);
  });

  test.each([
    [0, 0],
    [1, 0.005235602094240838],
    [342, 1.7905759162303665],
    [-532, -2.7853403141361257],
  ])('format: bytes', (fee, expected) => {
    expect(
      fees.getFeeRate(sampleModularTransaction, fee, 'bytes'),
    ).toBe(expected);
  });

  test.each([
    [0, 0],
    [1, 5.2356020942408374],
    [342, 1790.5759162303664],
    [-532, -2785.3403141361255],
  ])('format: kb', (fee, expected) => {
    expect(
      fees.getFeeRate(sampleModularTransaction, fee, 'kb'),
    ).toBe(expected);
  });
});

describe('test getTotalFees', () => {
  test.each([
    [0, 0],
    [1, 191],
    [342, 65322],
    [-532, -101612],
  ])('format: byte', (fee, expected) => {
    expect(
      fees.getTotalFees(sampleModularTransaction, fee, 'byte'),
    ).toBe(expected);
  });

  test.each([
    [0, 0],
    [1, 191],
    [342, 65322],
    [-532, -101612],
  ])('format: bytes', (fee, expected) => {
    expect(
      fees.getTotalFees(sampleModularTransaction, fee, 'bytes'),
    ).toBe(expected);
  });

  test.each([
    [0, 0],
    [1, 0.191],
    [342, 65.322],
    [-532, -101.612],
  ])('format: kb', (fee, expected) => {
    expect(
      fees.getTotalFees(sampleModularTransaction, fee, 'kb'),
    ).toBe(expected);
  });
});

test.each([
  [1000, 2000, -1000],
  [2000, 1000, 1000],
  [0, 0, 0],
])('testing calculateChangePayment', (balance, fee, expected) => {
  const payment = fees.calculateChangePayment(balance, fee, 'some_address');
  expect(payment.to).toBe('some_address');
  expect(payment.amount).toBe(expected);
});
