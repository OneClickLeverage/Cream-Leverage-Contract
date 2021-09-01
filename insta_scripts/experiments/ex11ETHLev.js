const secret = require("../../secret.json");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');
const BN = require('bn.js');

// Address & Key 
const user0 = secret.address0;
const user1 = secret.address1;

const key0 = secret.key0;
const key1 = secret.key1;

// Token Addresses
const {tokens} = require("../constant/dsa_cream2.js");
const uni_abi = require("../constant/abi/external/uniswap.json");
const {balanceCheck} = require("./balance_info.js")

const dsa = new DSA({
  web3: web3,
  mode: "node",
  privateKey: key1
});

async function main() {

    // Inputs here
    const coll = tokens[0]; // ETH
    const debt = tokens[3]; // USDC,  (DAI = 3)
    const isETH = 0; // if initital deposit is ETH => 0, otherwise e.g WETH => 1.
    const leverage = 2; // 1 ~ 5
    const capital = 5; // Initial capital amount
    const price_impact = 1; // %

   let bool = await hasDSA(user1);
   if(!bool)  { 
       await build(); }  

   let dsaAddress = await getDsaAddress();
   console.log("dsaAddress: "+dsaAddress);

   dsaId = await getDsaId();
   await dsa.setInstance(dsaId);

   let [spells, initial_col] = await addSpell(isETH, coll, debt, capital, leverage, price_impact);

   await cast(spells, initial_col);

   await balanceCheck(coll, debt);
   console.log("Done!");
   }

main();

async function build() {
   
   const gasPrice = await web3.eth.getGasPrice();
   const nonce = await web3.eth.getTransactionCount(user1);

   await dsa.build({
       gasPrice: gasPrice,
       origin: user0,
       authority: user1,
       from: user1,
       nonce: nonce
   });
}

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

async function addSpell(isETH, coll, debt, capital, leverage, price_impact) {

    // Deposit ( if ETH, convert it into WETH )
    spells = await dsa.Spell();

    const initial_col = await web3.utils.toBN(capital * (10**coll[4]));

    if (isETH == 0) {
     await spells.add({
      connector: "BASIC-A",
      method: "deposit",
      args: [
       coll[5],
       initial_col
      ]
      });

     await spells.add({
         connector: "WETH-A",
         method: "deposit",
         args: [initial_col]
     });

   } else {

    await spells.add({
      connector: "BASIC-A",
      method: "deposit",
      args: [
       coll[0],
       initial_col
      ]
      });
   }

   // Flashloan check
   const isFlashloan = await _isFlashloan(coll, leverage);

    if ( isFlashloan == 0 ) {
       const [total_col, flash_amt, flash_payback_amt] = await getinfo(isFlashloan, coll, debt, leverage, capital, price_impact);

       let _data = await flashSpell(coll, debt, total_col, flash_amt, flash_payback_amt); 
       console.log("here????")
       const data = await dsa.flashpool_v2.encodeFlashCastData(_data);
       console.log("here?3")
  
        await spells.add({
        connector: "FLASHPOOL-A",
        method: "flashBorrowAndCast",
        args: [
         debt[0],
         web3.utils.toBN(web3.utils.toWei(flash_amt.toString(), debt[6])), // sell flashloaned USDC
         0, // flashloan from crToken
         data
        ]
       });

     } else {
        const [total_col, borrow_amt, leverage_amt] = await getinfo(isFlashloan, coll, debt, leverage, capital, price_impact);  
        spells = await normalLeverageSpell(spells, coll, debt, capital, borrow_amt, leverage_amt);
     }

       console.log("here?4");

    return [spells, initial_col];
}

async function flashSpell(coll, debt, total_col, flash_amt, flash_payback_amt) {

   let spell_flash = await dsa.Spell();

   // 1. swap debt into coll on Uniswap
   // 2. deposit total coll into cyToken
   // 3. borrow debt from crToken
   // 4. payback flashloaned debt to cyToken
  
    await spell_flash.add({
        connector: "UNISWAP-V2-A",
        method: "sell",
        args: [
         coll[0],
         debt[0],
         web3.utils.toBN(web3.utils.toWei(flash_amt.toString(), debt[6])), // sell flashloaned USDC
         0 // unit Amount 
        ]
    });
  
    await spell_flash.add({
        connector: "CREAM-A",
        method: "depositRaw",
        args: [
         coll[0],
         coll[2], // to cyToken
         web3.utils.toBN(web3.utils.toWei(total_col.toString(), coll[6]))
         ]
       });
  
      await spell_flash.add({
        connector: "CREAM-A",
        method: "borrowRaw",
        args: [
         debt[0],
         debt[2], // from cyToken instead of crToken which was used in flashloan
         web3.utils.toBN(web3.utils.toWei(flash_payback_amt.toString(), debt[6]))
        ]
       });
      
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

async function normalLeverageSpell(spells, coll, debt, initial_col, borrow_amt, leverage_amt) {

    // 1. deposit
    // 2. borrow
    // 3. swap
    // 4. deposit

    await spells.add({
        connector: "CREAM-A",
        method: "depositRaw",
        args: [
         coll[0],
         coll[2], // to cyToken
         web3.utils.toBN(web3.utils.toWei(initial_col.toString(), coll[6])),
         ]
       });

      await spells.add({
        connector: "CREAM-A",
        method: "borrowRaw",
        args: [
         debt[0],
         debt[2], // from cyToken in normal leverage
         web3.utils.toBN(web3.utils.toWei(borrow_amt.toString(), debt[6])),
        ]
       });

    await spells.add({
        connector: "UNISWAP-V2-A",
        method: "sell",
        args: [
         coll[0],
         debt[0],
         web3.utils.toBN(web3.utils.toWei(borrow_amt.toString(), debt[6])),
         0 // unit Amount 
        ]
    });

    await spells.add({
        connector: "CREAM-A",
        method: "depositRaw",
        args: [
         coll[0],
         coll[2], // to cyToken
         web3.utils.toBN(web3.utils.toWei(leverage_amt.toString(), coll[6])),
         ]
       });

   return spells;

}

async function cast(spells, initial_col) {
   const gasPrice = await web3.eth.getGasPrice();
   const nonce = await web3.eth.getTransactionCount(user1);

   const transactionHash = await spells.cast({
       gasPrice: gasPrice,
       value: initial_col,
       nonce: nonce
   });

   console.log("here?6")
   console.log("transactionHash: "+transactionHash)
}

async function getinfo(isFlashloan, coll, debt, leverage, initial_col, price_impact) {

    const _total_col = initial_col*leverage;
    const total_col = await web3.utils.toBN(_total_col * (10**coll[4]));

    const leverage_amt = await web3.utils.toBN( total_col - ((initial_col) * (10**coll[4])));
    const uni_pair = [debt[0], coll[0]];
    const uni = new web3.eth.Contract(uni_abi, "0x7a250d5630b4cf539739df2c5dacb4c659f2488d");

    const _result = await uni.methods.getAmountsIn(leverage_amt, uni_pair).call();
    console.log("_result", _result[0])

    if (isFlashloan == 0) {
    //const flash_payback_amt = parseFloat((_result[0] * 1.0003)*(1+(price_impact/100))).toFixed(0);
    //const flash_payback_amt = parseInt((_result[0] * 1.0003)*(1+(price_impact/100)), 10);
    //const flash_payback_amt = Math.round((_result[0] * 1.0003)*(1+(price_impact/100))*10/10);
    //const flash_payback_amt = (_result[0] * 1.0003)*(1+(price_impact/100))
    const flash_payback_amt = parseFloat((_result[0] * 1.0003)*(1+(price_impact/100))).toFixed(0);

    console.log("flash_payback_amt", flash_payback_amt)
    return [total_col/(10**coll[4]), _result[0]/(10**debt[4]), flash_payback_amt/(10**debt[4])];
    } else {
    return [total_col/(10**coll[4]), _result[0]/(10**debt[4]), leverage_amt/(10**coll[4])];
    }
}

async function _isFlashloan(coll, leverage) {
    const lev_max = coll[3] + 1;
    if ( leverage >= lev_max ) {
        return 0; // flashloan
    } else {
        return 1; // loop
    }
}