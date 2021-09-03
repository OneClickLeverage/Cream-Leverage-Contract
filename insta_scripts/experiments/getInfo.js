const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');

const secret = require("../../secret.json");
const user1 = secret.address1;
const key1 = secret.key1;

// Abi & addressses
const erc20 = require("../constant/abi/basics/erc20.json");
const cToken = require("../constant/abi/external/cToken.json");
const oracle_abi = require("../constant/abi/external/oracle.json");
const oracle = new web3.eth.Contract(oracle_abi, "0x338EEE1F7B89CE6272f302bDC4b952C13b221f1d");
const {tokens} = require("../constant/dsa_cream2.js");

const dsa = new DSA({
  web3: web3,
  mode: "node",
  privateKey: key1
});

async function getDsaAddress(user_address) {
    const account = await dsa.getAccounts(user_address);
    console.log("account: "+account[0].address)
    return account[0].address;
}

async function getValue(user_address, coll, debt) {

   const _coll = new web3.eth.Contract(erc20, coll[0]);
   const _debt = new web3.eth.Contract(erc20, debt[0]);

   const coll_ctoken2 = new web3.eth.Contract(cToken, coll[2]);
   const debt_ctoken2 = new web3.eth.Contract(cToken, debt[2]);

   const dsaAddress = await getDsaAddress(user_address);

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

  // console.log("debt_value: "+debt_value)
  // console.log("coll_value: "+coll_value)

   return [coll_value, debt_value, coll_price, debt_price];
}

async function getRatio(user_address, coll_token_id, debt_token_id, withdraw_amt, payback_amt, action) {
  const coll = tokens[coll_token_id];
  const debt = tokens[debt_token_id];

   const [coll_value, debt_value, coll_price, debt_price] = await getValue(user_address, coll, debt);

   if (action == 0) { // current ratio
   const debt_ratio = debt_value / coll_value;
   console.log("debt_ratio: "+debt_ratio)
   return debt_ratio;

   } else if ( action == 1) { // only withdraw
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

//getRatio(0, 3, 0, 0, 0) // => Current Ratio

async function getLeverage(user_address, coll_token_id, debt_token_id) {
  const coll = tokens[coll_token_id];
  const debt = tokens[debt_token_id];

  const [coll_value, debt_value, coll_price, debt_price] = await getValue(user_address, coll, debt);
  const leverage = coll_value / (coll_value - debt_value);
  //console.log("leverage: "+leverage)
  return leverage;
}

//getLeverage(0, 3)

async function getLeveragedTotalColl(initial_coll, leverage) {
  const total_coll = initial_coll * leverage;
  //console.log("total_coll: "+total_coll)
  return total_coll;
}

getLeveragedTotalColl(3, 2)

// token_id, 0 = eth, 1 = wbtc, 2 = usdc, 3 = dai
async function getBorrowSupplyData(user_address, coll_token_id, debt_token_id) {
   const coll = tokens[coll_token_id];
   const debt = tokens[debt_token_id];

   const dsa_address = await getDsaAddress(user_address);

   //const coll_ctoken1 = new web3.eth.Contract(cToken, coll[1]);
   const coll_ctoken2 = new web3.eth.Contract(cToken, coll[2]);
   //const debt_ctoken1 = new web3.eth.Contract(cToken, debt[1]);
   const debt_ctoken2 = new web3.eth.Contract(cToken, debt[2]);

   const snapshot_c2 = await coll_ctoken2.methods.getAccountSnapshot(dsaAddress).call();
   const snapshot_d2 = await debt_ctoken2.methods.getAccountSnapshot(dsaAddress).call();

   const debt_amount = await snapshot_d2[2];
   const supply_amount = await snapshot_c2[1]*snapshot_c2[3]/(10**coll[4]);

   console.log("debt_amount: "+debt_amount)
   console.log("supply_amount: "+supply_amount)

}

//getBorrowSupplyData(0, 3)

// token_id, 0 = eth, 1 = wbtc, 2 = usdc, 3 = dai
async function getPrice(token_id) {
    const _usdc_eth = await oracle.methods.getUnderlyingPrice(tokens[2][2]).call();
    const eth_price = 1 / (_usdc_eth/(1E36/(10**tokens[2][4])));
    console.log("eth_price: "+eth_price)

    if (token_id == 0 ) {
        return eth_price;
    } else {
        const _price = await oracle.methods.getUnderlyingPrice(tokens[token_id][1]).call();
        const price = eth_price * (_price/(1E36/(10**tokens[token_id][4])));
        return price;   
    }
}

//getPrice(3)

async function getAssetAPYs(token_id) {
    const token = tokens[token_id];
    const ctoken = new web3.eth.Contract(cToken, token[2]);
    const borrow_rate = await ctoken.methods.borrowRatePerBlock().call();
    const supply_rate = await ctoken.methods.supplyRatePerBlock().call();

    const Mantissa = 10**token[4];
    const block_day = 6570;
    const block_year = 365;

    const borrowApy = (((Math.pow((borrow_rate / Mantissa * block_day) + 1, block_year))) - 1) * 100;
    const supplyApy = (((Math.pow((supply_rate / Mantissa * block_day) + 1, block_year))) - 1) * 100;
    console.log("borrowApy: "+borrowApy);
    console.log("supplyApy: "+supplyApy);
    return [borrowApy, supplyApy]
}

async function getNetAPY(coll_token_id, debt_token_id) {
    const [, supply_apy] = await getAssetAPYs(coll_token_id);
    const [borrow_apy, ] = await getAssetAPYs(debt_token_id);
    const net_apy = supply_apy - borrow_apy;
    console.log("net_apy: "+net_apy);
    return net_apy;
}

//getNetAPY(0, 3)

async function getLiquidationPrice(user_address, coll_token_id, debt_token_id, withdraw_amt, payback_amt) {
   const coll = tokens[coll_token_id];
   const debt = tokens[debt_token_id];

    const [coll_value, debt_value, coll_price, debt_price] = await getValue(user_address, coll, debt);
    const _coll_value = coll_value - withdraw_amt;

    const liquidation_price = debt_value / (_coll_value/coll_price) / coll[3];
    console.log("liquidation_price: "+liquidation_price);
    return liquidation_price;
}

//getLiquidationPrice(user1, 0, 3, 0, 0)

module.exports = {
   getValue, 
   getRatio,
   getLeverage,
   getLeveragedTotalColl,
   getBorrowSupplyData,
   getPrice,
   getAssetAPYs,
   getNetAPY,
   getLiquidationPrice
};
