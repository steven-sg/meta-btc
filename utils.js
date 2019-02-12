// function getPubKeyFormat
// function decodePubKey
// function encodePubKey
// function getPrivKeyFormat
// function decodePrivKey
// function encodePrivKey
const base58 = require('bs58');
const { Buffer } = require('buffer/');
const { ec } = require('elliptic/');
const forge = require('node-forge');
const SafeBuffer = require('safe-buffer').Buffer;
const ecdsa = new ec('secp256k1');
const RIPEMD160 = require('ripemd160')
const { log } = require('./logger');
const { OrderedDict } = require('./dataStructures');

class InvalidInputFormat extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidInputFormat';
    this.message = message;
  }
}

class ArrayObject {
  constructor(array = []) {
    this.array = array;
  }

  join(delimiter = ',') {
    return this.array.join(delimiter);
  }
}

class Tuple {
  constructor(...args) {
    this.data = [];
    for (let i = 0; i < args.length; i += 1) {
      this.data.push(args[i]);
    }
  }

  getValues() {
    return this.data;
  }
}

function isHexString(str) {
  return /^[0-9A-F]*$/i.test(str);
}

function isDecimalString(str) {
  // return !isNaN(str);
  return !Number.isNaN(Number(str));
}

function isAlphaNumeric(str) {
  return /^[0-9A-Z]*$/i.test(str);
}

function isIterable(structure) {
  if (Array.isArray(structure)) {
    return true;
  }
  return false;
}

function joinArray(array, arrayObject = new ArrayObject()) {
  if (array instanceof OrderedDict) {
    array.getKeys().forEach((key) => {
      joinArray(array.getValue(key), arrayObject);
    });
  } else if (Array.isArray(array)) {
    array.forEach((item) => {
      joinArray(item, arrayObject);
    });
  } else if (array instanceof Tuple) {
    arrayObject.array.push(array.getValues());
  } else {
    arrayObject.array.push(array);
  }
  return arrayObject;
}

function sha256(hexString, logger, xTemplate = {}) {
  const md = forge.md.sha256.create();
  md.update(forge.util.hexToBytes(hexString));
  const hexDigest = md.digest().toHex();
  // logging
  if (logger) {
    log(logger, new Tuple(
      `SHA256 hash ${xTemplate.hexString || hexString}`,
      `${hexDigest}`,
    ));
  }
  // continuation
  return hexDigest;
}

function ripemd160(hexString) {
  return new RIPEMD160().update(hexString, 'hex').digest('hex');
}

function hash160(hexString) {
  const hashStr = sha256(hexString);
  return ripemd160(hashStr);
}
function convertToLittleEndian(hexString, logger, xTemplate = {}) {
  // logic
  const hexedLE = hexString.match(/.{2}/g).reverse().join('');
  // logging
  if (logger) {
    log(logger, new Tuple(
      `Convert ${xTemplate.hexString || hexString} to little endian`,
      `${hexedLE}`,
    ));
  }
  // continuation
  return hexedLE;
}

function convertIntegerToBytes(integer, bytes, logger, xTemplate = {}) {
  const buff = Buffer.alloc(bytes);
  buff.writeUIntBE(integer, 0, bytes);
  const hexedInteger = buff.toString('hex');
  // logging
  if (logger) {
    log(logger, new Tuple(
      `Convert ${xTemplate.integer || integer} to ${bytes} bytes hex`,
      `${hexedInteger}`,
    ));
  }
  // continuation
  return hexedInteger;
}

function convertIntegerToLittleEndian(integer, bytes, logger, xTemplate = {}) {
  const hexedInteger = convertIntegerToBytes(integer, bytes, logger, xTemplate);
  return convertToLittleEndian(hexedInteger, logger, xTemplate);
}

/**
 * Returns the byte length of the string
 * @param {string} string
 * @returns {number}
 */
function getByteLength(string, logger, xTemplate = {}) {
  // logic
  const byteLength = Buffer.byteLength(string, 'hex');
  // logging
  if (logger) {
    log(logger, new Tuple(
      `Get byte length of ${xTemplate.string || string}`,
      `${byteLength}`,
    ));
  }
  // continuation
  return byteLength;
}

function getByteLengthInBytes(string, logger, xTemplate = {}) {
  const byteLength = getByteLength(string, logger, xTemplate);
  return convertIntegerToBytes(byteLength, 1, logger, xTemplate);
}

function b58decode(string, logger, xTemplate = {}) {
  const decodedString = base58.decode(string).toString('hex');
  // logging
  if (logger) {
    log(logger, new Tuple(
      `Base58 decode ${xTemplate.string || string}`,
      `${decodedString}`,
    ));
  }
  // continuation
  return decodedString;
}

function b58encode(string) {
  return base58.encode(SafeBuffer.from(string, 'hex'), 'hex');
}

function stripAddress(address, logger) {
  const strippedAddress = address.slice(2, -8);
  // logging
  if (logger) {
    log(logger, new Tuple(
      'Remove network bytes and checksum',
      strippedAddress,
    ));
  }
  // continuation
  return strippedAddress;
}

function decodePrivKey(privateKey, logger, xTemplate = {}) {
  // Account for other key types
  // if wif:
  const decodedPriv = b58decode(privateKey, logger, xTemplate);
  // todo rename stripAddress
  // const hexPriv = stripAddress(decodedPriv, logger, xTemplate);
  // todo why is the above line wrong?
  const hexPriv = decodedPriv.slice(2, 66);
  return hexPriv;
}

function ecdsaFromPriv(privateKey, logger) {
  const hexPriv = decodePrivKey(privateKey, logger, { string: 'private key' });
  return ecdsa.keyFromPrivate(hexPriv);
}

function encodePub(publicKey, logger) {
  // ASSUMES PUBLIC KEY IS IN HEX FOR NOW
  // ONLY ENCODE HEX TO HEX COMPRESSED

  // GET RID OF FIRST BYTE PREFIX
  // TODO ADD LOGGER LOGIC
  const strippedPub = publicKey.slice(2);

  const hexSegmentA = strippedPub.slice(0, 64);
  const hexSegmentB = strippedPub.slice(64, 128);

  const bModulo = parseInt(hexSegmentB.slice(-1), 16) % 2;
  const prefix = `0${bModulo + 2}`;
  const compressedHex = prefix + hexSegmentA;

  if (logger) {
    log(logger, ['Encoding public key as compressed hex']);
    log(logger, new Tuple(
      'Strip public key',
      strippedPub,
    ));
    log(logger, new Tuple(
      'Segment stripped key',
      `A:${hexSegmentA}, B:${hexSegmentB}`,
    ));
    log(logger, new Tuple(
      'Modulo Segment B value by 2',
      bModulo,
    ));
    log(logger, new Tuple(
      'Create byte prefix from adding value 2 to the modulo and appending 0 to the start',
      prefix,
    ));
    log(logger, new Tuple(
      'Combine the prefix with Segment A',
      compressedHex,
    ));
  }

  return compressedHex;
}

function getPrivateKeyFormat(key) {
  // TODO why is compressed longer than non compressed
  if (isDecimalString(key)) {
    return 'decimal';
  } if (key.length === 64 && isHexString(key)) {
    return 'hex';
  } if (key.length === 66 && isHexString(key)) {
    return 'hex_compressed';
  } if (key.length === 51 && isAlphaNumeric(key)) {
    return 'wif';
  } if (key.length === 52 && isAlphaNumeric(key)) {
    return 'wif_compressed';
  }
  throw new InvalidInputFormat();
}

function getWifNetwork(key) {
  const ikey = key.toLowerCase();
  if (ikey.startsWith('5')
      || ikey.startsWith('k')
      || ikey.startsWith('l')) {
    return 'mainnet';
  } if (ikey.startsWith('9')
      || ikey.startsWith('c')) {
    return 'testnet';
  }
  throw new InvalidInputFormat();
}

function getAddressFormat(address) {
  if (address.startsWith('1')
      || address.startsWith('m')
      || address.startsWith('n')) {
    return 'p2pkh';
  } if (address.startsWith('3')
        || address.startsWith('2')) {
    return 'p2sh';
  }
  throw new InvalidInputFormat(`${address} does not adhere to any known format.`);
}

function getAddressNetwork(address) {
  if (address.startsWith('1')
      || address.startsWith('3')) {
    return 'mainnet';
  } if (address.startsWith('m')
        || address.startsWith('n')
        || address.startsWith('2')) {
    return 'testnet';
  }
  throw new InvalidInputFormat(`${address} does not adhere to any known format.`);
}

function networkPrependDoubleHashChecksumAppendBase58(key, networkPrefix) {
  let networkAwareKey = networkPrefix + key;

  const hashed = sha256(networkAwareKey);
  const doubleHashed = sha256(hashed);
  const checkSum = doubleHashed.substring(0, 8);

  networkAwareKey += checkSum;
  return b58encode(networkAwareKey);
}

function getAddressPrefix(encoding, type = 'p2pkh', network = 'mainnet') {
  const prefixes = {
    p2pkh: {
      decimal: {
        mainnet: '0',
        testnet: '111',
      },
      hex: {
        mainnet: '00',
        testnet: '6f',
      },
    },
    p2sh: {
      decimal: {
        mainnet: '5',
        testnet: '196',
      },
      hex: {
        mainnet: '05',
        testnet: 'c4',
      },
    },
  };
  const keyType = prefixes[type] || {};
  const encodingType = keyType[encoding] || {};
  if (encodingType[network]) {
    return encodingType[network];
  }
  throw new InvalidInputFormat('Unrecognised argument(s).');
}

function privToPub(priv) {
  const keypair = ecdsaFromPriv(priv);
  return encodePub(keypair.getPublic().encode('hex'));
}

function pubToAddress(pub, network = 'mainnet') {
  // assumes pub is hex
  const networkPrefix = getAddressPrefix('hex', 'p2pkh', network);
  const hashedPub = hash160(pub);
  return networkPrependDoubleHashChecksumAppendBase58(hashedPub, networkPrefix);
}

function privToAddress(priv, network = 'mainnet') {
  return pubToAddress(privToPub(priv), network);
}

module.exports = {
  Tuple,
  isIterable,
  joinArray,
  convertToLittleEndian,
  convertIntegerToBytes,
  convertIntegerToLittleEndian,
  getByteLengthInBytes,
  b58decode,
  b58encode,
  stripAddress,
  sha256,
  ecdsaFromPriv,
  encodePub,
  getPrivateKeyFormat,
  getWifNetwork,
  getAddressFormat,
  getAddressNetwork,
  privToPub,
  ripemd160,
  hash160,
  getAddressPrefix,
  networkPrependDoubleHashChecksumAppendBase58,
  pubToAddress,
  privToAddress,
};
