const axios = require('axios');

function pushtx(tx, network) {
  return axios.post('https://api.blockcypher.com/v1/btc/test3/txs/push', JSON.stringify({ tx }));
}

function pullUnspentTransactions(address, network) {
  return axios.get(`https://api.blockcypher.com/v1/btc/test3/addrs/${address}?unspentOnly=true`)
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
      return axios.get(`https://api.blockcypher.com/v1/btc/test3/txs/${txs}`);
    });
}

function pullMetadata(network) {
  return axios.get('https://api.blockcypher.com/v1/btc/test3');
}

module.exports = {
  pushtx,
  pullMetadata,
  pullUnspentTransactions,
};
