const models = require('../models');

test('TransactionOutput class', () => {
  const output = new models.TransactionOutput(
    0, 'some_script', 1234, 'some_address',
  );
  expect(output.outputIndex).toBe(0);
  expect(output.scriptPubKey).toBe('some_script');
  expect(output.balance).toBe(1234);
  expect(output.address).toBe('some_address');
});

test('Contribution class', () => {
  const contribution = new models.Contribution('some_hash', 0);
  expect(contribution.txHash).toBe('some_hash');
  expect(contribution.output).toBe(0);
});

describe('Testing Transaction class', () => {
  const outputs = [
    new models.TransactionOutput(1, 'some_script_1', 1234, 'some_address_1'),
    new models.TransactionOutput(2, 'some_script_2', 1234, 'some_address_2'),
  ];
  const transaction = new models.Transaction('some_hash', outputs);

  test('constructor', () => {
    expect(transaction.txHash).toBe('some_hash');
    expect(Object.keys(transaction.outputs)).toHaveLength(2);
    expect(transaction.outputs[1]).toBe(outputs[0]);
    expect(transaction.outputs[2]).toBe(outputs[1]);
  });

  test('getContribution', () => {
    const contribution = transaction.getContribution(1);
    expect(contribution.txHash).toBe('some_hash');
    expect(contribution.output).toBe(outputs[0]);
  });

  test('getContributions', () => {
    const contributions = transaction.getContributions();
    expect(contributions).toHaveLength(2);
    expect(contributions[0].txHash).toBe('some_hash');
    expect(contributions[1].txHash).toBe('some_hash');
    expect(contributions[0].output).toBe(outputs[0]);
    expect(contributions[1].output).toBe(outputs[1]);
  });
});

test('Payment class', () => {
  const payment = new models.Payment('some_address', 10000);
  expect(payment.to).toBe('some_address');
  expect(payment.amount).toBe(10000);
});

describe('ActionLog class', () => {
  const logA = new models.ActionLog('do', 'object');
  const logB = new models.ActionLog('do', 'object', 'result', [logA]);
  const logC = new models.ActionLog('do', 'object', ['result1', 'result2'], logA);

  test('constructor', () => {
    expect(logC.action).toBe('do');
    expect(logC.object).toBe('object');
    expect(logC.log).toBe('do object');
    expect(logC.result).toEqual(['result1', 'result2']);
    expect(logC.subaction).toEqual([logA]);
  });

  test.each([
    [logA, false],
    [logB, true],
    [logC, true],
  ])('hasResult', (log, expected) => {
    expect(log.hasResult()).toBe(expected);
  });

  test.each([
    [logA, false],
    [logB, true],
    [logC, true],
  ])('hasSubaction', (log, expected) => {
    expect(log.hasSubaction()).toBe(expected);
  });
});

test('AppendLog class', () => {
  const log = new models.AppendLog('appendage', 'object', ['some_result']);
  expect(log.to).toBe('object');
  expect(log.from).toBe('appendage');
  expect(log).toBeInstanceOf(models.ActionLog);

  expect(log.action).toBe('Append');
  expect(log.object).toBe('appendage to object');
  expect(log.log).toBe('Append appendage to object');
  expect(log.result).toEqual(['some_result']);
  expect(log.hasSubaction()).toBeFalsy();
});

test('AppendTransactionLog class', () => {
  const mockTransactionDict = {};
  const log = new models.AppendTransactionLog('appendage', 'object', ['some_result'], mockTransactionDict);
  expect(log.to).toBe('transaction::object');
  expect(log.from).toBe('appendage');
  expect(log.transactionDict).toBe(mockTransactionDict);
  expect(log).toBeInstanceOf(models.AppendLog);

  expect(log.action).toBe('Append');
  expect(log.object).toBe('appendage to transaction::object');
  expect(log.log).toBe('Append appendage to transaction::object');
  expect(log.result).toEqual(['transaction::some_result']);
  expect(log.hasSubaction()).toBeFalsy();
});

test('ConversionLog class', () => {
  const log = new models.ConversionLog('orig', 'new', 'some_result');
  expect(log.from).toBe('orig');
  expect(log.to).toBe('new');
  expect(log).toBeInstanceOf(models.ActionLog);

  expect(log.action).toBe('Convert');
  expect(log.object).toBe('orig to new');
  expect(log.log).toBe('Convert orig to new');
  expect(log.result).toEqual(['some_result']);
  expect(log.hasSubaction()).toBeFalsy();
});

test('ReplaceLog class', () => {
  const mockTransactionDict = {};
  const log = new models.ReplaceLog('orig', 'sub', [null], mockTransactionDict);
  expect(log).toBeInstanceOf(models.ActionLog);
  expect(log.transactionDict).toBe(mockTransactionDict);

  expect(log.action).toBe('Replace');
  expect(log.object).toBe('orig with sub');
  expect(log.log).toBe('Replace orig with sub');
  expect(log.result).toEqual([null]);
  expect(log.hasResult()).toBeFalsy();
  expect(log.hasSubaction()).toBeFalsy();
});

describe('OrderedDict class', () => {
  const dict = new models.OrderedDict(['key1', 'key2']);
  dict.vals.key2.push(3);
  dict.vals.key2.push(1);

  test('constructor', () => {
    expect(dict.keys).toEqual(['key1', 'key2']);
    expect(dict.vals).toEqual({
      key1: [],
      key2: [3, 1],
    });
  });
  test('constructor: no keys', () => {
    const noKeyDict = new models.OrderedDict();
    expect(noKeyDict.keys).toEqual([]);
    expect(noKeyDict.vals).toEqual({});
  });
  test('copy', () => {
    expect(models.OrderedDict.copy(dict)).toEqual(dict);
    expect(models.OrderedDict.copy(dict)).not.toBe(dict);
  });
  test('pushTo: key exists', () => {
    const localDict = new models.OrderedDict(['key']);
    localDict.pushTo('key', 1);
    expect(localDict.vals.key).toEqual([1]);
  });
  test('pushTo: key does not exists', () => {
    const localDict = new models.OrderedDict(['key']);
    localDict.pushTo('newkey', 2);
    expect(localDict.vals.newkey).toEqual([2]);
  });
  test('getValue', () => {
    expect(dict.getValue('key1')).toEqual([]);
    expect(dict.getValue('key2')).toEqual([3, 1]);
    expect(dict.getValue('key3')).toBeUndefined();
  });
  test('setValue', () => {
    const localDict = new models.OrderedDict(['key']);
    localDict.setValue('key', [2]);
    localDict.setValue('newkey', [4]);
    expect(localDict.vals.key).toEqual([2]);
    expect(localDict.vals.newkey).toEqual([4]);
  });
  test('getValue', () => {
    expect(dict.getValues()).toEqual([[], [3, 1]]);
  });
  test('getArray: no keys', () => {
    const localDict = new models.OrderedDict([]);
    expect(localDict.getArray()).toEqual([]);
  });
  test('getArray: standard', () => {
    expect(dict.getArray()).toEqual([
      { key: 'key1', value: [] },
      { key: 'key2', value: [3, 1] },
    ]);
  });
  test('getArray: nested dict', () => {
    const localDict = new models.OrderedDict(['key1', 'key2']);
    localDict.vals.key1.push(dict);
    localDict.vals.key2.push(4);
    expect(localDict.getArray()).toEqual([
      {
        key: 'key1',
        value: [[
          { key: 'key1', value: [] },
          { key: 'key2', value: [3, 1] },
        ]],
      },
      { key: 'key2', value: [4] },
    ]);
  });
  test('getKeys, getLength: no keys', () => {
    const localDict = new models.OrderedDict();
    expect(localDict.getKeys()).toEqual([]);
    expect(localDict.getLength()).toBe(0);
  });
  test('getKeys, getLength', () => {
    expect(dict.getKeys()).toEqual(['key1', 'key2']);
    expect(dict.getLength()).toBe(2);
  });
  test('replace: old key does not exist', () => {
    const localDict = new models.OrderedDict();
    expect(localDict.replace('key', 'newkey', 4)).toBeFalsy();
  });
  test('replace', () => {
    const localDict = new models.OrderedDict(['key']);
    expect(localDict.vals.key).toEqual([]);
    expect(localDict.replace('key', 'newkey', [4])).toBeTruthy();
    expect(localDict.vals.key).toBeUndefined();
    expect(localDict.vals.newkey).toEqual([4]);
  });
  test('remove', () => {
    const localDict = new models.OrderedDict(['key1', 'key2', 'key3']);
    localDict.remove('key4');
    expect(localDict.keys).toEqual(['key1', 'key2', 'key3']);
    expect(localDict.vals).toEqual({
      key1: [],
      key2: [],
      key3: [],
    });
    localDict.remove('key2');
    expect(localDict.keys).toEqual(['key1', 'key3']);
    expect(localDict.vals).toEqual({
      key1: [],
      key3: [],
    });
  });
  test('join', () => {
    expect(dict.join()).toBe(',3,1');
    expect(dict.join('z')).toBe('z3,1');
  });
});
