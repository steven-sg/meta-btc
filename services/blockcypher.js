const axios = require('axios');
const { InvalidInputError } = require('../errors');

/**
 *
 * @param {'testnet' | 'mainnet'} network
 */
function getNetworkPath(network) {
  switch (network.toUpperCase()) {
    case 'MAINNET':
      return 'main';
    case 'TESTNET':
      return 'test3';
    default:
      throw InvalidInputError(`Unrecognised network ${network}`);
  }
}

/**
 * push a transaction
 * @param {string} tx raw transaction
 * @param {'testnet' | 'mainnet'} network
 */
function pushtx(tx, network = 'testnet') {
  const path = getNetworkPath(network);
  return axios.post(`https://api.blockcypher.com/v1/btc/${path}/txs/push`, JSON.stringify({ tx }));
}

/**
 * pull all unspent transactions belonging to an address
 * @param {string} address a valid bitcoin address
 * @param {'testnet' | 'mainnet'} network
 */
function pullUnspentTransactions(address, network = 'testnet') {
  const path = getNetworkPath(network);
  return axios.get(`https://api.blockcypher.com/v1/btc/${path}/addrs/${address}?unspentOnly=true`)
    .then((response) => {
      const txs = Array.isArray(response.data.txrefs) ? response.data.txrefs : [response.data.txrefs];
      if (!txs[0]) {
        return null;
      }
      const txMap = [];
      txs.forEach((tx) => {
        if (!txMap.includes(tx.tx_hash) && tx.confirmations >= 6) {
          txMap.push(tx.tx_hash);
        }
      });

      if (!txMap.length) {
        return null;
      }
      const txParam = txMap.join(';');
      return axios.get(`https://api.blockcypher.com/v1/btc/${path}/txs/${txParam}`);
    });
}

module.exports = {
  pushtx,
  pullUnspentTransactions,
};
