const blockcypher = require('./blockcypher');
const transaction = require('../model/transaction');
const { ServiceResponse, ServiceError, InternalError } = require('./utils');

function pushtx(tx, network) {
  return blockcypher.pushtx(tx, network)
    .then(response => new ServiceResponse(response.status, response.data))
    .catch((error) => {
      throw new ServiceError(error.response.status, error.response.data.error);
    });
}

function pullUnspentTransactions(address, network) {
  return blockcypher.pullUnspentTransactions(address, network)
    .then((response) => {
      if (!response) {
        throw new InternalError(`An error has occured. ${address} has no spendable balance.`);
      }
      const data = Array.isArray(response.data) ? response.data : [response.data];
      const txs = data.map((tx) => {
        let outputs = Array.isArray(tx.outputs) ? tx.outputs : [tx.outputs];
        outputs = outputs.map((output, index) => new transaction.TransactionOutput(index, output.script, output.value));
        return new transaction.Transaction(tx.hash, outputs);
      });
      return new ServiceResponse(response.status, txs);
    })
    .catch((error) => {
      if (error instanceof InternalError) {
        throw error;
      }
      throw new ServiceError(error.response.status, error.response.data.error);
    });
}

function pullMetadata(network) {
  return blockcypher.pullMetadata(network)
    .then(response => new ServiceResponse(response.status, response.data))
    .catch((error) => {
      throw new ServiceError(error.response.status, error.response.data.error);
    });
}

module.exports = {
  pushtx,
  pullMetadata,
  pullUnspentTransactions,
};
