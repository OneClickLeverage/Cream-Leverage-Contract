const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');

const secret = require("../../secret.json");
const user1 = secret.address1;
const key1 = secret.key1;

// Abi
const uni_abi = require("../constant/abi/external/uniswap.json");
const oracle_abi = require("../constant/abi/external/oracle.json");
const cToken = require("../constant/abi/external/cToken.json");

// Contract Instances
const uni = new web3.eth.Contract(uni_abi, "0x7a250d5630b4cf539739df2c5dacb4c659f2488d");
const oracle = new web3.eth.Contract(oracle_abi, "0x338EEE1F7B89CE6272f302bDC4b952C13b221f1d");

// token data
const { tokens } = require("../constant/dsa_cream2.js");

const { getDsaAddress } = require("./dsa.js");

// const dsa = new DSA({
//   web3: web3,
//   mode: "node",
//   privateKey: key1
// });

async function getValue(dsa, user_address, coll, debt) {

  const [supply_amount, debt_amount] = await getAccountData(dsa, user_address, coll, debt);

  const coll_price = await getPrice(coll);
  const debt_price = await getPrice(debt);

  // Calcu Debt Ratio
  const debt_value = debt_amount * debt_price / debt[4];
  const coll_value = supply_amount * coll_price / coll[4];

  return [coll_value, debt_value];
}

async function getDebtRatio(dsa, user_address, coll, debt, coll_change, debt_change, action) {
  const [coll_value, debt_value] = await getValue(dsa, user_address, coll, debt);
  const coll_price = await getPrice(coll)
  const debt_price = await getPrice(debt)
  const hasPosition = await getHasPosition(dsa, user_address, coll, debt);

  let debt_ratio;

  if (action == 0 || !hasPosition) { // expected ratio
    const _coll_value = coll_change * coll_price;
    const _debt_value = debt_change * debt_price;
    debt_ratio = _debt_value / (_coll_value+_debt_value) || 0;
    //console.log("0: " + debt_ratio);

  } else if (action == 1 && hasPosition) { // current ratio
    debt_ratio = debt_value / coll_value;
    //console.log("1: " + debt_ratio);

  } else if (action == 2 && hasPosition) { // For Leverage 
    const _coll_value = coll_value + (coll_change * coll_price);
    const additional_debt_value = debt_change * debt_price
    const _debt_value = debt_value + additional_debt_value;
    debt_ratio = _debt_value / (_coll_value + additional_debt_value);
    //console.log("2: " + debt_ratio);

  } else if (action == 3 && hasPosition) { // For Deleverage
    const _coll_value = coll_value - (coll_change * coll_price);
    const additional_debt_value = debt_change * debt_price
    const _debt_value = debt_value - additional_debt_value;
    debt_ratio = _debt_value / (_coll_value - additional_debt_value);
    //console.log("3: " + debt_ratio);

  } else {
    return;
  }
  return debt_ratio;
}

async function getHasPosition(dsa, user_address, coll, debt) {
  const [coll_amt, debt_amt] = await getAccountData(dsa, user_address, coll, debt);
  let hasPosition;
  if (coll_amt != 0 || debt_amt != 0) {
    hasPosition = true;
    //console.log("hasPosition: " + hasPosition);
  } else {
    hasPosition = false;
    //console.log("hasPosition: " + hasPosition);
  }
  return hasPosition;
}

//hasPosition(dsa, user1, tokens[0], tokens[2]);

async function getCurrentLeverage(dsa, user_address, coll, debt) {
  const [coll_value, debt_value] = await getValue(dsa, user_address, coll, debt);
  const leverage = coll_value / (coll_value - debt_value);
  //console.log("current leverage: "+leverage)
  return leverage;
}

//getLeverage(0, 3)

async function getLeverage(coll, debt, initial_coll, debt_amount, price_impact) {
  const borrow_amt_coll = await getBorrowAmtColl(coll, debt, debt_amount, price_impact)
  const leverage = (borrow_amt_coll + initial_coll) / initial_coll;
  return leverage;
}

//getLeverageFromFront(0, 3)

async function getLeveragedDebtandColl(debt, initial_coll, leverage) {
  const total_coll = initial_coll * leverage;
  const debt_price = await getPrice(debt);
  const debt_amount = (total_coll - initial_coll) * debt_price;
  return [total_coll, debt_amount];
}

//getLeveragedDebtandColl(3, 2)

// token_id, 0 = eth, 1 = wbtc, 2 = usdc, 3 = dai
async function getAccountData(dsa, user_address, coll, debt) {
  const dsaAddress = await getDsaAddress(dsa, user_address);
  if (!dsaAddress) {
    return [0,0]
  }

  const coll_ctoken = new web3.eth.Contract(cToken, coll[2]);
  const debt_ctoken = new web3.eth.Contract(cToken, debt[2]);

  const snapshot_c2 = await coll_ctoken.methods.getAccountSnapshot(dsaAddress).call();
  const snapshot_d2 = await debt_ctoken.methods.getAccountSnapshot(dsaAddress).call();

  const debt_amount = await snapshot_d2[2];
  const supply_amount = await snapshot_c2[1] * snapshot_c2[3] / coll[4];

  return [supply_amount, debt_amount]

}

//getBorrowSupplyData(0, 3)

// token_id, 0 = eth, 1 = wbtc, 2 = usdc, 3 = dai
async function getPrice(token) {
  const _usdc_eth = await oracle.methods.getUnderlyingPrice(tokens[2][2]).call();
  const eth_price = 1 / (_usdc_eth / (1E36 / tokens[2][4]));
  //console.log("eth_price: " + eth_price)

  if (token[5] == "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
    return eth_price;
  } else {
    const _price = await oracle.methods.getUnderlyingPrice(token[1]).call();
    const price = eth_price * (_price / (1E36 / token[4]));
    //console.log("price: " + price)
    return price;
  }
}

//getPrice(tokens[3])

async function getAssetAPYs(token_id) {
  const token = tokens[token_id];
  const ctoken = new web3.eth.Contract(cToken, token[2]);
  const borrow_rate = await ctoken.methods.borrowRatePerBlock().call();
  const supply_rate = await ctoken.methods.supplyRatePerBlock().call();

  const Mantissa = token[4];
  const block_day = 6570;
  const block_year = 365;

  const borrowApy = (((Math.pow((borrow_rate / Mantissa * block_day) + 1, block_year))) - 1) * 100;
  const supplyApy = (((Math.pow((supply_rate / Mantissa * block_day) + 1, block_year))) - 1) * 100;
  return [borrowApy, supplyApy]
}

async function getNetAPY(coll_token_id, debt_token_id) {
  const [, supply_apy] = await getAssetAPYs(coll_token_id);
  const [borrow_apy,] = await getAssetAPYs(debt_token_id);
  const net_apy = supply_apy - borrow_apy;
  return net_apy;
}

//getNetAPY(0, 3)

async function getLiquidationPrice(dsa, user_address, coll, debt, coll_change, debt_change, action) {

  const coll_price = await getPrice(coll)
  const debt_price = await getPrice(debt)
  const hasPosition = await getHasPosition(dsa, user_address, coll, debt);

  let liquidation_price;

  if (action == 0 || !hasPosition) { // Expected Liquidation Price
    const debt_value = debt_price * debt_change;
    liquidation_price = debt_value / coll_change / coll[7] || 0;
  } else if (action == 1) { // Current Liquidation Price
    const [coll_value, debt_value] = await getValue(dsa, user_address, coll, debt);
    liquidation_price = debt_value / (coll_value / coll_price) / coll[7];
    //console.log("1: " + liquidation_price);

  } else if (action == 2) { // Liquidation Price for Leverage(more deposit and borrow)
    const [coll_value, debt_value] = await getValue(dsa, user_address, coll, debt);
    const _coll_value = coll_value + (coll_change * coll_price);
    const additional_debt_value = debt_change * debt_price
    const _debt_value = debt_value + additional_debt_value;
    liquidation_price = _debt_value / ((_coll_value + additional_debt_value) / coll_price) / coll[7];
    //console.log("2 " + liquidation_price);

  } else if (action == 3) { // Liquidation Price for Deleverage(less deposit and debt)
    const [coll_value, debt_value] = await getValue(dsa, user_address, coll, debt);
    const _coll_value = coll_value - (coll_change * coll_price);
    const additional_debt_value = debt_change * debt_price
    const _debt_value = debt_value - additional_debt_value;
    liquidation_price = _debt_value / ((_coll_value+additional_debt_value) / coll_price) / coll[7];
    //console.log("3: " + liquidation_price);

  } else {
    return;
  }

  return liquidation_price;
}

//getLiquidationPrice(dsa, "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", 0, 2, 1, 2000, 0)
//getLiquidationPrice(dsa, "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", 0, 2, 0, 0, 1)
//getLiquidationPrice(dsa, "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", 0, 2, 1, 3000, 2)
//getLiquidationPrice(dsa, "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", 0, 2, 1, 3000, 3)


async function isFlashloanLev(coll, leverage) {
  const lev_max = coll[3] + 1;
  //console.log("lev_max" + lev_max)
  if (leverage >= lev_max) {
    return 0; // flashloan
  } else {
    return 1; // loop
  }
}

async function isFlashloanDelev(dsa, user_address, coll, debt, withdraw_amt) {

  //const interim_debt_ratio = await getRatio(user_address, coll, debt, withdraw_amt, payback_amt, 1);

  const [coll_value, debt_value] = await getValue(dsa, user_address, coll, debt);
  const coll_price = await getPrice(coll);

  const _coll_value = coll_value - (coll_price * withdraw_amt);
  const interim_debt_ratio = debt_value / _coll_value;

  if (interim_debt_ratio >= coll[3]) {
    return 0; // flashloan
  } else {
    return 1; // simple withdraw and payback
  }
}

async function getPayBackAmt(debt_amount) {
  const payback_amt = parseFloat((debt_amount * 1.0003)).toFixed(0);
  return payback_amt; // debt[4]?
}

async function getBorrowAmtColl(coll, debt, debt_amount, price_impact) {
  const _debt_amount = await web3.utils.toBN(web3.utils.toWei(debt_amount.toString(), debt[6]));

  const uni_pair = [debt[0], coll[0]];
  const _borrow_amt_coll = await uni.methods.getAmountsOut(_debt_amount, uni_pair).call();
  const borrow_amt_coll = _borrow_amt_coll[1] * (1 - (price_impact / 100));

  return borrow_amt_coll / coll[4];
}

async function getSoldAmtColl(coll, debt, payback_amt, price_impact) {
  const _payback_amt = await web3.utils.toBN(web3.utils.toWei(payback_amt.toString(), debt[6]));
  const uni_pair = [coll[0], debt[0]];

  const _sold_coll_amt = await uni.methods.getAmountsIn(_payback_amt, uni_pair).call();
  const sold_coll_amt = parseInt(_sold_coll_amt[0] * (1 + price_impact / 100)) / coll[4];

  return sold_coll_amt;

}

module.exports = {
  getValue,

  // For Frontend
  getDebtRatio,
  getCurrentLeverage,
  getLeveragedDebtandColl,
  getAccountData,
  getLiquidationPrice,
  getPrice,
  getAssetAPYs,
  getNetAPY,
  getHasPosition,

  // For Exections in JS
  getLeverage, // for Frontend, too.
  isFlashloanLev,
  isFlashloanDelev,
  getBorrowAmtColl,
  getPayBackAmt,
  getSoldAmtColl
};