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
        const outputDataArray = Array.isArray(tx.outputs) ? tx.outputs : [tx.outputs];
        const outputs = [];
        for (let index = 0; index < outputDataArray.length; index += 1) {
          const output = outputDataArray[index];
          if (output.script_type === 'pay-to-pubkey-hash'
              && output.addresses.length === 1
              && output.addresses[0] === address) {
            outputs.push(new transaction.TransactionOutput(index, output.script, output.value, address));
          }
        }
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
