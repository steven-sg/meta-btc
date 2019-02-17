const utils = require('./utils');
const scripts = require('./scripts');
const { Payment } = require('./model/transaction');
const { createSignedTransaction } = require('./transactions');

function formatFee(fee, bytes, format='kB', currency='btc') {
  // TODO
  // takes in satoshi
  // if !currency
  return fee / (bytes / 1000);
}

function getFeeRate(transaction, fee) {
  const byteSize = utils.getByteLength(transaction.getRawString());
  return formatFee(fee, byteSize);
}

function getTotalFees(transaction, feeRate) {
  const byteSize = utils.getByteLength(transaction.getRawString());
  return feeRate * byteSize;
}

function calculateChangePayment(balance, fee, address) {
  return new Payment(address, balance - fee);
}

function calculateChangeByRatePayment(balance, feeRate, address, contributions, payments, keys) {
  const transactionSize = utils.getByteLength(createSignedTransaction(contributions, payments, keys).getRawString());
  if (transactionSize * feeRate > balance) {
    throw new Error('insuffienct funds');
  }

  const p2pkhScriptSize = utils.getByteLength(scripts.p2pkh.createScript(address));
  const estimatedSize = transactionSize + p2pkhScriptSize + 8 + 1;
  console.log('original size', transactionSize);
  console.log('script size', p2pkhScriptSize);
  console.log('estimated size', estimatedSize);
  const changeTrials = {};
  for (let errorTolerance = -4; errorTolerance <= 4; errorTolerance += 1) {
  // Estimated byte increase
    const estimatedFee = (estimatedSize + errorTolerance) * feeRate;
    const estimatedPayout = balance - estimatedFee;

    if (estimatedPayout <= 0) {
      console.log('continued');
      continue;
    }

    const newPayments = payments.slice(0);
    const change = new Payment(address, estimatedPayout);
    newPayments.push(change);

    const newTransactionSize = utils.getByteLength(createSignedTransaction(contributions, newPayments, keys).getRawString());
    const newFeeRateDifference = Math.abs(feeRate - (estimatedFee / newTransactionSize));
    changeTrials[newFeeRateDifference] = change;
    console.log('size', newTransactionSize);
    console.log('payout', estimatedPayout);
    console.log('fee', estimatedFee);
    console.log('diff', newFeeRateDifference);
  }
  const bestTrial = Math.min(...Object.keys(changeTrials));
  if (Math.round(bestTrial) !== 0) {
    throw new Error('best trial not found');
  }
  console.log('best trial', bestTrial);
  return changeTrials[bestTrial];
}

module.exports = {
  formatFee,
  getFeeRate,
  getTotalFees,
  calculateChangePayment,
  calculateChangeByRatePayment,
};
