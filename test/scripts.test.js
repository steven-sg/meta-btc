const scripts = require('../scripts');

test('InvalidScriptFormat error', () => {
  const error = new scripts.InvalidScriptFormat('some_message');
  expect(error.name).toBe('InvalidScriptFormat');
  expect(error.message).toBe('some_message');
  expect(error).toBeInstanceOf(Error);
});

describe('getScriptFormat function', () => {
  test('pay-to-pubkey-hash', () => {
    expect(
      scripts.getScriptFormat('76a914328dbf4cbeacc2898f096ffce5f9dcd27b53e5cc88ac'),
    ).toBe('pay-to-pubkey-hash');
  });
  test('pay-to-script-hash', () => {
    expect(
      scripts.getScriptFormat('a91415fa5e840e361b746be1074acd950ba8aebb39af87'),
    ).toBe('pay-to-script-hash');
  });

  test.each([
    ['6a914328dbf4cbeacc2898f096ffce5f9dcd27b53e5cc88ac'],
    ['76a914328dbf4cbeacc2898f096ffce5f9dcd27b53e5cc88a'],
    ['76a914328dbf4cbeacc2898fg96ffce5f9dcd27b53e5cc88ac'],
    ['91415fa5e840e361b746be1074acd950ba8aebb39af87'],
    ['a91415fa5e840e361b746be1074acd950ba8aebb39af8'],
    ['a91415fa5e840e361b746be1g74acd950ba8aebb39af87'],
  ])('getScriptFormat function', (script) => {
    function getScriptFormat() {
      scripts.getScriptFormat(script);
    }
    expect(
      getScriptFormat,
    ).toThrowError(new scripts.InvalidScriptFormat('Invalid or unsupported script format.'));
  });
});
