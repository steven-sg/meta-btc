const utils = require('./utils');
const { log } = require('./logger');
const { ActionLog } = require('./model/transaction');

class InvalidScriptFormat extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidScriptFormat';
    this.message = message;
  }
}

class P2PKH {
  static createScript(recipientAddress, logger) {
    const decodedAddress = utils.b58decode(recipientAddress, logger);
    // Remove checksum and network bytes
    const pubKeyHash = utils.stripAddress(decodedAddress, logger);

    const OP_DUP = 118;
    const OP_HASH160 = 169;
    const bytesToPush = 14;
    const OP_EQUALVERIFY = 136;
    const OP_CHECKSIG = 172;

    const script = [
      OP_DUP.toString(16),
      OP_HASH160.toString(16),
      bytesToPush,
      pubKeyHash,
      OP_EQUALVERIFY.toString(16),
      OP_CHECKSIG.toString(16),
    ].join('');

    if (logger) {
      log(logger, new ActionLog(
        'Create',
        `P2PKH script: OP_DUP OP_HASH160 bytes_to_push ${pubKeyHash} OP_EQUALVERIFY OP_CHECKSIG`,
        `${script}`,
      ));
    }

    return script;
  }
}

class P2SH {
  static createScript(p2shAddress, logger) {
    const hexStr = utils.b58decode(p2shAddress, logger);
    const stripped = utils.stripAddress(hexStr, logger);

    const OP_HASH160 = 'a9';
    const bytesToPush = '14';
    const OP_EQUAL = '87';
    const script = `${OP_HASH160}${bytesToPush}${stripped}${OP_EQUAL}`;
    if (logger) {
      log(logger, new ActionLog(
        'Create',
        `P2SH script: OP_HASH160 bytes_to_push ${stripped} OP_EQUAL`,
        `${script}`,
      ));
    }

    return script;
  }
}

function getScriptFormat(script) {
  const pscript = script.toUpperCase();
  if (pscript.startsWith('76A914') && pscript.endsWith('88AC') && utils.isHexString(script)) {
    return 'pay-to-pubkey-hash';
  } if (pscript.startsWith('A914') && pscript.endsWith('87') && utils.isHexString(script)) {
    return 'pay-to-script-hash';
  }
  throw new InvalidScriptFormat('Invalid or unsupported script format.');
}

function createScript(address, logger) {
  const format = utils.getAddressFormat(address);
  switch (format.toUpperCase()) {
    case 'P2PKH': return P2PKH.createScript(address, logger);
    case 'P2SH': return P2SH.createScript(address, logger);
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
