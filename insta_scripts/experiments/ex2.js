const secret = require("../../secret.json");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect');

//https://github.com/Instadapp/dsa-connect/blob/master/src/addresses/mainnet/connectorsV2_M1.ts

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

   const amount = web3.utils.toWei('1', 'ether');

   if(!getDsaId())  {
       await build();
   }  

   const dsaId = await getDsaId();
   await dsa.setInstance(dsaId);

   let spells = await dsa.Spell();
   spells = await addSpell(spells, amount);

   await cast(spells, amount);
   
   const dsaAddress = await getDsaAddress();
   const dsa_balance = await web3.eth.getBalance(dsaAddress);
   const user_balance = await web3.eth.getBalance(user1);

   console.log("DSA balance: "+dsa_balance);
   console.log("User balance: "+user_balance);
   console.log("Done!");

   }

main();

async function build() {
   
   const gasPrice = await web3.eth.getGasPrice();
   const nonce = await web3.eth.getTransactionCount(user1);

   await dsa.build({
       gasPrice: gasPrice,
       origin: user3,
       authority: user1,
       from: user1,
       nonce: nonce
   });  
}

async function getDsaId() {
    const account = await dsa.getAccounts(user1);
    return account[0].id;
}

async function getDsaAddress() {
    const account = await dsa.getAccounts(user1);
    return account[0].address;
}

async function addSpell(spells, amount) {
    //BASIC-A 0x9926955e0Dd681Dc303370C52f4Ad0a4dd061687

    /*
    spells.add({
      connector: "BASIC-A",
      method: "deposit",
      args: [
       "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
       amount, // 100 * 10^18 wei
       0,
       0
      ]
      })
    */

    spells.add({
      connector: "COMPOUND-A",
      method: "deposit",
      args: [
       "ETH-A",
       amount, // 100 * 10^18 wei
       0,
       0
      ]
     })

    console.log(dsa.instance)
    console.log(dsa.encodeSpells(spells))

    return spells;
}

async function cast(spells, amount) {

   const gasPrice = await web3.eth.getGasPrice();
   const nonce = await web3.eth.getTransactionCount(user1);

   const transactionHash = await spells.cast({
       gasPrice: gasPrice,
       //value: amount,
       nonce: nonce
   });

   console.log("transactionHash: "+transactionHash)
}