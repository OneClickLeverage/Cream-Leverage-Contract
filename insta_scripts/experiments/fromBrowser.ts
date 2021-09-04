const secret = require("../../secret.json");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');

const { tokens } = require("../constant/dsa_cream2.js");
import { build, cast, castETH, getDsaId, hasDSA } from './dsa';
import { addSpell } from './ex11ETHLev';

// Address & Key 
const user0 = secret.address0;
const user1 = secret.address1;

const key0 = secret.key0;
const key1 = secret.key1;

export async function supplyFromBrowser(windowEth, userAddress, initial_coll, debt_amount) {
  const coll = tokens[0]; // ETH
  const debt = tokens[3]; // USDC,  (DAI = 3)
  const isETH = 0; // if initital deposit is ETH => 0, otherwise e.g WETH => 1.
  const price_impact = 1; // %

  const web3 = new Web3(windowEth)
  const dsa = new DSA(web3);

  let bool = await hasDSA(dsa, userAddress);

  if (!bool) {
    await build(dsa, userAddress);
  }

  const dsaId = await getDsaId(dsa, userAddress);
  await dsa.setInstance(dsaId);

  let [spells, _initial_coll] = await addSpell(dsa, isETH, coll, debt, initial_coll, debt_amount, price_impact);

  if (isETH == 0) {
    await castETH(userAddress, spells, _initial_coll)
  } else {
    await cast(userAddress, spells);
  }

  //  await balanceCheck(coll, debt);
  console.log("Done!");
}