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

// ----------------------------------------------------------------------------
// helper functions
// ----------------------------------------------------------------------------

async function asyncForLoop(count, callback) {
  for (let index = 0; index < count; index++) {
    await callback(index);
  }
}

async function sendTransaction(params) {
  const {address, key, data, web3, successLog, errorLog, addressLog} = params;
  const gasPrice = await web3.eth.getGasPrice();
  console.log('Gas price: ' + gasPrice);
  const nonce = await web3.eth.getTransactionCount(address);
  console.log('Nonce: ' + nonce);
  const gasLimit = await web3.eth.estimateGas({from: address, data});
  console.log('Gas limit: ' + gasLimit);
  const rawTx = {
    nonce,
    gasLimit,
    gasPrice: Buffer.from(gasPrice, 'hex'),
    data,
    from: address
  };
  const privateKey = Buffer.from(key, 'hex');
  const tx = new Tx(rawTx);
  tx.sign(privateKey);
  const serializedTx = tx.serialize().toString('hex');
  await web3.eth.sendSignedTransaction('0x' + serializedTx)
    .on('receipt', receipt => {
      console.log('success');
      successLog.write(JSON.stringify(receipt) + os.EOL);
      addressLog.write(JSON.stringify(receipt.contractAddress).replace(/"/g, '') + os.EOL);
    })
    .on('error', (error) => {
      console.log('error');
      errorLog.write(error + os.EOL);
    });
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
