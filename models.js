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
   * @param {OrderedDict} transactionDict
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
   * @param {OrderedDict} transactionDict
   */
  constructor(original, substitute, result, transactionDict) {
    super('Replace', `${original} with ${substitute}`, result);
    this.transactionDict = transactionDict;
  }
}

class OrderedDict {
  /**
   * A javascript object/dict with ordered keys and array values
   * @param {strings[]} keys
   */
  constructor(keys = []) {
    this.keys = keys;
    this.vals = {};
    this.keys.forEach((key) => {
      this.vals[key] = [];
    });
  }

  /**
   * Makes a best effort copy
   * @param {OrderedDict} oldDict
   * @returns {OrderedDict}
   */
  static copy(oldDict) {
    const keys = oldDict.getKeys();
    const dict = new OrderedDict(keys);

    keys.forEach((key) => {
      let value;
      if (Array.isArray(oldDict.getValue(key))) {
        value = oldDict.getValue(key).map((val) => {
          if (val instanceof OrderedDict) {
            return OrderedDict.copy(val);
          }
          return JSON.parse(JSON.stringify(val));
        });
      } else {
        value = JSON.parse(JSON.stringify(oldDict.getValue(key)));
      }
      dict.setValue(key, value);
    });

    return dict;
  }

  /**
   * Push an item to the array corresponding to the key
   * @param {string} key
   * @param {*} item
   */
  pushTo(key, item) {
    if (!this.keys.includes(key)) {
      this.keys.push(key);
    }
    this.vals[key].push(item);
  }

  /**
   *
   * @param {string} key
   * @returns {*[]}
   */
  getValue(key) {
    return this.vals[key];
  }

  /**
   *
   * @param {string} key
   * @param {*[]} value
   */
  setValue(key, value) {
    this.vals[key] = value;
  }

  /**
   * Returns an ordered array of values
   * @returns {*[]}
   */
  getValues() {
    const valueList = [];
    this.keys.forEach((key) => {
      valueList.push(this.vals[key]);
    });
    return valueList;
  }

  /**
   * Returns an ordered array of objects containing key and value
   * Recursively decodes OrderedDicts
   * @returns {Objects[]}
   */
  getArray() {
    const valueList = [];
    this.keys.forEach((key) => {
      const values = this.vals[key] && this.vals[key].map((value) => {
        const val = value instanceof OrderedDict ? value.getArray() : value;
        return val;
      });

      valueList.push({
        key,
        value: values,
      });
    });
    return valueList;
  }

  /**
   *
   * @returns {string[]}
   */
  getKeys() {
    return this.keys;
  }

  /**
   *
   * @returns {number}
   */
  getLength() {
    return this.keys.length;
  }

  /**
   *
   * @param {string} oldKey
   * @param {string} newKey
   * @param {*[]} newValue
   */
  replace(oldKey, newKey, newValue) {
    for (let i = 0; i < this.getLength; i += 1) {
      if (this.key[i] === oldKey) {
        this.key[i] = newKey;
        break;
      }
    }
    delete this.vals[oldKey];
    this.vals[newKey] = newValue;
  }

  /**
   *
   * @param {string} key
   */
  remove(key) {
    for (let i = 0; i < this.getLength; i += 1) {
      if (this.key[i] === key) {
        this.key.splice(i, 1);
        break;
      }
    }
    delete this.vals[key];
  }

  /**
   * Concatenate all the values into a single string
   * @param {string} delimiter
   */
  join(delimiter = ',') {
    return this.getValues().join(delimiter);
  }
}

class InvalidInputError extends Error {
  /**
   *
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'InvalidInputError';
    this.message = message;
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
  OrderedDict,
  InvalidInputError,
};
