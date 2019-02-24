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

class ActionLog {
  constructor(verb, object, result, subaction) {
    this.action = verb;
    this.object = object;
    this.log = `${verb} ${object}`;
    this.result = Array.isArray(result) ? result : [result];
    this.subaction = Array.isArray(subaction) ? subaction : [subaction];
  }

  hasResult() {
    return this.result[0] !== undefined;
  }

  hasSubaction() {
    return this.subaction[0] !== undefined;
  }
}

class AppendLog extends ActionLog {
  constructor(appendage, to, result) {
    super('Append', `${appendage} to ${to}`, result);
    this.from = appendage;
    this.to = to;
  }
}
class AppendTransactionLog extends AppendLog {
  constructor(appendage, to, result) {
    super(appendage, `transaction::${to}`, `transaction::${result}`);
  }
}
class ConversionLog extends ActionLog {
  constructor(from, to, result) {
    super('Convert', `${from} to ${to}`, result);
    this.from = from;
    this.to = to;
  }
}

module.exports = {
  TransactionOutput,
  Transaction,
  Contribution,
  Payment,
  ActionLog,
  ConversionLog,
  AppendLog,
  AppendTransactionLog,
};
