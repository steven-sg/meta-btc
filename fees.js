const utils = require('./utils');
const { Payment } = require('./model/transaction');

function bytesTokB(bytes) {
  return (bytes / 1000);
}

function formatSize(size, format) {
  const pformat = format.toUpperCase();
  if (pformat === 'BYTES' || pformat === 'BYTE') {
    return size;
  } if (pformat === 'KB') {
    return bytesTokB(size);
  }
  throw new Error('Unrecognised format.');
}

function getFeeRate(transaction, fee, format = 'bytes') {
  const byteSize = utils.getByteLength(transaction.getRawString());
  return fee / formatSize(byteSize, format);
}

function getTotalFees(transaction, feeRate, format = 'bytes') {
  const byteSize = utils.getByteLength(transaction.getRawString());
  return feeRate * formatSize(byteSize, format);
}

function calculateChangePayment(balance, fee, address) {
  return new Payment(address, balance - fee);
}

module.exports = {
  formatSize,
  getFeeRate,
  getTotalFees,
  calculateChangePayment,
};
