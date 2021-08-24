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

// Token Addresses
const eth_address = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const weth_address = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const dai_address = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const usds_address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const uni_address = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";


// Amount 
const amount_1 = web3.utils.toWei('1', 'ether');
const amount_5 = web3.utils.toWei('5', 'ether');
const amount_10 = web3.utils.toWei('10', 'ether');
const amount_100 = web3.utils.toWei('100', 'ether');

// Abi
const uni_abi = require("../constant/abi/external/uniswap.json")
const erc20 = require("../constant/abi/basics/erc20.json");
const cToken = require("../constant/abi/external/cToken.json");

const dsa = new DSA({
  web3: web3,
  mode: "node",
  privateKey: key1
});


async function main() {

   let bool = await hasDSA(user1);

   if(!bool)  { await build(); }  

   dsaId = await getDsaId();
   await dsa.setInstance(dsaId);

   let spells = await dsa.Spell();
   spells = await addSpell(spells);

   await cast(spells);

   await balanceCheck();
   console.log("Done!");
   }

main();

async function balanceCheck() {

   const erc = new web3.eth.Contract(erc20, dai_address);
   const ctoken = new web3.eth.Contract(cToken, "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5");

   const dsaAddress = await getDsaAddress();
   const dsa_balance = await web3.eth.getBalance(dsaAddress);
   const dsa_dai_balance = await erc.methods.balanceOf(dsaAddress).call();
   const user_balance = await web3.eth.getBalance(user1);
   const user_dai_balance = await erc.methods.balanceOf(user1).call();

   console.log("");
   console.log("-- Balance -- ");
   console.log("DSA ETH: "+dsa_balance);
   console.log("DSA DAI: "+dsa_dai_balance);
   console.log("User ETH: "+user_balance);
   console.log("User DAI: "+user_dai_balance);
   console.log("");
}

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

async function hasDSA(address) {
    const account = await dsa.getAccounts(address);
    return account[0];
}

async function getDsaId() {
    const account = await dsa.getAccounts(user1);
    return account[0].id;
}

async function getDsaAddress() {
    const account = await dsa.getAccounts(user1);
    return account[0].address;
}

async function addSpell(spells) {

    await spells.add({
      connector: "BASIC-A",
      method: "deposit",
      args: [
       "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
       amount_10, // 5ETH
       0,
       0
      ]
      });

    const uni_pair = [weth_address, dai_address];
    const uni = new web3.eth.Contract(uni_abi, uni_address);
    const result = await uni.methods.getAmountsOut(amount_10, uni_pair).call();

    await spells.add({
      connector: "UNISWAP-V2-A",
      method: "sell",
      args: [
       dai_address,
       weth_address,
       amount_10, // buy 3ETH with 11000DAI 
       0, // unit Amount 
       0,
       0
      ]
     });

    await spells.add({
      connector: "BASIC-A",
      method: "withdraw",
      args: [
       dai_address,
       result[1], // 5ETH
       user1,
       0,
       0
      ]
      });
      

    console.log(dsa.instance)
    console.log(dsa.encodeSpells(spells))

    return spells;
}

async function cast(spells, amount) {

   const gasPrice = await web3.eth.getGasPrice();
   const nonce = await web3.eth.getTransactionCount(user1);

   const transactionHash = await spells.cast({
       gasPrice: gasPrice,
       value: amount_10,
       nonce: nonce
   });

   console.log("transactionHash: "+transactionHash)
}