const { Buffer } = require('buffer/');
const BN = require('bn.js');
const utils = require('./utils');

const { log } = require('./logger');
const { OrderedDict } = require('./dataStructures');
const services = require('./services/services');

const N = new BN('115792089237316195423570985008687907852837564279074904382605163141518161494337');

class p2pkh {
  static createScript(recipientAddress) {
    const decodedAddress = utils.b58decode(recipientAddress);
    // Remove checksum and network bytes
    const pubKeyHash = utils.stripAddress(decodedAddress);

    const OP_DUP = 118;
    const OP_HASH160 = 169;
    // const bytesToPush = getByteLength(pubKeyHash).toString(16);
    const bytesToPush = 14;
    const OP_EQUALVERIFY = 136;
    const OP_CHECKSIG = 172;

    return [
      OP_DUP.toString(16),
      OP_HASH160.toString(16),
      bytesToPush,
      pubKeyHash,
      OP_EQUALVERIFY.toString(16),
      OP_CHECKSIG.toString(16),
    ].join('');
  }
}

function createOutputScript(address, type = p2pkh, logger) {
  const p2pkhScript = p2pkh.createScript(address);
  log(logger, new utils.Tuple('Create p2pkh script', p2pkhScript));
  return p2pkhScript;
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


function appendTo(arg, array, logger = null, xtemplate = {}) {
  array.push(arg);
  if (logger) {
    log(logger, [
      `Append ${xtemplate.appendTo.arg || arg} to ${xtemplate.appendTo.destination || array.join('')}`,
    ]);
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

  createRawTransaction() {
    this.appendVersionCode();

    const inputCount = utils.convertIntegerToBytes(
      this.contributions.length, 1, this.logger.getValue(txConstants.INPUT_COUNT),
    );
    appendTo(
      inputCount,
      this.transactionDict.getValue(txConstants.INPUT_COUNT),
      this.logger.getValue(txConstants.INPUT_COUNT),
      { appendTo: { destination: 'transaction' } },
    );

    this.appendRawInputs();

    const outputCount = utils.convertIntegerToBytes(
      this.payments.length, 1, this.logger.getValue(txConstants.OUTPUT_COUNT),
    );
    appendTo(
      outputCount,
      this.transactionDict.getValue(txConstants.OUTPUT_COUNT),
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
        ['Set the scriptPubKey of every other input to be empty'],
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
          this.transactionDict.vals.inputs[j].vals[txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH] = '00';
          this.transactionDict.vals.inputs[j].vals[txConstants.INPUTS.SCRIPT_PUB_KEY] = '';
        }
      }
      const input = OrderedDict.copy(rawInputi);
      input.setValue(txConstants.INPUTS.SCRIPT_PUB_KEY, []);

      const transaction = utils.joinArray(this.transactionDict).join('');
      const hashedTx = utils.sha256(
        transaction,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { hexString: 'raw transaction' },
      );
      const doubleHashedTx = utils.sha256(
        hashedTx,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { hexString: 'hash of raw transaction' },
      );
      const keypair = utils.ecdsaFromPriv(privateKeys[i], inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY));
      const signedTx = keypair.sign(doubleHashedTx);
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        new utils.Tuple(
          `Sign ${doubleHashedTx} with private key`,
          `r value: ${signedTx.r.toString()}`,
          `s value: ${signedTx.s.toString()}`,
        ),
      );

      // https://github.com/vbuterin/pybitcointools/issues/89
      if (signedTx.s.gt(N.div(new BN('2')))) {
        signedTx.s = N.sub(signedTx.s);
        log(
          inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
          new utils.Tuple(
            'Modify s value to be N - s (s value too big)',
            `${signedTx.r.toString()} - ${N.toString()}`,
            signedTx.s.toString(),
          ),
        );
      }
      const signedTxDER = Buffer.from(signedTx.toDER()).toString('hex');
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        new utils.Tuple(
          'DER encode signature',
          signedTxDER,
        ),
      );
      // append one byte hash code
      const txHEX = `${signedTxDER}01`;
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        new utils.Tuple(
          'Add one byte hash code to DER encoded signature',
          txHEX,
        ),
      );

      const signatureLength = utils.getByteLengthInBytes(
        txHEX,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { string: 'signature' },
      );
      appendTo(
        signatureLength,
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { appendTo: { destination: 'signed scriptPubKey' } },
      );
      appendTo(
        txHEX,
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { appendTo: { destination: 'signed scriptPubKey' } },
      );

      const publicKey = keypair.getPublic().encode('hex');
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        new utils.Tuple(
          'Derive public key from private key',
          publicKey,
        ),
      );

      const encodedPub = utils.encodePub(publicKey, inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY));

      const publicKeyLength = utils.getByteLengthInBytes(
        encodedPub,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { string: 'public key' },
      );
      appendTo(
        publicKeyLength,
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { appendTo: { destination: 'signed scriptPubKey' } },
      );
      appendTo(
        encodedPub,
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { appendTo: { destination: 'signed scriptPubKey' } },
      );

      input.setValue(
        txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH,
        [utils.getByteLengthInBytes(input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY).join(''))],
      );
      input.setValue(
        txConstants.INPUTS.SCRIPT_PUB_KEY,
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
      );
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        ['Replace scriptPubKey length with signature length'],
      );
      log(
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        ['Replace scriptPubKey with signature'],
      );
      appendTo(inputLogger, this.logger.getValue(txConstants.SIGNED_INPUTS));
      // TODO is the logging for this logic still valid after the change?
      signedInputs.push(input);
    }
    this.transactionDict.vals.inputs = signedInputs;
    // END TODO
    this.transactionDict.remove(txConstants.HASH_CODE_TYPE);
  }

  appendVersionCode() {
    appendTo(
      this.versionCode,
      this.transactionDict.getValue(txConstants.VERSION_CODE),
      this.logger.getValue(txConstants.VERSION_CODE),
      { appendTo: { arg: 'version code', destination: 'transaction' } },
    );
  }

  appendLockTime() {
    appendTo(
      this.lockTime,
      this.transactionDict.getValue(txConstants.LOCK_TIME),
      this.logger.getValue(txConstants.LOCK_TIME),
      { appendTo: { arg: 'lock time', destination: 'transaction' } },
    );
  }

  appendHashCodeType() {
    appendTo(
      this.hashCodeType,
      this.transactionDict.getValue(txConstants.HASH_CODE_TYPE),
      this.logger.getValue(txConstants.HASH_CODE_TYPE),
      { appendTo: { arg: 'hash code type', destination: 'transaction' } },
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
        { hexString: 'transaction hash' },
      );
      appendTo(
        txhashLE,
        input.getValue(txConstants.INPUTS.TRANSACTION_HASH),
        inputLogger.getValue(txConstants.INPUTS.TRANSACTION_HASH),
        { appendTo: { destination: `input ${i}` } },
      );
      const outputIndexLE = utils.convertIntegerToLittleEndian(
        outputIndex,
        4,
        inputLogger.getValue(txConstants.INPUTS.TRANSACTION_INDEX),
        { hexString: 'transaction output index' },
      );
      appendTo(
        outputIndexLE,
        input.getValue(txConstants.INPUTS.TRANSACTION_INDEX),
        inputLogger.getValue(txConstants.INPUTS.TRANSACTION_INDEX),
        { appendTo: { destination: `input ${i}` } },
      );

      const scriptPubKeyLength = utils.getByteLengthInBytes(
        scriptPubKey,
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH),
        { string: 'scriptPubKey' },
      );
      appendTo(
        scriptPubKeyLength,
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH),
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY_LENGTH),
        { appendTo: { destination: `input ${i}` } },
      );
      appendTo(
        scriptPubKey,
        input.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        inputLogger.getValue(txConstants.INPUTS.SCRIPT_PUB_KEY),
        { appendTo: { arg: 'scriptPubKey', destination: `input ${i}` } },
      );

      // appending sequence
      appendTo(
        'ffffffff',
        input.getValue(txConstants.INPUTS.SEQUENCE),
        inputLogger.getValue(txConstants.INPUTS.SEQUENCE),
        { appendTo: { arg: 'sequence', destination: `input ${i}` } },
      );
      // Appending final input
      appendTo(inputLogger, this.logger.getValue(txConstants.INPUTS.SELF));
      appendTo(
        input,
        this.transactionDict.getValue(txConstants.INPUTS.SELF),
        this.logger.getValue(txConstants.INPUTS.SELF),
        { appendTo: { arg: `input ${i}`, destination: 'transaction' } },
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
        { hexString: 'amount' },
      );
      appendTo(
        amountLE,
        output.getValue(txConstants.OUTPUTS.TRANSACTION_AMOUNT),
        outputLogger.getValue(txConstants.OUTPUTS.TRANSACTION_AMOUNT),
        { appendTo: { destination: `output ${i}` } },
      );

      const outputScript = createOutputScript(payment.to);
      const outputScriptLength = utils.getByteLengthInBytes(
        outputScript,
        outputLogger.getValue(txConstants.OUTPUTS.TRANSACTION_AMOUNT),
        { string: 'output script' },
      );
      appendTo(
        outputScriptLength,
        output.getValue(txConstants.OUTPUTS.OUTPUT_SCRIPT_LENGTH),
        outputLogger.getValue(txConstants.OUTPUTS.OUTPUT_SCRIPT_LENGTH),
        { appendTo: { destination: `output ${i}` } },
      );
      appendTo(
        outputScript,
        output.getValue(txConstants.OUTPUTS.OUTPUT_SCRIPT),
        outputLogger.getValue(txConstants.OUTPUTS.OUTPUT_SCRIPT),
        { appendTo: { arg: 'output script', destination: `output ${i}` } },
      );

      // Appending final output
      appendTo(outputLogger, this.logger.getValue(txConstants.OUTPUTS.SELF));
      appendTo(
        output,
        this.transactionDict.getValue(txConstants.OUTPUTS.SELF),
        this.logger.getValue(txConstants.OUTPUTS.SELF),
        { appendTo: { arg: `output ${i}`, destination: 'transaction' } },
      );
    }
  }

  pushtx() {
    const txString = utils.joinArray(this.transactionDict).join('');
    return services.pushtx(txString)
      .then(response => response)
      .catch((error) => {
        throw error;
      });
  }
}

module.exports = {
  ModularTransaction,
};
