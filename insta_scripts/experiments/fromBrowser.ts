const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');
const { tokens } = require("../constant/dsa_cream2.js");
const { _leverage } = require("./ex11ETHLev");

export async function supplyFromBrowser(windowEth, userAddress, initial_coll, debt_amount, price_impact) {
  const web3 = new Web3(windowEth)
  const dsa = new DSA(web3);

  // Inputs here
  const coll = tokens[0]; // ETH
  const debt = tokens[2]; // USDC = 2, DAI = 3
  const isETH = 0; // if initital deposit is ETH => 0, otherwise e.g WETH => 1.
  // const initial_coll = 5; // Initial capital amount
  // const debt_amount = 3000;
  // const price_impact = 1; // %

  await _leverage(dsa, userAddress, coll, debt, isETH, initial_coll, debt_amount, price_impact)
}

// module.exports = [
//   supplyFromBrowser
// ]