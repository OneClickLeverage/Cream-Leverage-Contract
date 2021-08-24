const secret = require("../../secret.json");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect');

// Address & Key 
const user0 = secret.address0;
const user1 = secret.address1;
const user2 = secret.address2;
const user3 = secret.address3;

const key0 = secret.key0;
const key1 = secret.key1;
const key2 = secret.key2;
const key3 = secret.key3;

const dsa = new DSA({
  web3: web3,
  mode: "node",
  privateKey: key1
});


async function main() {

   const nonce = await web3.eth.getTransactionCount(user1);
   const gasPrice = await web3.eth.getGasPrice();

   await dsa.build({
       gasPrice: gasPrice,
       origin: user3,
       authority: user1,
       from: user1,
       nonce: nonce
   });

   const account = await dsa.getAccounts(user3);
   console.log("account: "+account[0].id);
   console.log("address: "+account[0].address);
   console.log("version: "+account[0].version);

   }

main();