const { Buffer } = require('buffer/');
const BN = require('bn.js');
const utils = require('./utils');
const { log } = require('./logger');
const { OrderedDict } = require('./models');
const services = require('./services/services');
const scripts = require('./scripts');
const {
  ActionLog,
  AppendLog,
  AppendTransactionLog,
  ReplaceLog,
} = require('./models');

const N = new BN('115792089237316195423570985008687907852837564279074904382605163141518161494337');

function createOutputScript(address, logger) {
  const script = scripts.createScript(address, logger);
  return script;
}

const txConstants = {
  VERSION_CODE: 'version code',
  INPUT_COUNT: 'input count',
  INPUTS: {
    SELF: 'inputs',
    TRANSACTION_HASH: 'transaction hash',
    TRANSACTION_INDEX: 'transaction index',
    SCRIPT_PUB_KEY_LENGTH: 'scriptPubKey length',
    SCRIPT_PUB_KEY: 'scriptPubKey',
    SEQUENCE: 'sequence',
  },
  SIGNED_INPUTS: 'signed inputs',
  OUTPUT_COUNT: 'output count',
  OUTPUTS: {
    SELF: 'outputs',
    TRANSACTION_AMOUNT: 'transaction amount',
    OUTPUT_SCRIPT_LENGTH: 'output script length',
    OUTPUT_SCRIPT: 'output script',
  },
  LOCK_TIME: 'lock time',
  HASH_CODE_TYPE: 'hash code type',
};

function simpleAppend(value, array) {
  array.push(value);
}

function appendTo(arg, array, parentArray, logger = null, xtemplate = {}) {
  const prevValues = parentArray ? `${utils.joinArray(parentArray).join('')}${utils.joinArray(array).join('')}` : utils.joinArray(array).join('');
  simpleAppend(arg, array);
  if (logger) {
    const appendage = utils.joinArray(arg).join('');
    const appendageTemplate = utils.getTemplateValue(xtemplate.appendTo.arg, appendage);
    const toTemplate = utils.getTemplateValue(xtemplate.appendTo.destination, prevValues || 'EMPTY');
    log(logger, new AppendLog(
      `${appendageTemplate}`,
      `${toTemplate}`,
      `${prevValues || ''}${utils.joinArray(array).join('')}`,
    ));
  }
}

function appendToTransaction(arg, array, transaction, logger = null, xtemplate = {}) {
  const prevTransaction = utils.joinArray(transaction).join('');
  const prevArrayState = utils.joinArray(array).join('');

  array.push(arg);
  if (logger) {
    const toTemplate = `${prevTransaction}${prevArrayState}` || 'EMPTY';

    const appendage = arg instanceof OrderedDict ? utils.joinArray(arg).join('') : arg;
    const appendageTemplate = utils.getTemplateValue(xtemplate.appendTo.arg, appendage);
    log(logger, new AppendTransactionLog(
      `${appendageTemplate}`,
      `${toTemplate}`,
      `${prevTransaction}${utils.joinArray(array).join('')}`,
      OrderedDict.copy(transaction),
    ));
  }
}

class ModularTransaction {
  constructor(contributions, payments) {
    this.contributions = contributions;
    this.payments = payments;
    this.logger = new OrderedDict([
      txConstants.VERSION_CODE,
      txConstants.INPUT_COUNT,
      txConstants.INPUTS.SELF,
      txConstants.OUTPUT_COUNT,
      txConstants.OUTPUTS.SELF,
      txConstants.LOCK_TIME,
      txConstants.HASH_CODE_TYPE,
      txConstants.SIGNED_INPUTS,
    ]);
    this.transactionDict = new OrderedDict([
      txConstants.VERSION_CODE,
      txConstants.INPUT_COUNT,
      txConstants.INPUTS.SELF,
      txConstants.OUTPUT_COUNT,
      txConstants.OUTPUTS.SELF,
      txConstants.LOCK_TIME,
      txConstants.HASH_CODE_TYPE,
    ]);

    this.versionCode = '01000000';
    this.lockTime = '00000000';
    this.hashCodeType = '01000000';
  }

  setLockTime(lockTime) {
    this.lockTime = lockTime;
  }

  createRawTransaction() {
    this.appendVersionCode();

    const inputCount = utils.convertIntegerToBytes(
      this.contributions.length,
      1,
      this.logger.getValue(txConstants.INPUT_COUNT),
      { convertIntegerToBytes_integer: 'input_count' },
    );
    appendToTransaction(
      inputCount,
      this.transactionDict.getValue(txConstants.INPUT_COUNT),
      this.transactionDict,
      this.logger.getValue(txConstants.INPUT_COUNT),
      { appendTo: { destination: 'transaction' } },
    );

    this.appendRawInputs();

    const outputCount = utils.convertIntegerToBytes(
      this.payments.length,
      1,
      this.logger.getValue(txConstants.OUTPUT_COUNT),
      { convertIntegerToBytes_integer: 'output_count' },
    );
    appendToTransaction(
      outputCount,
      this.transactionDict.getValue(txConstants.OUTPUT_COUNT),
      this.transactionDict,
      this.logger.getValue(txConstants.OUTPUT_COUNT),
      { appendTo: { destination: 'transaction' } },
    );

    this.appendOutputs();
    this.appendLockTime();
    this.appendHashCodeType();
  }

  signTransaction(privateKeys) {
    const signedInputs = [];
    for (let i = 0; i < this.contributions.length; i += 1) {
      // TODO rawInput seems redundant
      const rawInputi = this.transactionDict.getValue(txConstants.INPUTS.SELF)[i];
      const inputLogger = new OrderedDict([
        txConstants.INPUTS.SCRIPT_PUB_KEY,
      ]);

      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        new ActionLog(
          'Set',
          'the scriptPubKey of every other input to be empty',
        ),
      );
      for (let j = 0; j < this.contributions.length; j += 1) {
        if (i === j) {
          const { scriptPubKey } = this.contributions[i].output;
          const scriptPubKeyLength = utils.getByteLengthInBytes(
            scriptPubKey,
            inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH),
            { string: 'scriptPubKey' },
          );
          this.transactionDict.vals.inputs[j].vals[txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH] = scriptPubKeyLength;
          this.transactionDict.vals.inputs[j].vals[txConstants.INPUTS.SCRIPT_PUB_KEY] = scriptPubKey;
        } else {
          this.transactionDict.vals.inputs[j].vals[txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH] = ['00'];
          this.transactionDict.vals.inputs[j].vals[txConstants.INPUTS.SCRIPT_PUB_KEY] = [''];
        }
      }
      const input = OrderedDict.copy(rawInputi);
      input.setValue(txConstants.INPUTS.SCRIPT_PUB_KEY, []);

      // logic
      const transaction = utils.joinArray(this.transactionDict).join('');
      const hashedTx = utils.sha256(
        transaction,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { hexString: 'raw_transaction' },
      );
      const doubleHashedTx = utils.sha256(
        hashedTx,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { hexString: 'hash_of_raw transaction' },
      );
      const keypair = utils.ecdsaFromPriv(privateKeys[i], inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY));
      const signedTx = keypair.sign(doubleHashedTx);
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        new ActionLog(
          'Sign',
          `${doubleHashedTx} with private_key`,
          [
            `r value: ${signedTx.r.toString()}`,
            `s value: ${signedTx.s.toString()}`,
          ],
        ),
      );

      // https://github.com/vbuterin/pybitcointools/issues/89
      if (signedTx.s.gt(N.div(new BN('2')))) {
        signedTx.s = N.sub(signedTx.s);
        log(
          inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
          new ActionLog(
            'Set',
            's value to be N - s (s value too big)',
            [
              `${signedTx.r.toString()} - ${N.toString()}`,
              signedTx.s.toString(),
            ],
          ),
        );
      }
      const signedTxDER = Buffer.from(signedTx.toDER()).toString('hex');
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        new ActionLog(
          'DER Encode',
          'signature',
          `${signedTxDER}`,
        ),
      );
      // append one byte hash code
      const txHEX = `${signedTxDER}01`;
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        new AppendLog(
          'one byte hash code',
          'DER encoded signature',
          `${txHEX}`,
        ),
      );

      const signatureLength = utils.getByteLengthInBytes(
        txHEX,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { string: 'signature' },
      );
      appendTo(
        {
          key: 'signature_length',
          value: signatureLength,
        },
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        null,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { appendTo: { destination: 'signed_script_pub_key' } },
      );
      appendTo(
        {
          key: 'signature',
          value: txHEX,
        },
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        null,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { appendTo: { destination: 'signed_script_pub_key' } },
      );

      const publicKey = keypair.getPublic().encode('hex');
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        new ActionLog(
          'Derive',
          'public_key from private_key',
          `${publicKey}`,
        ),
      );

      let encodedPub;
      if (utils.getPrivateKeyFormat(privateKeys[i]) === 'wif_compressed') {
        // encodes in pub key as compressed if priv is compressed
        encodedPub = utils.encodePub(
          publicKey,
          inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        );
      } else if (utils.getPrivateKeyFormat(privateKeys[i]) === 'wif') {
        encodedPub = publicKey;
      } else {
        // TODO
        throw new Error('Please encode your private keys in wif format');
      }

      const publicKeyLength = utils.getByteLengthInBytes(
        encodedPub,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { string: 'public_key' },
      );
      appendTo(
        {
          key: 'public_key_length',
          value: publicKeyLength,
        },
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        null,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { appendTo: { destination: 'signed_script_pub_key' } },
      );
      appendTo(
        {
          key: 'public_key',
          value: encodedPub,
        },
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        null,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { appendTo: { destination: 'signed_script_pub_key' } },
      );

      const scriptAsString = utils.joinArray(input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY)).join('');
      const scriptLength = utils.getByteLengthInBytes(scriptAsString);
      input.setValue(
        txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH,
        [scriptLength],
      );

      input.setValue(
        txConstants.INPUTS.SCRIPT_PUB_KEY,
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
      );

      const transactionState = OrderedDict.copy(this.transactionDict);
      transactionState.vals.inputs[i] = OrderedDict.copy(input);
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        new ReplaceLog(
          'script length',
          `${scriptLength}`,
          null,
          transactionState,
        ),
      );
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        new ReplaceLog(
          'script',
          `${scriptAsString}`,
          null,
          transactionState,
        ),
      );
      simpleAppend([inputLogger], this.logger.getValue(txConstants.SIGNED_INPUTS));
      // TODO is the logging for this logic still valid after the change?
      // this.transactionDict.vals.inputs[i] = input;
      signedInputs.push(input);
    }
    this.transactionDict.vals.inputs = signedInputs;
    // END TODO
    // TODO hashcode prob needs its own type
    this.transactionDict.remove(txConstants.HASH_CODE_TYPE);
  }

  appendVersionCode() {
    appendToTransaction(
      this.versionCode,
      this.transactionDict.getValue(txConstants.VERSION_CODE),
      this.transactionDict,
      this.logger.getValue(txConstants.VERSION_CODE),
      { appendTo: { arg: 'version_code', destination: 'transaction' } },
    );
  }

  appendLockTime() {
    appendToTransaction(
      this.lockTime,
      this.transactionDict.getValue(txConstants.LOCK_TIME),
      this.transactionDict,
      this.logger.getValue(txConstants.LOCK_TIME),
      { appendTo: { arg: 'lock_time', destination: 'transaction' } },
    );
  }

  appendHashCodeType() {
    appendToTransaction(
      this.hashCodeType,
      this.transactionDict.getValue(txConstants.HASH_CODE_TYPE),
      this.transactionDict,
      this.logger.getValue(txConstants.HASH_CODE_TYPE),
      { appendTo: { arg: 'hash_code_type', destination: 'transaction' } },
    );
  }

  appendRawInputs() {
    for (let i = 0; i < this.contributions.length; i += 1) {
      const contribution = this.contributions[i];
      const { txHash } = contribution;
      const { outputIndex } = contribution.output;
      const { scriptPubKey } = contribution.output;

      const inputLogger = new OrderedDict([
        txConstants.INPUTS.TRANSACTION_HASH,
        txConstants.INPUTS.TRANSACTION_INDEX,
        txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH,
        txConstants.INPUTS.SCRIPT_PUB_KEY,
        txConstants.INPUTS.SEQUENCE,
      ]);
      const input = new OrderedDict([
        txConstants.INPUTS.TRANSACTION_HASH,
        txConstants.INPUTS.TRANSACTION_INDEX,
        txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH,
        txConstants.INPUTS.SCRIPT_PUB_KEY,
        txConstants.INPUTS.SEQUENCE,
      ]);

      const txhashLE = utils.convertToLittleEndian(
        txHash,
        inputLogger.getValue(txConstants.INPUTS.TRANSACTION_HASH),
        { hexString: 'transaction_hash' },
      );
      appendTo(
        txhashLE,
        input.getValue(txConstants.INPUTS.TRANSACTION_HASH),
        input,
        inputLogger.getValue(txConstants.INPUTS.TRANSACTION_HASH),
        { appendTo: { destination: `input_${i}` } },
      );
      const outputIndexLE = utils.convertIntegerToLittleEndian(
        outputIndex,
        4,
        inputLogger.getValue(txConstants.INPUTS.TRANSACTION_INDEX),
        {
          convertIntegerToBytes_integer: 'transaction_output_index',
          hexString: 'transaction_output_index',
        },
      );
      appendTo(
        outputIndexLE,
        input.getValue(txConstants.INPUTS.TRANSACTION_INDEX),
        input,
        inputLogger.getValue(txConstants.INPUTS.TRANSACTION_INDEX),
        { appendTo: { destination: `input_${i}` } },
      );

      const scriptPubKeyLength = utils.getByteLengthInBytes(
        scriptPubKey,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH),
        { string: 'script_pub_key' },
      );
      appendTo(
        scriptPubKeyLength,
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH),
        input,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH),
        { appendTo: { destination: `input_${i}` } },
      );
      appendTo(
        scriptPubKey,
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        input,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { appendTo: { arg: 'script_pub_key', destination: `input_${i}` } },
      );

      // appending sequence
      appendTo(
        'ffffffff',
        input.getValue(txConstants.INPUTS.SEQUENCE),
        input,
        inputLogger.getValue(txConstants.INPUTS.SEQUENCE),
        { appendTo: { arg: 'sequence', destination: `input_${i}` } },
      );
      // Appending final input
      // append the input as an array
      simpleAppend([inputLogger], this.logger.getValue(txConstants.INPUTS.SELF));
      appendToTransaction(
        input,
        this.transactionDict.getValue(txConstants.INPUTS.SELF),
        this.transactionDict,
        this.logger.getValue(txConstants.INPUTS.SELF)[i],
        { appendTo: { arg: `input_${i}`, destination: 'transaction' } },
      );
    }
  }

  appendOutputs() {
    for (let i = 0; i < this.payments.length; i += 1) {
      const outputLogger = new OrderedDict([
        txConstants.OUTPUTS.TRANSACTION_AMOUNT,
        txConstants.OUTPUTS.OUTPUT_SCRIPT_LENGTH,
        txConstants.OUTPUTS.OUTPUT_SCRIPT,
      ]);
      const output = new OrderedDict([
        txConstants.OUTPUTS.TRANSACTION_AMOUNT,
        txConstants.OUTPUTS.OUTPUT_SCRIPT_LENGTH,
        txConstants.OUTPUTS.OUTPUT_SCRIPT,
      ]);

      const payment = this.payments[i];
      const amountLE = utils.convertIntegerToLittleEndian(
        payment.amount,
        8,
        outputLogger.getValue(txConstants.OUTPUTS.TRANSACTION_AMOUNT),
        {
          convertIntegerToBytes_integer: 'amount',
          hexString: 'amount',
        },
      );
      appendTo(
        amountLE,
        output.getValue(txConstants.OUTPUTS.TRANSACTION_AMOUNT),
        output,
        outputLogger.getValue(txConstants.OUTPUTS.TRANSACTION_AMOUNT),
        { appendTo: { destination: `output_${i}` } },
      );

      const outputScript = createOutputScript(
        payment.to,
        outputLogger.getValue(txConstants.OUTPUTS.OUTPUT_SCRIPT),
      );
      const outputScriptLength = utils.getByteLengthInBytes(
        outputScript,
        outputLogger.getValue(txConstants.OUTPUTS.OUTPUT_SCRIPT_LENGTH),
        { string: 'output_script' },
      );
      appendTo(
        outputScriptLength,
        output.getValue(txConstants.OUTPUTS.OUTPUT_SCRIPT_LENGTH),
        output,
        outputLogger.getValue(txConstants.OUTPUTS.OUTPUT_SCRIPT_LENGTH),
        { appendTo: { destination: `output_${i}` } },
      );
      appendTo(
        outputScript,
        output.getValue(txConstants.OUTPUTS.OUTPUT_SCRIPT),
        output,
        outputLogger.getValue(txConstants.OUTPUTS.OUTPUT_SCRIPT),
        { appendTo: { arg: 'output_script', destination: `output_${i}` } },
      );

      // Appending final output
      simpleAppend([outputLogger], this.logger.getValue(txConstants.OUTPUTS.SELF));
      appendToTransaction(
        output,
        this.transactionDict.getValue(txConstants.OUTPUTS.SELF),
        this.transactionDict,
        this.logger.getValue(txConstants.OUTPUTS.SELF)[i],
        { appendTo: { arg: `output_${i}`, destination: 'transaction' } },
      );
    }
  }

  pushtx(network = 'testnet') {
    const txString = utils.joinArray(this.transactionDict).join('');
    return services.pushtx(txString, network)
      .then(response => response)
      .catch((error) => {
        throw error;
      });
  }

  getRawString() {
    return utils.joinArray(this.transactionDict).join('');
  }

  getSize() {
    return utils.getByteLength(this.getRawString());
  }
}

const createSignedTransaction = (contributions, payments, privs) => {
  const modTx = new ModularTransaction(contributions, payments);
  modTx.createRawTransaction();
  modTx.signTransaction(privs);
  return modTx;
};

module.exports = {
  ModularTransaction,
  createSignedTransaction,
};
