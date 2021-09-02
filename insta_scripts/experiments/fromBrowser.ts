const secret = require("../../secret.json");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');
const BN = require('bn.js');
const {tokens} = require("../constant/dsa_cream2.js");
import { addSpell, build, cast, getDsaAddress, getDsaId, hasDSA } from './ex11ETHLev';

// Address & Key 
const user0 = secret.address0;
const user1 = secret.address1;

const key0 = secret.key0;
const key1 = secret.key1;

export async function supplyFromBrowser(windowEth, userAddress, capital, leverage) {
  const coll = tokens[0]; // ETH
  const debt = tokens[3]; // USDC,  (DAI = 3)
  const isETH = 0; // if initital deposit is ETH => 0, otherwise e.g WETH => 1.
  // const leverage = 2; // 1 ~ 5
  // const capital = 5; // Initial capital amount
  const priceImpact = 1; // %

  const web3 = new Web3(windowEth)
  const dsa = new DSA(web3);

  console.log('dsa', dsa)

  let bool = await hasDSA(dsa, userAddress);
  console.log('has dsa', bool)
  if(!bool)  { 
      await build(dsa, userAddress);
   }  

  let dsaAddress = await getDsaAddress(dsa, userAddress);
  console.log("dsaAddress: "+dsaAddress);

  const dsaId = await getDsaId(dsa, userAddress);
  await dsa.setInstance(dsaId);

  let [spells, initial_col] = await addSpell(dsa, isETH, coll, debt, capital, leverage, priceImpact);

  await cast(userAddress, spells, initial_col);

 //  await balanceCheck(coll, debt);
 console.log("Done!");
}