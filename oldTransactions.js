const forge = require('node-forge');
const base58 = require('bs58');
const { Buffer } = require('buffer/');
const { ec } = require('elliptic/');
const BN = require('bn.js');

const ecdsa = new ec('secp256k1');

const N = new BN('115792089237316195423570985008687907852837564279074904382605163141518161494337')

function UnsupportedActionException(message) {
  this.message = message;
  this.meta = 'USAGE NOT SUPPORTED EXCEPTION';
  this.toString = () => {
    return `${this.meta}: ${this.message}`;
  };
}

/**
 * Returns the byte length of the string
 * @param {string} string
 * @returns {number}
 */
function getByteLength(string) {
  return Buffer.byteLength(string, 'hex');
}

/**
 * Converts a positive integer to little endian.
 * Only numbers less than 32 bits unsigned are supported.
 * @param {number} number
 * @returns {string} - 4 byte hex representation
 */
function convertIntegerToLittleEndian(number, bytes) {
  if (bytes !== 4 && bytes !== 8) {
    throw new UnsupportedActionException('only 4 byte/ 8 byte conversion supported');
  }
  const buff = Buffer.alloc(bytes);
  buff.writeUIntBE(number, 0, bytes);

  if (bytes === 4) buff.swap32();
  else buff.swap64();

  return buff.toString('hex');
}

function reverseBytes(hexString) {
  return hexString.match(/.{2}/g).reverse().join('');
}

function hexSHA256(hexString) {
  const md = forge.md.sha256.create();
  md.update(forge.util.hexToBytes(hexString));
  return md.digest().toHex();
}

function makeRawTransactions(
  transactionAmount,
  transactionHash,
  transactionIndex,
  scriptPubKey,
  outputScript,
) {
  return [
    '01000000', // Add 4 byte version code
    '01', // Add 1 byte input count
    reverseBytes(transactionHash), // Add 32 byte redeemable transaction hash
    convertIntegerToLittleEndian(transactionIndex, 4), // Add 4 byte hash output index
    getByteLength(scriptPubKey).toString(16), // Add scriptSig length, TEMPORARILY filled with input transaction scriptPubKey length
    scriptPubKey, // Add scriptSig, TEMPORARILY filled with input transaction scriptPubKey
    'ffffffff', // Sequence
    '01', // Add 1 byte output count, ?????
    convertIntegerToLittleEndian(transactionAmount, 8), // Add 8 byte transaction amount, redeemable - transaction amount = fee
    getByteLength(outputScript).toString(16), // Add outputScript length: future redeemable script
    outputScript, // Add outputScript: future redeemable script
    '00000000', // Add 4 byte lock time field
    '01000000', // Add 4 byte hash code type
  ];
}

function signTransaction(transactionArray, privateKey) {
  const transaction = transactionArray.join('');
  const doubleHashedTx = hexSHA256(hexSHA256(transaction));

  // expecting private key to be in format wif compressed
  // trimming first bytes, last 4 bytes and then trimmming to length 32
  const hexPriv = base58.decode(privateKey).toString('hex', 1, 33);
  const keypair = ecdsa.keyFromPrivate(hexPriv);
  let signedTx = keypair.sign(doubleHashedTx);

  // https://github.com/vbuterin/pybitcointools/issues/89
  if (signedTx.s.gt(N.div(new BN('2')))) {
    signedTx.s = N.sub(signedTx.s);
  }
  const signedTxDER = signedTx.toDER();
  // append one byte hash code
  const txHEX = `${Buffer.from(signedTxDER).toString('hex')}01`;
  // todo: compress
  const publicKey = keypair.getPublic().encode('hex');

  const scriptSig = [
    (getByteLength(txHEX)).toString(16), // length txHEX + 1 byte hash code type
    txHEX, // double hashed exit
    (getByteLength(publicKey)).toString(16),
    publicKey,
  ].join('');

  const slicedArray = transactionArray.slice(0, -1);
  slicedArray[4] = (getByteLength(scriptSig)).toString(16);
  slicedArray[5] = scriptSig;
  return slicedArray;
}

function decodeScript(my_string) {
  const script_length = my_string.substring(0,2);
  const script = my_string.substring(2, 2+parseInt(script_length, 16)*2);
  const pub_length = my_string.substring(2+parseInt(script_length, 16)*2, 4+parseInt(script_length, 16)*2);
  const pub = my_string.substring(4+parseInt(script_length, 16)*2);
  return [
    script_length,
    script,
    pub_length,
    pub
  ];
}

class p2pkh {
  static createScript(recipientAddress) {
    const decodedAddress = base58.decode(recipientAddress).toString('hex');
    // Remove checksum and network bytes
    const pubKeyHash = decodedAddress.slice(2, -8);

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
  makeRaw: makeRawTransactions,
  signTran: signTransaction,
  p2pkh: p2pkh,
  decodeScript: decodeScript,
};
