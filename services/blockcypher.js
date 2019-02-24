const axios = require('axios');

function pushtx(tx, network = 'testnet') {
  // TODO make this a switch
  const net = network.toUpperCase() === 'MAINNET' ? 'main' : 'test3';
  return axios.post(`https://api.blockcypher.com/v1/btc/${net}/txs/push`, JSON.stringify({ tx }));
}

function pullUnspentTransactions(address, network = 'testnet') {
  const net = network.toUpperCase() === 'MAINNET' ? 'main' : 'test3';
  return axios.get(`https://api.blockcypher.com/v1/btc/${net}/addrs/${address}?unspentOnly=true`)
    .then((response) => {
      let txs = Array.isArray(response.data.txrefs) ? response.data.txrefs : [response.data.txrefs];
      if (!txs[0]) {
        return null;
      }
      txs = txs.reduce((acc, tx) => {
        if (!acc.length) {
          return tx.tx_hash;
        }
        return `${acc};${tx.tx_hash}`;
      }, '');
      return axios.get(`https://api.blockcypher.com/v1/btc/${net}/txs/${txs}`);
    });
}

function pullMetadata(network = 'testnet') {
  const net = network.toUpperCase() === 'MAINNET' ? 'main' : 'test3';
  return axios.get(`https://api.blockcypher.com/v1/btc/${net}`);
}

module.exports = {
  pushtx,
  pullMetadata,
  pullUnspentTransactions,
};
