# BlockWit Register callback helper script
Script for registration of a large number of addresses.
Calculates gas price depending on **gas price oracle**.  
Use `minAllowableGasPrice` and `maxAllowableGasPrice` to specify the acceptable gas price range.
## How to run:
1. Place **addresses.txt** in the same folder as **index.js**.
2. Change **Personal data** section in **index.js** file:
  * `publicKey` - your **public key**
  * `privateKey` - **private key** corresponding to the **public key**
  * `httpProvider` - **infura link** with your personal token
  * `minAllowableGasPrice` - minimum allowable gas price in **Wei**
  * `maxAllowableGasPrice` - maximum allowable gas price in **Wei**
  * `contractAddress` - the address of the contract which method we will invoke
  * `contractABI` - ABI of the contract
  * `contractsMethod` - the name of the method, which we will invoke
3. Run `npm i`
4. Run `node index.js`
5. Wait until the script finishes

## Output:
Script generates 3 files:
* `log_success.txt` - transactions that have completed successfully
* `log_error.txt` - transactions that returned an error
* `log_address.txt` - addresses of successfully deployed contracts

Tested with **Node v9.5.0**
