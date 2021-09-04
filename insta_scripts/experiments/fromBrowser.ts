
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');
const { tokens } = require("../constant/dsa_cream2.js");
const { _leverage } = require("./ex11ETHLev");
const { getDebtRatio } = require('./getInfo')

function getDSAFromBrowser(windowEth) {
  const web3 = new Web3(windowEth)
  const dsa = new DSA(web3);

  return dsa
}

export async function supplyFromBrowser(windowEth, userAddress, initial_coll, debt_amount, price_impact, coll_token_id, debt_token_id) {
  // Inputs here
  const coll = tokens[coll_token_id]; // ETH
  const debt = tokens[debt_token_id]; // USDC = 2, DAI = 3
  const isETH = coll_token_id === 0 ? 0 : 1; // if initital deposit is ETH => 0, otherwise e.g WETH => 1.
  // const initial_coll = 5; // Initial capital amount
  // const debt_amount = 3000;
  // const price_impact = 1; // %

  await _leverage(getDSAFromBrowser(windowEth), userAddress, coll, debt, isETH, initial_coll, debt_amount, price_impact)
}

export async function getDebtRatioFromBrowser(windowEth, userAddress, collTokenID, debtTokenID, collChange, debtChange, action) {
  const dsa = getDSAFromBrowser(windowEth)
  const coll = tokens[collTokenID]
  const debt = tokens[debtTokenID]

  console.log(dsa, userAddress)

  return getDebtRatio(dsa, userAddress, coll, debt, collChange, debtChange, action)
}
// module.exports = [
//   supplyFromBrowser
// ]