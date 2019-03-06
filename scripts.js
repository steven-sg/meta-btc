const utils = require('./utils');

class InvalidScriptFormat extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidScriptFormat';
    this.message = message;
  }
}

class P2PKH {
  static createScript(recipientAddress) {
    const decodedAddress = utils.b58decode(recipientAddress);
    // Remove checksum and network bytes
    const pubKeyHash = utils.stripAddress(decodedAddress);

    const OP_DUP = 118;
    const OP_HASH160 = 169;
    // const bytesToPush = getByteLength(pubKeyHash).toString(16);
    const bytesToPush = 14;
    const OP_EQUALVERIFY = 136;
    const OP_CHECKSIG = 172;

    return [
      OP_DUP.toString(16),
      OP_HASH160.toString(16),
      bytesToPush,
      pubKeyHash,
      OP_EQUALVERIFY.toString(16),
      OP_CHECKSIG.toString(16),
    ].join('');
  }
}

class P2SH {
  static createScript(p2shAddress) {
    const hexStr = utils.b58decode(p2shAddress);
    const stripped = utils.stripAddress(hexStr);
    return `a914${stripped}87`;
  }
}

function getScriptFormat(script) {
  const pscript = script.toUpperCase();
  if (pscript.startsWith('76A914') && pscript.endsWith('88AC')) {
    return 'pay-to-pubkey-hash';
  } if (pscript.startsWith('A914') && pscript.endsWith('87')) {
    return 'pay-to-script-hash';
  }
  throw new InvalidScriptFormat('Invalid or unsupported script format. Please use pay-to-pubkey-hash.');
}

function createScript(address) {
  const format = utils.getAddressFormat(address);
  switch (format.toUpperCase()) {
    case 'P2PKH': return P2PKH.createScript(address);
    case 'P2SH': return P2SH.createScript(address);
    default:
      throw new Error('Invalid address format.');
  }
}

// TODO: change to upper case
module.exports = {
  p2pkh: P2PKH,
  P2SH,
  createScript,
  getScriptFormat,
};
