const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');

const secret = require("../../secret.json");
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

const dsa = new DSA({
  web3: web3,
  mode: "node",
  privateKey: key1
});

async function getDsaAddress(user_address) {
  const account = await dsa.getAccounts(user_address);
  //console.log("account: " + account[0].address)
  return account[0].address;
}

async function getValue(user_address, coll, debt) {

  const [supply_amount, debt_amount] = await getAccountSnapshot(user_address, coll, debt);

  const coll_price = await getPrice(coll);
  const debt_price = await getPrice(debt);

  // Calcu Debt Ratio
  const debt_value = debt_amount * debt_price / debt[4];
  const coll_value = supply_amount * coll_price / coll[4];

  return [coll_value, debt_value];
}

async function getRatio(user_address, coll, debt, withdraw_amt, payback_amt, action) {
  const [coll_value, debt_value] = await getValue(user_address, coll, debt);
  const coll_price = await getPrice(coll)
  const debt_price = await getPrice(debt)

  if (action == 0) { // current ratio
    const debt_ratio = debt_value / coll_value;
    return debt_ratio;

  } else if (action == 1) { // only withdraw
    const _coll_value = coll_value - (withdraw_amt * coll_price);
    const debt_ratio = debt_value / _coll_value;
    return debt_ratio;

  } else if (action == 2) { // only payback
    const _debt_value = debt_value - (payback_amt * debt_price);
    const debt_ratio = _debt_value / coll_value;
    return debt_ratio;

  } else if (action == 3) { // projected ratio 1: deleverage ( withdraw & payback )
    const _coll_value = coll_value - (withdraw_amt * coll_price);
    const _debt_value = debt_value - (payback_amt * debt_price);
    const debt_ratio = _debt_value / _coll_value;
    return debt_ratio;
  }
}

//getRatio(0, 3, 0, 0, 0) // => Current Ratio

async function getCurrentLeverage(user_address, coll, debt) {
  const [coll_value, debt_value] = await getValue(user_address, coll, debt);
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
async function getAccountSnapshot(user_address, coll, debt) {
  const dsaAddress = await getDsaAddress(user_address);

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

async function getLiquidationPrice(user_address, coll_token_id, debt_token_id, withdraw_amt, payback_amt) {
  const coll = tokens[coll_token_id];
  const debt = tokens[debt_token_id];

  const [coll_value, debt_value] = await getValue(user_address, coll, debt);
  const coll_price = await getPrice(coll)
  const _coll_value = coll_value - withdraw_amt;

  const liquidation_price = debt_value / (_coll_value / coll_price) / coll[3];
  return liquidation_price;
}

//getLiquidationPrice(user1, 0, 3, 0, 0)

async function isFlashloanLev(coll, leverage) {
  const lev_max = coll[3] + 1;
  //console.log("lev_max" + lev_max)
  if (leverage >= lev_max) {
    return 0; // flashloan
  } else {
    return 1; // loop
  }
}

async function isFlashloanDelev(user_address, coll, debt, withdraw_amt, payback_amt) {

  const interim_debt_ratio = await getRatio(user_address, coll, debt, withdraw_amt, payback_amt, 1);

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
  getRatio,
  getCurrentLeverage,
  getLeveragedDebtandColl,
  getAccountSnapshot,
  getLiquidationPrice,
  getPrice,
  getAssetAPYs,
  getNetAPY,

  // For Exections in JS
  getLeverage, // for Frontend, too.
  isFlashloanLev,
  isFlashloanDelev,
  getBorrowAmtColl,
  getPayBackAmt,
  getSoldAmtColl
};