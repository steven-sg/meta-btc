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
      return axios.get(`https://api.blockcypher.com/v1/btc/${net}/txs/${txParam}`);
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
