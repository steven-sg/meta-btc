class TransactionOutput {
  constructor(outputIndex, scriptPubKey, balance) {
    this.outputIndex = outputIndex;
    this.scriptPubKey = scriptPubKey;
    this.balance = balance;
  }
}

class Contribution {
  constructor(txHash, output) {
    this.txHash = txHash;
    this.output = output;
  }
}

class Transaction {
  constructor(txHash, outputs) {
    this.txHash = txHash;

    this.outputs = {};
    for (let i = 0; i < outputs.length; i += 1) {
      this.outputs[outputs[i].outputIndex] = outputs[i];
    }
  }

  getContribution(outputIndex) {
    return new Contribution(this.txHash, this.outputs[outputIndex]);
  }

  getContributions() {
    return Object.keys(this.outputs).map(outputIndex => new Contribution(this.txHash, this.outputs[outputIndex]));
  }
}

class Payment {
  constructor(to, amount) {
    this.to = to;
    this.amount = amount;
  }
}

module.exports = {
  TransactionOutput,
  Transaction,
  Contribution,
  Payment,
};
