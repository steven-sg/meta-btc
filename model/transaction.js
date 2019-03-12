class TransactionOutput {
  /**
   *
   * @param {number} outputIndex
   * @param {string} scriptPubKey
   * @param {string} balance
   * @param {string} address
   */
  constructor(outputIndex, scriptPubKey, balance, address) {
    this.outputIndex = outputIndex;
    this.scriptPubKey = scriptPubKey;
    this.balance = balance;
    this.address = address;
  }
}

class Contribution {
  /**
   *
   * @param {string} txHash transaction hash
   * @param {TransactionOutput} output
   */
  constructor(txHash, output) {
    this.txHash = txHash;
    this.output = output;
  }
}

class Transaction {
  /**
   *
   * @param {string} txHash
   * @param {TransactionOutput[]} outputs
   */
  constructor(txHash, outputs) {
    this.txHash = txHash;

    this.outputs = {};
    for (let i = 0; i < outputs.length; i += 1) {
      this.outputs[outputs[i].outputIndex] = outputs[i];
    }
  }

  /**
   *
   * @param {number} outputIndex
   * @returns {Contribution}
   */
  getContribution(outputIndex) {
    return new Contribution(this.txHash, this.outputs[outputIndex]);
  }

  /**
   * @returns {Contribution[]}
   */
  getContributions() {
    return Object.keys(this.outputs).map(outputIndex => new Contribution(this.txHash,
      this.outputs[outputIndex]));
  }
}

class Payment {
  /**
   *
   * @param {string} to recipient address
   * @param {number} amount
   */
  constructor(to, amount) {
    this.to = to;
    this.amount = amount;
  }
}

class ActionLog {
  /**
   *
   * @param {string} verb
   * @param {string} object
   * @param {string|string[]} result
   * @param {ActionLog|ActionLog[]} subaction
   */
  constructor(verb, object, result, subaction) {
    this.action = verb;
    this.object = object;
    this.log = `${verb} ${object}`;
    this.result = Array.isArray(result) ? result : [result];
    this.subaction = Array.isArray(subaction) ? subaction : [subaction];
  }

  /**
   *
   * @returns {boolean}
   */
  hasResult() {
    return this.result[0] !== undefined && this.result[0] !== null;
  }

  /**
   *
   * @returns {boolean}
   */
  hasSubaction() {
    return this.subaction[0] !== undefined && this.subaction[0] !== null;
  }
}

class AppendLog extends ActionLog {
  /**
   * 
   * @param {string} appendage
   * @param {string} to
   * @param {string|string[]} result
   */
  constructor(appendage, to, result) {
    super('Append', `${appendage} to ${to}`, result);
    this.from = appendage;
    this.to = to;
  }
}
class AppendTransactionLog extends AppendLog {
  /**
   *
   * @param {string} appendage
   * @param {string} to
   * @param {string|string[]} result
   * @param {{OrderedDict}} transactionDict
   */
  constructor(appendage, to, result, transactionDict) {
    super(appendage, `transaction::${to}`, `transaction::${result}`);
    this.transactionDict = transactionDict;
  }
}
class ConversionLog extends ActionLog {
  /**
   *
   * @param {string} from
   * @param {string} to
   * @param {string|string[]} result
   */
  constructor(from, to, result) {
    super('Convert', `${from} to ${to}`, result);
    this.from = from;
    this.to = to;
  }
}

class ReplaceLog extends ActionLog {
  /**
   *
   * @param {string} original
   * @param {string} substitute
   * @param {string|string[]} result
   * @param {{OrderedDict}} transactionDict
   */
  constructor(original, substitute, result, transactionDict) {
    super('Replace', `${original} with ${substitute}`, result);
    this.transactionDict = transactionDict;
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
  ReplaceLog,
};
