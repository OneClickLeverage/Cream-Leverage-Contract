const secret = require("../../secret.json");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');

// Address & Key 
const user0 = secret.address0;
const user1 = secret.address1;

const key0 = secret.key0;
const key1 = secret.key1;

// Token Addresses
const {tokens} = require("../constant/dsa_cream2.js");
const uni_abi = require("../constant/abi/external/uniswap.json");
const {getRatio} = require("./getInfo.js")
const {balanceCheck} = require("./balance_info.js")

const dsa = new DSA({
  web3: web3,
  mode: "node",
  privateKey: key1
});

async function main() {

    // Inputs here
    const coll = tokens[0]; // ETH, (WBTC = 1)
    const debt = tokens[3]; // USDC,  (DAI = 3)
    const withdraw_amt = 1; // e.g. 1 ~ 5
    const payback_amt = 1000; // e.g. 1000 ~ 5000
    const price_impact = 1; // %

   let bool = await hasDSA(user1);
   if(!bool)  { 
     console.log("No position")
     return;
   }  

   let dsaAddress = await getDsaAddress();
   console.log("dsaAddress: "+dsaAddress);

   dsaId = await getDsaId();
   await dsa.setInstance(dsaId);

   let spells = await addSpell(coll, debt, withdraw_amt, payback_amt, price_impact);

   await cast(spells);

   await balanceCheck(coll, debt);
   console.log("Done!");
   }

main();

async function hasDSA(address) {
    const account = await dsa.getAccounts(address);
    return account[0];
}

async function getDsaId() {
    const account = await dsa.getAccounts(user1);
    return account[0].id;
}

async function getDsaAddress() {
    const account = await dsa.getAccounts(user1);
    return account[0].address;
}

async function addSpell(coll, debt, withdraw_amt, payback_amt, price_impact) {

    // Deposit ( if ETH, convert it into WETH )
    spells = await dsa.Spell();

   // Flashloan check
   const isFlashloan = await _isFlashloan(coll, debt, withdraw_amt, payback_amt);

   // Calcu params
   const [sold_coll_amt, flash_payback_amt] = await _getInfo(isFlashloan, coll, debt, withdraw_amt, payback_amt, price_impact);

    if ( isFlashloan == 0 ) {

       let _data = await flashSpell(coll, debt, withdraw_amt, payback_amt, sold_coll_amt, flash_payback_amt); 
       console.log("here????")
       const data = await dsa.flashpool_v2.encodeFlashCastData(_data);
       console.log("here?3")
  
        await spells.add({
        connector: "FLASHPOOL-A",
        method: "flashBorrowAndCast",
        args: [
            debt[0], 
            web3.utils.toBN(web3.utils.toWei(payback_amt.toString(), debt[6])),
            0, data]
        });

     } else {
        spells = await normalLeverageSpell(spells, coll, debt, withdraw_amt, payback_amt, sold_coll_amt);
     }

    // there can be functions which give funds back to users here.

    console.log("here?4");

    return spells;
}

async function flashSpell(coll, debt, withdraw_amt, payback_amt, sold_coll_amt, flash_payback_amt) {

   let spell_flash = await dsa.Spell();

   // 1. payback debt
   // 2. withdraw coll
   // 3. swap coll to debt
   // 4. payback flashloaned debt
  
    await spell_flash.add({
        connector: "CREAM-A",
        method: "paybackRaw",
        args: [
         debt[0],
         debt[2], // to cyToken
         web3.utils.toBN(web3.utils.toWei(payback_amt.toString(), debt[6]))
         ]
       });

    await spell_flash.add({
        connector: "CREAM-A",
        method: "withdrawRaw",
        args: [
         coll[0],
         coll[2], // from cyToken instead of crToken which was used in flashloan
         web3.utils.toBN(web3.utils.toWei(withdraw_amt.toString(), coll[6]))
        ]
    });

    await spell_flash.add({
        connector: "UNISWAP-V2-A",
        method: "sell",
        args: [
         debt[0],
         coll[0],
         web3.utils.toBN(web3.utils.toWei(sold_coll_amt.toString(), coll[6])), // sell flashloaned USDC
         0 // unit Amount 
        ]
    });

    console.log("flash_payback_amt: "+flash_payback_amt)

    await spell_flash.add({
        connector: "FLASHPOOL-A",
        method: "flashPayback",
        args: [debt[0],
        web3.utils.toBN(web3.utils.toWei(flash_payback_amt.toString(), debt[6]))
        ]
       });

    console.log("here?")

    return spell_flash;

}

async function normalLeverageSpell(spells, coll, debt, withdraw_amt, payback_amt, sold_coll_amt) {

    // 1. withdraw
    // 2. swap 
    // 3. payback

    await spells.add({
        connector: "CREAM-A",
        method: "withdrawRaw",
        args: [
         coll[0],
         coll[2], // to cyToken
         web3.utils.toBN(web3.utils.toWei(withdraw_amt.toString(), coll[6]))
         ]
       });

    await spells.add({
        connector: "UNISWAP-V2-A",
        method: "sell",
        args: [
         debt[0],
         coll[0],
         web3.utils.toBN(web3.utils.toWei(sold_coll_amt.toString(), coll[6])), // sell flashloaned USDC
         0 // unit Amount 
        ]
    });

      await spells.add({
        connector: "CREAM-A",
        method: "paybackRaw",
        args: [
         debt[0],
         debt[2], // from cyToken in normal leverage
         web3.utils.toBN(web3.utils.toWei(payback_amt.toString(), coll[6]))
        ]
       });

   return spells;

}

async function cast(spells) {
   const gasPrice = await web3.eth.getGasPrice();
   const nonce = await web3.eth.getTransactionCount(user1);

   const transactionHash = await spells.cast({
       gasPrice: gasPrice,
       nonce: nonce
   });

   console.log("here?6")
   console.log("transactionHash: "+transactionHash)
}

async function _getInfo(isFlashloan, coll, debt, withdraw_amt, payback_amt, price_impact) {
    console.log("isFlashloan:"+isFlashloan);

    let expected_output;
    if (isFlashloan == 0) {
        expected_output = payback_amt * 1.0003;
    } else {
        expected_output = payback_amt;
    }

    const input = await web3.utils.toBN(web3.utils.toWei(expected_output.toString(), debt[6]));
    console.log("expected_output: "+expected_output)

    const uni_pair = [coll[0], debt[0]];
    const uni = new web3.eth.Contract(uni_abi, "0x7a250d5630b4cf539739df2c5dacb4c659f2488d");
    const _sold_coll_amt = await uni.methods.getAmountsIn(input, uni_pair).call();
    const sold_coll_amt = parseInt(_sold_coll_amt[0]*(1+price_impact/100))/(10**coll[4]);

    console.log("sold_amt: "+sold_coll_amt)

    if ( withdraw_amt > sold_coll_amt ) {
     return [sold_coll_amt, expected_output];
    } else {
      console.log("something wrong");
    }
}

async function _isFlashloan(coll, debt, withdraw_amt, payback_amt) {

    const interim_debt_ratio = await getRatio(coll, debt, withdraw_amt, payback_amt, 1);
    console.log("interim_debt_ratio: "+interim_debt_ratio);

    if ( interim_debt_ratio >= coll[3] ) {

        return 0; // flashloan
    } else {
        return 1; // simple withdraw and payback
    }
}