const base58 = require('bs58');
const { Buffer } = require('buffer/');
const { ec } = require('elliptic/');
const forge = require('node-forge');
const SafeBuffer = require('safe-buffer').Buffer;
const RIPEMD160 = require('ripemd160');
const { log } = require('./logger');
const { OrderedDict, ActionLog, ConversionLog, InvalidInputError } = require('./models');

// eslint-disable-next-line new-cap
const ecdsa = new ec('secp256k1');

class ArrayObject {
  /**
   *
   * @param {*[]} array
   */
  constructor(array = []) {
    this.array = array;
  }

  /**
   *
   * @param {string} delimiter
   * @returns {string}
   */
  join(delimiter = ',') {
    return this.array.join(delimiter);
  }
}

/**
 *
 * @param {string} label
 * @param {string} value
 * @returns {string}
 */
function getTemplateValue(label, value) {
  if (label) {
    return `${label}::${value}`;
  }
  return value;
}

/**
 *
 * @param {string} str
 * @returns {boolean}
 */
function isHexString(str) {
  return /^[0-9A-F]*$/i.test(str.toUpperCase());
}

/**
 *
 * @param {string} string
 * @returns {boolean}
 */
function isBase58(string) {
  return /^[1-9a-km-zA-HJ-NP-Z]+$/.test(string);
}

/**
 *
 * @param {string} str
 * @param {boolean} regex
 * @returns {boolean}
 */
function isDecimalString(str, regex = false) {
  // return !isNaN(str);
  if (regex) {
    return /^-?[0-9]+$/.test(str);
  }
  return !Number.isNaN(Number(str));
}

/**
 *
 * @param {*} structure
 * @returns {boolean}
 */
function isIterable(structure) {
  return Array.isArray(structure);
}

/**
 * Flatten Array
 * @param {OrderedDict|Array|Object|*} array
 * @param {ArrayObject} arrayObject
 * @returns {ArrayObject}
 */
function joinArray(array, arrayObject = new ArrayObject()) {
  if (array instanceof OrderedDict) {
    array.getKeys().forEach((key) => {
      joinArray(array.getValue(key), arrayObject);
    });
  } else if (Array.isArray(array)) {
    array.forEach((item) => {
      joinArray(item, arrayObject);
    });
  } else if (array && array.key && array.value) {
    joinArray(array.value, arrayObject);
  } else {
    arrayObject.array.push(array);
  }
  return arrayObject;
}

/**
 *
 * @param {string} hexString
 * @param {*} logger
 * @param {*} xTemplate
 * @returns {string}
 */
function sha256(hexString, logger, xTemplate = {}) {
  const md = forge.md.sha256.create();
  md.update(forge.util.hexToBytes(hexString));
  const hexDigest = md.digest().toHex();
  // logging
  if (logger) {
    const templateValue = getTemplateValue(xTemplate.hexString, hexString);
    log(logger, new ActionLog(
      'SHA256 Hash',
      `${templateValue}`,
      `${hexDigest}`,
    ));
  }
  // continuation
  return hexDigest;
}

/**
 *
 * @param {string} hexString
 * @returns {string}
 */
function ripemd160(hexString) {
  return new RIPEMD160().update(hexString, 'hex').digest('hex');
}

/**
 *
 * @param {string} hexString
 * @returns {string}
 */
function hash160(hexString) {
  const hashStr = sha256(hexString);
  return ripemd160(hashStr);
}

/**
 *
 * @param {string} hexString
 * @param {*} logger
 * @param {*} xTemplate
 * @returns {string}
 */
function convertToLittleEndian(hexString, logger, xTemplate = {}) {
  // logic
  const hexedLE = hexString.match(/.{2}/g).reverse().join('');
  // logging
  if (logger) {
    const templateValue = getTemplateValue(xTemplate.hexString, hexString);
    log(logger, new ConversionLog(
      `${templateValue}`,
      'little endian',
      `${hexedLE}`,
    ));
  }
  // continuation
  return hexedLE;
}

/**
 *
 * @param {number} integer
 * @param {number} bytes
 * @param {*} logger
 * @param {*} xTemplate
 * @returns {string}
 */
function convertIntegerToBytes(integer, bytes, logger, xTemplate = {}) {
  const buff = Buffer.alloc(bytes);
  buff.writeUIntBE(integer, 0, bytes);
  const hexedInteger = buff.toString('hex');
  // logging
  if (logger) {
    const templateValue = getTemplateValue(xTemplate.convertIntegerToBytes_integer, integer);
    log(logger, new ConversionLog(
      `${templateValue}`,
      `${bytes} bytes hex`,
      `${hexedInteger}`,
    ));
  }
  // continuation
  return hexedInteger;
}

/**
 *
 * @param {number} integer
 * @param {number} bytes
 * @param {*} logger
 * @param {*} xTemplate
 * @returns {string}
 */
function convertIntegerToLittleEndian(integer, bytes, logger, xTemplate = {}) {
  // TODO the below functions dont even implement xtemplate
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
    const templateValue = getTemplateValue(xTemplate.string, string);
    log(logger, new ActionLog(
      'Get',
      `byte length of ${templateValue}`,
      `${byteLength}`,
    ));
  }
  // continuation
  return byteLength;
}

/**
 *
 * @param {string} string
 * @param {*} logger
 * @param {*} xTemplate
 * @returns {string}
 */
function getByteLengthInBytes(string, logger, xTemplate = {}) {
  // TODO this function is DEFINTELY bugged, fails for byteLength 372
  const byteLength = getByteLength(string, logger, xTemplate);
  return convertIntegerToBytes(byteLength, 1, logger, xTemplate);
}

/**
 *
 * @param {string} string
 * @param {*} logger
 * @param {*} xTemplate
 * @returns {string}
 */
function b58decode(string, logger, xTemplate = {}) {
  const decodedString = base58.decode(string).toString('hex');
  // logging
  if (logger) {
    const templateValue = getTemplateValue(xTemplate.string, string);
    log(logger, new ActionLog(
      'Base58 Decode',
      `${templateValue}`,
      `${decodedString}`,
    ));
  }
  // continuation
  return decodedString;
}

/**
 *
 * @param {string} string
 * @returns {string}
 */
function b58encode(string) {
  return base58.encode(SafeBuffer.from(string, 'hex'), 'hex');
}

/**
 *
 * @param {string} address
 * @param {*} logger
 * @returns {string}
 */
function stripAddress(address, logger) {
  const strippedAddress = address.slice(2, -8);
  // logging
  if (logger) {
    log(logger, new ActionLog(
      'Remove',
      'network bytes and checksum',
      `${strippedAddress}`,
    ));
  }
  // continuation
  return strippedAddress;
}

/**
 *
 * @param {string} privateKey
 * @param {*} logger
 * @param {*} xTemplate
 * @returns {string}
 */
function decodePrivKey(privateKey, logger, xTemplate = {}) {
  // Account for other key types
  // if wif:
  const decodedPriv = b58decode(privateKey, logger, xTemplate);
  // todo rename stripAddress
  // const hexPriv = stripAddress(decodedPriv, logger, xTemplate);
  // todo why is the above line wrong?
  // missing log?
  const hexPriv = decodedPriv.slice(2, 66);
  return hexPriv;
}

/**
 *
 * @param {string} privateKey
 * @param {*} logger
 * @returns {string}
 */
function ecdsaFromPriv(privateKey, logger) {
  const hexPriv = decodePrivKey(privateKey, logger, { string: 'private_key' });
  return ecdsa.keyFromPrivate(hexPriv);
}

/**
 *
 * @param {string} publicKey
 * @param {*} logger
 * @returns {string}
 */
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
    log(logger, new ActionLog(
      'Encode',
      `public_key::${publicKey} as compressed hex`,
      null,
      [
        new ActionLog(
          'Strip',
          'public_key',
          `${strippedPub}`,
        ),
        new ActionLog(
          'Segment',
          'stripped key',
          `segment_a:${hexSegmentA}, segment_b:${hexSegmentB}`,
        ),
        new ActionLog(
          'Modulo',
          'segment_b value by 2',
          `${bModulo}`,
        ),
        new ActionLog(
          'Create Byte Prefix',
          'from adding value 2 to the modulo and appending 0 to the start',
          `${prefix}`,
        ),
        new ActionLog(
          'Combine',
          'the prefix with segment_a',
          `${compressedHex}`,
        ),
      ],
    ));
    // TODO multi subaction action
  }

  return compressedHex;
}

/**
 *
 * @param {*} key
 * @returns {'decimal'|'hex'|'hex_compressed'|'wif'|'wif_compressed'}
 * @throws {InvalidInputError}
 */
function getPrivateKeyFormat(key) {
  if (isDecimalString(key)) {
    return 'decimal';
  } if (key.length === 64 && isHexString(key)) {
    return 'hex';
  } if (key.length === 66 && isHexString(key)) {
    return 'hex_compressed';
  } if (key.length === 51 && isBase58(key)) {
    return 'wif';
  } if (key.length === 52 && isBase58(key)) {
    return 'wif_compressed';
  }
  throw new InvalidInputError();
}

/**
 *
 * @param {string} key
 * @returns {'mainnet'|'testnet'}
 * @throws {InvalidInputError}
 */
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
  throw new InvalidInputError();
}

/**
 *
 * @param {string} address
 * @returns {'p2pkh'|'p2sh'}
 * @throws {InvalidInputError}
 */
function getAddressFormat(address) {
  if ((address.startsWith('1')
      || address.startsWith('m')
      || address.startsWith('n'))
      && isBase58(address)) {
    return 'p2pkh';
  } if (address.startsWith('3')
        || address.startsWith('2')) {
    return 'p2sh';
  }
  throw new InvalidInputError(`${address} does not adhere to any known format.`);
}

/**
 *
 * @param {string} address
 * @returns {'mainnet'|'testnet'}
 * @throws {InvalidInputError}
 */
function getAddressNetwork(address) {
  if (address.startsWith('1')
      || address.startsWith('3')) {
    return 'mainnet';
  } if (address.startsWith('m')
        || address.startsWith('n')
        || address.startsWith('2')) {
    return 'testnet';
  }
  throw new InvalidInputError(`${address} does not adhere to any known format.`);
}

/**
 *
 * @param {string} key
 * @param {string} networkPrefix
 * @returns {string}
 */
function networkPrependDoubleHashChecksumAppendBase58(key, networkPrefix) {
  let networkAwareKey = networkPrefix + key;

  const hashed = sha256(networkAwareKey);
  const doubleHashed = sha256(hashed);
  const checkSum = doubleHashed.substring(0, 8);

  networkAwareKey += checkSum;
  return b58encode(networkAwareKey);
}

/**
 *
 * @param {'decimal'|'hex'} encoding
 * @param {'p2pkh'|'p2sh'} type
 * @param {'mainnet'|'testnet'} network
 * @returns {string}
 * @throws {InvalidInputError}
 */
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
  throw new InvalidInputError('Unrecognised argument(s).');
}

/**
 *
 * @param {string} priv
 * @returns {string}
 */
function privToPub(priv) {
  const keypair = ecdsaFromPriv(priv);
  return encodePub(keypair.getPublic().encode('hex'));
}

/**
 *
 * @param {string} pub
 * @param {'mainnet'|'testnet'} network
 * @returns {string}
 */
function pubToAddress(pub, network = 'mainnet') {
  // assumes pub is hex
  const networkPrefix = getAddressPrefix('hex', 'p2pkh', network);
  const hashedPub = hash160(pub);
  return networkPrependDoubleHashChecksumAppendBase58(hashedPub, networkPrefix);
}

/**
 *
 * @param {string} priv
 * @param {'mainnet'|'testnet'} network
 * @returns {string}
 */
function privToAddress(priv, network = 'mainnet') {
  return pubToAddress(privToPub(priv), network);
}

module.exports = {
  isIterable,
  joinArray,
  convertToLittleEndian,
  convertIntegerToBytes,
  convertIntegerToLittleEndian,
  getByteLength,
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
  isDecimalString,
  getTemplateValue,
  isBase58,
  isHexString,
};
