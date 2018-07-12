/* eslint-disable no-console, no-plusplus */

const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');

// ----------------------------------------------------------------------------
// personal data
// ----------------------------------------------------------------------------

const pubKey = '';
const privKey = '';
const httpProvider = '';

// ----------------------------------------------------------------------------
// helper functions
// ----------------------------------------------------------------------------

async function asyncForLoop(count, callback) {
  for (let index = 0; index < count; index++) {
    await callback(index);
  }
}

async function sendTransaction(address, key, data, web3) {
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
  web3.eth.sendSignedTransaction('0x' + serializedTx)
    .on('receipt', receipt => {
      console.log('receipt: ' + receipt);
      fs.writeFileSync('receipt.json', JSON.stringify(receipt));
    })
    .on('error', (error) => {
      console.log(error);
      fs.writeFileSync('error.txt', error);
    });
}

// ----------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(httpProvider));
const bytecode = fs.readFileSync('contracts.bytecode').toString();

asyncForLoop(1, async (num) => {
  console.log('counter: ', num);
  await sendTransaction(pubKey, privKey, bytecode, web3);
});

/* eslint-enable no-console, no-plusplus */
