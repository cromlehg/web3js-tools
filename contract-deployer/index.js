/* eslint-disable no-console, no-plusplus */

const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const os = require('os');

// ----------------------------------------------------------------------------
// personal data
// ----------------------------------------------------------------------------

const pubKey = '';
const privKey = '';
const httpProvider = '';
const contractsToDeploy = 3;
const maxAllowableGasPrice = 1000000000;

// ----------------------------------------------------------------------------
// helper functions
// ----------------------------------------------------------------------------

async function asyncForLoop(count, callback) {
  for (let index = 0; index < count; index++) {
    await callback(index);
  }
}

async function sendTransaction(params) {
  const {num, address, key, data, web3, successLog, errorLog, addressLog, maxGasPrice} = params;
  let logString = '';
  logString = logString + 'Transaction #' + num + os.EOL;
  let gasPrice = await web3.eth.getGasPrice();
  logString = logString + 'Median gas price: ' + gasPrice + os.EOL;
  if (gasPrice > maxGasPrice) {
    gasPrice = maxGasPrice;
    logString = logString + 'Median gas price exceeds the maximum allowable. Set gas price to: ' + gasPrice + os.EOL;
  }
  const nonce = await web3.eth.getTransactionCount(address);
  logString = logString + 'Nonce: ' + nonce + os.EOL;
  let gasLimit = await web3.eth.estimateGas({from: address, data});
  logString = logString + 'Gas limit: ' + gasLimit + os.EOL;
  const rawTx = {
    nonce,
    gasLimit,
    gasPrice,
    data,
    from: address
  };
  const tx = new Tx(rawTx);
  tx.sign(Buffer.from(key, 'hex'));
  const serializedTx = tx.serialize().toString('hex');
  console.log('Sending transaction #' + num);
  try {
    await web3.eth.sendSignedTransaction('0x' + serializedTx).on('receipt', receipt => {
      logString = logString + 'Success: Transaction successfully mined:' + os.EOL;
      logString = logString + JSON.stringify(receipt) + os.EOL;
      logString = logString + '---------------------------------------' + os.EOL;
      successLog.write(logString);
      addressLog.write(JSON.stringify(receipt.contractAddress).replace(/"/g, '') + os.EOL);
      console.log('Success');
      console.log('-------------------------');
    });
  } catch (e) {
    logString = logString + e + os.EOL;
    logString = logString + '---------------------------------------' + os.EOL;
    errorLog.write(logString);
    console.log('Error');
    console.log('-------------------------');
  }
}

// ----------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(httpProvider));
const bytecode = fs.readFileSync('contracts.bytecode').toString();
const successLog = fs.createWriteStream('log_success.txt', {flags: 'a'});
const errorLog = fs.createWriteStream('log_error.txt', {flags: 'a'});
const addressLog = fs.createWriteStream('log_address.txt', {flags: 'a'});

asyncForLoop(contractsToDeploy, async num => {
  console.log('counter: ', num);
  await sendTransaction({address: pubKey, key: privKey, data: bytecode, web3, successLog, errorLog, addressLog});
});

/* eslint-enable no-console, no-plusplus */
