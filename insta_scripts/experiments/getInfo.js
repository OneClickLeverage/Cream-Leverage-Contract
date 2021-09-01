const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');

const secret = require("../../secret.json");
const key1 = secret.key1;

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

async function getRatio(coll, debt, withdraw_amt, payback_amt, action) {

   const [coll_value, debt_value, coll_price, debt_price] = await getValue(coll, debt);

   if ( action == 0 ) { // current ratio
   const debt_ratio = debt_value / coll_value;
   return debt_ratio;

   } else if ( action == 1) { // interim ratio && only withdraw
   const _coll_value = coll_value - (withdraw_amt*coll_price);
   const debt_ratio = debt_value / _coll_value;
   return debt_ratio;

   } else if ( action == 2 ) { // only payback
   const _debt_value = debt_value - (payback_amt*debt_price);
   const debt_ratio = _debt_value / coll_value;
   return debt_ratio;

   } else if ( action == 3) { // projected ratio 1: deleverage ( withdraw & payback )
   const _coll_value = coll_value - (withdraw_amt*coll_price);
   const _debt_value = debt_value - (payback_amt*debt_price);
   const debt_ratio = _debt_value / _coll_value;
   return debt_ratio;

   }

}

async function getLeverage(coll, debt) {
  const [coll_value, debt_value, coll_price, debt_price] = await getValue(coll, debt);
  const leverage_ratio = coll_value / (coll_value - debt_value);

  return leverage_ratio;

}

async function getPaybackAmt(coll, debt, leverage, withdraw_amt) {
  const [coll_value, debt_value, coll_price, debt_price] = await getValue(coll, debt);
  const _coll_value = coll_value - (withdraw_amt * coll_price)
  const payback_amt = parseInt(debt_value - ((_coll_value/(10**(coll[4]-debt[4])) / leverage)), 10);

  console.log("payback_amt: "+payback_amt)

  return payback_amt;

}


async function getValue(coll, debt) {

   const _coll = new web3.eth.Contract(erc20, coll[0]);
   const _debt = new web3.eth.Contract(erc20, debt[0]);

   const coll_ctoken2 = new web3.eth.Contract(cToken, coll[2]);
   const debt_ctoken2 = new web3.eth.Contract(cToken, debt[2]);

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
   const debt_value = debt_amount * debt_price / (10**debt[4]);
   const coll_value = supply_amount * coll_price / (10**coll[4]);

  console.log("debt_value: "+debt_value)
  console.log("coll_value: "+coll_value)

   return [coll_value, debt_value, coll_price, debt_price];
}



async function getDsaAddress() {
    const account = await dsa.getAccounts(user1);
    return account[0].address;
}

module.exports = {
   getRatio,
   getPaybackAmt,
   getLeverage
};
