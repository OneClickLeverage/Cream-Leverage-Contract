const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');
const { tokens } = require("../constant/dsa_cream2.js");
const { _leverage } = require("./ex11ETHLev");
const { _deleverage } = require('./ex12ETHDelev')
const { getDebtRatio, getLiquidationPrice, getPrice } = require('./getInfo')
const { balanceCheck } = require('./balance_info')
const { hasDSA } = require('./dsa')

function getDSAFromBrowser(windowEth) {
  const web3 = new Web3(windowEth)
  const dsa = new DSA(web3);

  return dsa
}

export async function supplyFromBrowser(windowEth, userAddress, initial_coll, debt_amount, price_impact, coll_token_id, debt_token_id) {
  const dsa = getDSAFromBrowser(windowEth)

  // Inputs here
  const coll = tokens[coll_token_id]; // ETH
  const debt = tokens[debt_token_id]; // USDC = 2, DAI = 3
  const isETH = coll_token_id === 0 ? 0 : 1; // if initital deposit is ETH => 0, otherwise e.g WETH => 1.
  // const initial_coll = 5; // Initial capital amount
  // const debt_amount = 3000;
  // const price_impact = 1; // %

  await _leverage(dsa, userAddress, coll, debt, isETH, initial_coll, debt_amount, price_impact)
}

export async function getDebtRatioFromBrowser(windowEth, userAddress, collTokenID, debtTokenID, collChange, debtChange, action) {
  const dsa = getDSAFromBrowser(windowEth)
  const coll = tokens[collTokenID]
  const debt = tokens[debtTokenID]

  return getDebtRatio(dsa, userAddress, coll, debt, collChange, debtChange, action)
}

export async function getLiquidationPriceFromBrowser(windowEth, userAddress, collTokenID, debtTokenID, collChange, debtChange, action) {
  const dsa = getDSAFromBrowser(windowEth)
  const coll = tokens[collTokenID]
  const debt = tokens[debtTokenID]

  return getLiquidationPrice(dsa, userAddress, coll, debt, collChange, debtChange, action)
}

export async function deleverageFromBrowser(windowEth, userAddress, withdraw_amt, payback_amt, price_impact, coll_token_id, debt_token_id) {
  const dsa = getDSAFromBrowser(windowEth)

  // Inputs here
  const coll = tokens[coll_token_id]; // ETH
  const debt = tokens[debt_token_id]; // USDC = 2, DAI = 3
  const isETH = coll_token_id === 0 ? 0 : 1; // if initital deposit is ETH => 0, otherwise e.g WETH => 1.
  // const initial_coll = 5; // Initial capital amount
  // const debt_amount = 3000;
  // const price_impact = 1; // %
  await _deleverage(dsa, userAddress, coll, debt, isETH, withdraw_amt, payback_amt, price_impact)
}

export async function getPriceWithTokenID(tokenID) {
  const tokenInfo = tokens[tokenID]
  const price = await getPrice(tokenInfo)
  return price
}

export async function getBalanceCheck(windowEth, userAddress, collTokenID, debtTokenID) {
  const dsa = getDSAFromBrowser(windowEth)

  // Inputs here
  const coll = tokens[collTokenID]; // ETH
  const debt = tokens[debtTokenID]; // USDC = 2, DAI = 3

  const balance = await balanceCheck(dsa, userAddress, coll, debt)

  return balance
}

export async function hasDSAFromBrowser(windowEth, userAddress) {
  const dsa = getDSAFromBrowser(windowEth)
  const userHasDSA = await hasDSA(dsa, userAddress)

  return userHasDSA
}