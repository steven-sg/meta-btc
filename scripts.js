const utils = require('./utils');

class p2pkh {
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

module.exports = {
  p2pkh,
};
