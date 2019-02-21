const utils = require('./utils');
const { Payment } = require('./model/transaction');

function bytesTokB(bytes) {
  return (bytes / 1000);
}

function formatFee(fee, bytes, format='kB', currency='btc') {
  // TODO
  // takes in satoshi
  // if !currency
  // returns kilobytes
  return fee / bytesTokB(bytes);
}

function getFeeRate(transaction, fee) {
  const byteSize = utils.getByteLength(transaction.getRawString());
  return formatFee(fee, byteSize);
}

function getTotalFees(transaction, feeRate) {
  const byteSize = utils.getByteLength(transaction.getRawString());
  return feeRate * bytesTokB(byteSize);
}

function calculateChangePayment(balance, fee, address) {
  return new Payment(address, balance - fee);
}

module.exports = {
  formatFee,
  getFeeRate,
  getTotalFees,
  calculateChangePayment,
};
