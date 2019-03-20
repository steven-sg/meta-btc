const { createSignedTransaction } = require('../transactions');
const models = require('../models');

const getSampleModularTransaction = () => {
  const transactionOutputs = [
    new models.TransactionOutput(
      0,
      '76a914328dbf4cbeacc2898f096ffce5f9dcd27b53e5cc88ac'),
  ];
  const transaction = new models.Transaction(
    '68e7da9216d4e113df7918383258f7cec0a5cf661f469f68966aadf6a12358d3',
    transactionOutputs,
  );
  return createSignedTransaction(
    [transaction.getContribution(0)],
    [new models.Payment('mjUDEsMXuYFZSrERVZjzHpznNJFzNUBoop', 10000000)],
    ['cRKHcyn9Diw4GmcAaxRUdJH3Kgaz3j1KBFq1i6QwC2U9STqK7YXm'],
  );
};

module.exports = {
  getSampleModularTransaction,
};
