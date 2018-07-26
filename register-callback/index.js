/* eslint-disable no-console, no-plusplus, no-constant-condition */

const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const os = require('os');

// ----------------------------------------------------------------------------
// personal data
// ----------------------------------------------------------------------------

const publicKey = '';
const privateKey = '';
const httpProvider = '';
const minAllowableGasPrice = 0;
const maxAllowableGasPrice = 1000000000;
const contractAddress = '';
const contractABI = [{
  'constant': false,
  'inputs': [{
    'name': 'callback',
    'type': 'address'
  }],
  'name': 'registerCallback',
  'outputs': [],
  'payable': false,
  'stateMutability': 'nonpayable',
  'type': 'function'
}];
const contractMethod = 'registerCallback';

// ----------------------------------------------------------------------------
// helper functions
// ----------------------------------------------------------------------------

function dec2hex(num) {
  return '0x' + Number(num).toString(16).toUpperCase();
}

function createLogStream() {
  const successStream = fs.createWriteStream('log_success.txt', {flags: 'a'});
  const errorStream = fs.createWriteStream('log_error.txt', {flags: 'a'});
  return () => {
    function Log() {
      let result = '';
      this.write = string => {
        result = result + string + os.EOL;
      };
      this.success = receipt => {
        this.write('Success: Transaction successfully mined:');
        this.write(JSON.stringify(receipt));
        this.write('--------------------------------------------------------------------------------');
        successStream.write(result);
      };
      this.error = error => {
        this.write(error);
        this.write('--------------------------------------------------------------------------------');
        errorStream.write(result);
      };
    }
    return new Log();
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getTransactionReceipt(web3, transactionHash) {
  while (true) {
    const receipt = await web3.eth.getTransactionReceipt(transactionHash);
    if (receipt) {
      return receipt;
    }
    await sleep(4000);
  }
}

async function sendTransaction(params) {
  const {
    contractABI,
    contractAddress,
    contractMethod,
    key,
    logStream,
    maxGasPrice,
    minGasPrice,
    nonce,
    num,
    sender,
    targetAddress,
    web3
  } = params;
  const log = logStream();
  log.write('Transaction #' + num);
  log.write('Nonce: ' + nonce);
  log.write('Parameter address: ' + targetAddress);
  const contract = new web3.eth.Contract(contractABI, contractAddress);
  const method = contract.methods[contractMethod](targetAddress);
  const data = method.encodeABI();
  let gasLimit = await web3.eth.estimateGas({to: contractAddress, from: sender, data});
  log.write('Gas limit: ' + gasLimit);
  let gasPrice = await web3.eth.getGasPrice();
  if (gasPrice > maxGasPrice) {
    gasPrice = maxGasPrice;
    log.write('Gas price oracle exceeds the maximum allowable. Setting gas price to:  ' + gasPrice);
  } else if (gasPrice < minGasPrice) {
    gasPrice = minGasPrice;
    log.write('Gas price oracle is below the minimum allowable. Setting gas price to: ' + gasPrice);
  } else {
    log.write('Gas price oracle is in the acceptable range. Setting gas price to:    ' + gasPrice);
  }
  const rawTx = {
    nonce: dec2hex(nonce),
    gasLimit: dec2hex(gasLimit),
    gasPrice: dec2hex(100 + gasPrice),
    data,
    from: sender,
    to: contractAddress
  };
  const tx = new Tx(rawTx);
  tx.sign(Buffer.from(key, 'hex'));
  const serializedTx = tx.serialize().toString('hex');
  const hash = '0x' + tx.hash().toString('hex');
  try {
    await web3.eth.sendSignedTransaction('0x' + serializedTx).on('receipt', receipt => {
      log.success(receipt);
    });
  } catch (e) {
    if (e.message.search(/Failed to check for transaction receipt/) !== -1) {
      log.write('Warning: Failed to check for transaction receipt. Using fallback function.');
      const receipt = await getTransactionReceipt(web3, hash);
      log.success(receipt);
    } else {
      log.error(e);
    }
  }
}

async function sendTransactions(params) {
  const {addresses, sender, web3} = params;
  const logStream = createLogStream();
  let nonce = await web3.eth.getTransactionCount(sender);
  for (let num = 0, length = addresses.length; num < length; num++) {
    const targetAddress = addresses[num];
    sendTransaction({...params, logStream, nonce, num, targetAddress});
    nonce = nonce + 1;
  }
}

// ----------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(httpProvider));
const addresses = fs.readFileSync('addresses.txt').toString().replace(/^\s+|\s+$/g, '').split(/\s+/);
sendTransactions({
  addresses,
  contractAddress,
  contractABI,
  contractMethod,
  key: privateKey,
  maxGasPrice: maxAllowableGasPrice,
  minGasPrice: minAllowableGasPrice,
  sender: publicKey,
  web3
});

/* eslint-enable no-console, no-plusplus, no-constant-condition */
