// function getPubKeyFormat
// function decodePubKey
// function encodePubKey
// function getPrivKeyFormat
// function decodePrivKey
// function encodePrivKey
const base58 = require('bs58');
const { Buffer } = require('buffer/')
const { ec } = require('elliptic/');
const forge = require('node-forge');
const ecdsa = new ec('secp256k1');

const { log } = require('./logger');
const { OrderedDict } = require('./dataStructures');

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
  const hexPriv = decodePrivKey(privateKey, logger, {string: 'private key'});
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

  return compressedHex;
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
  stripAddress,
  sha256,
  ecdsaFromPriv,
  encodePub,
};
