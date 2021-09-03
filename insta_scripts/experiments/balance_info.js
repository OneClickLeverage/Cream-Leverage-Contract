const secret = require("../../secret.json");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');

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
const usdc_address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const wbtc_address = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599";
//0x7a250d5630b4cf539739df2c5dacb4c659f2488d

// Amount 
const amount_1 = web3.utils.toWei('1', 'ether');
const amount_5 = web3.utils.toWei('5', 'ether');
const amount_10 = web3.utils.toWei('10', 'ether');
const amount_100 = web3.utils.toWei('100', 'ether');

// Abi & addressses
const erc20 = require("../constant/abi/basics/erc20.json");
const cToken = require("../constant/abi/external/cToken.json");
const oracle_abi = require("../constant/abi/external/oracle.json");
const oracle = new web3.eth.Contract(oracle_abi, "0x338EEE1F7B89CE6272f302bDC4b952C13b221f1d");
const dsaAddress = "0x33791c463b145298c575b4409d52c2bcf743bf67";
const {tokens} = require("../constant/dsa_cream2.js");

const dsa = new DSA({
  web3: web3,
  mode: "node",
  privateKey: key1
});

async function balanceCheck(coll, debt) {

   const _coll = new web3.eth.Contract(erc20, coll[0]);
   const _debt = new web3.eth.Contract(erc20, debt[0]);

   const coll_ctoken1 = new web3.eth.Contract(cToken, coll[1]);
   const coll_ctoken2 = new web3.eth.Contract(cToken, coll[2]);
   const debt_ctoken1 = new web3.eth.Contract(cToken, debt[1]);
   const debt_ctoken2 = new web3.eth.Contract(cToken, debt[2]);

   const dsa_coll_balance = await _coll.methods.balanceOf(dsaAddress).call();
   const dsa_debt_balance = await _debt.methods.balanceOf(dsaAddress).call();

   const dsa_c1_balance = await coll_ctoken1.methods.balanceOf(dsaAddress).call();
   const dsa_c2_balance = await coll_ctoken2.methods.balanceOf(dsaAddress).call();
   const dsa_d1_balance = await debt_ctoken1.methods.balanceOf(dsaAddress).call();
   const dsa_d2_balance = await debt_ctoken2.methods.balanceOf(dsaAddress).call();

   const snapshot_c2 = await coll_ctoken2.methods.getAccountSnapshot(dsaAddress).call();
   const snapshot_d2 = await debt_ctoken2.methods.getAccountSnapshot(dsaAddress).call();

   const debt_amount = await snapshot_d2[2];
   const supply_amount = await snapshot_c2[1]*snapshot_c2[3]/(10**coll[4]);

   // Fetch Eth Price
   const _usdc_eth = await oracle.methods.getUnderlyingPrice(tokens[2][2]).call();
   const eth_price = 1 / (_usdc_eth/(1E36/(10**tokens[2][4])));

   // Fetch coll and debt prices
   const _coll_price = await oracle.methods.getUnderlyingPrice(coll[1]).call();
   const coll_price = eth_price * (_coll_price/(1E36/(10**coll[4])));
   const _debt_price = await oracle.methods.getUnderlyingPrice(debt[1]).call();
   const debt_price = eth_price * (_debt_price/(1E36/(10**debt[4])));

   // Calcu Debt Ratio
   const debt_value = debt_amount/(10**debt[4]) * debt_price;
   const coll_value = supply_amount/(10**coll[4]) * coll_price;
   const debt_ratio = debt_value / coll_value;
  
  // Output
   console.log("");
   console.log("-- Balance -- ");
   console.log("dsaAddress: "+dsaAddress);
   console.log("DSA Coll: "+dsa_coll_balance/(10**coll[4]));
   console.log("DSA coll CToken2: "+dsa_c2_balance/1E8);
   console.log("");
   console.log("Total Debt: "+debt_amount/(10**debt[4]));
   console.log("Total Collateral: "+supply_amount/(10**coll[4]));
   console.log("Debt Ratio: "+parseFloat(debt_ratio*100).toFixed(3)+"%");
   console.log(""); 
   console.log("coll_price: "+coll_price);
   console.log("debt_price: "+debt_price);

   console.log("");
   
}

const coll = tokens[0];
const debt = tokens[2];
//balanceCheck(coll, debt);


async function getDsaAddress() {
    const account = await dsa.getAccounts(user1);
    return account[0].address;
}

module.exports = {
   balanceCheck
};
