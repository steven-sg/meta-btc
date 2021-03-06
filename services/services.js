const blockcypher = require('./blockcypher');
const transaction = require('../models');

class ServiceError extends Error {
  /**
   * @constructor
   * @param {number} status
   * @param {string} message
   */
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

class ServiceResponse {
  /**
   * @constructor
   * @param {number} status
   * @param {*} data
   */
  constructor(status, data) {
    this.status = status;
    this.data = data;
  }
}

class InternalError extends Error {
  /**
   * @constructor
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.message = message;
  }
}

/**
 * push a transaction
 * @param {string} tx raw transaction
 * @param {'testnet' | 'mainnet'} network
 */
function pushtx(tx, network) {
  return blockcypher.pushtx(tx, network)
    .then((response) => {
      return new ServiceResponse(response.status, response.data);
    })
    .catch((error) => {
      throw new ServiceError(error.response.status, error.response.data.error);
    });
}

/**
 * pull all unspent transactions belonging to an address
 * @param {string} address a valid bitcoin address
 * @param {'testnet' | 'mainnet'} network
 */
function pullUnspentTransactions(address, network) {
  return blockcypher.pullUnspentTransactions(address, network)
    .then((response) => {
      if (!response) {
        throw new InternalError(`An error has occured. ${address} has no spendable balance.`);
      }
      const data = Array.isArray(response.data) ? response.data : [response.data];
      const txs = [];
      for (let index = 0; index < data.length; index += 1) {
        const tx = data[index];
        const outputDataArray = Array.isArray(tx.outputs) ? tx.outputs : [tx.outputs];
        const outputs = [];
        for (let subindex = 0; subindex < outputDataArray.length; subindex += 1) {
          const output = outputDataArray[subindex];
          if (output.script_type === 'pay-to-pubkey-hash'
              && output.addresses.length === 1
              && output.addresses[0] === address) {
            outputs.push(new transaction.TransactionOutput(subindex, output.script, output.value, address));
          }
        }
        txs.push(new transaction.Transaction(tx.hash, outputs));
      }
      return new ServiceResponse(response.status, txs);
    })
    .catch((error) => {
      if (error instanceof InternalError) {
        throw error;
      }
      throw new ServiceError(error.response.status, error.response.data.error);
    });
}

module.exports = {
  pushtx,
  pullUnspentTransactions,
};
