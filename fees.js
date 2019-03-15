const utils = require('./utils');
const { Payment } = require('./model/transaction');

/**
 *
 * @param {number} bytes
 */
function bytesTokB(bytes) {
  return (bytes / 1000);
}

/**
 *
 * @param {number} size
 * @param {('BYTES'|'BYTE'|'KB')} format
 */
function formatSize(size, format) {
  const pformat = format.toUpperCase();
  if (pformat === 'BYTES' || pformat === 'BYTE') {
    return size;
  } if (pformat === 'KB') {
    return bytesTokB(size);
  }
  throw new Error('Unrecognised format.');
}

/**
 *
 * @param {ModularTransaction} transaction
 * @param {number} fee
 * @param {{'BYTES'|'BYTE'|'KB'}} format
 */
function getFeeRate(transaction, fee, format = 'bytes') {
  const byteSize = utils.getByteLength(transaction.getRawString());
  return fee / formatSize(byteSize, format);
}

/**
 *
 * @param {ModularTransaction} transaction
 * @param {number} feeRate
 * @param {{'BYTES'|'BYTE'|'KB'}} format
 */
function getTotalFees(transaction, feeRate, format = 'bytes') {
  const byteSize = utils.getByteLength(transaction.getRawString());
  return feeRate * formatSize(byteSize, format);
}

/**
 *
 * @param {number} balance
 * @param {number} fee
 * @param {string} address
 */
function calculateChangePayment(balance, fee, address) {
  return new Payment(address, balance - fee);
}

module.exports = {
  formatSize,
  getFeeRate,
  getTotalFees,
  calculateChangePayment,
};
