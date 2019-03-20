const logger = require('../logger');
const { OrderedDict } = require('../models');

describe('log function', () => {
  test('array logger', () => {
    const arr = ['some_log'];
    logger.log(arr, 'some_other_log');
    expect(arr).toEqual(['some_log', 'some_other_log']);
  });

  test('OrderedDict logger', () => {
    const dict = new OrderedDict(['some_key']);
    logger.log(dict, ['some_key', 'some_log']);
    expect(dict.getValue('some_key')).toEqual(['some_log']);
  });
});
