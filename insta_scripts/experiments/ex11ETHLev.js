const secret = require("../../secret.json");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');
const BN = require('bn.js');

// Address & Key 
const user1 = secret.address1;
const key1 = secret.key1;

// Token Addresses
const { tokens } = require("../constant/dsa_cream2.js");
const {
    getLeverage,
    isFlashloanLev,
    getBorrowAmtColl,
    getPayBackAmt,
} = require("./getInfo.js");
const { build, cast, castETH, getDsaId, hasDSA } = require("./dsa.js");
const { balanceCheck } = require("./balance_info.js");

async function _leverage(dsa, user_address, coll, debt, isETH, initial_coll, debt_amount, price_impact) {

    let bool = await hasDSA(dsa, user_address);
    if (!bool) {
        await build(dsa, user_address);
    }

    const dsaId = await getDsaId(dsa, user_address);
    await dsa.setInstance(dsaId);

    let [spells, _initial_coll] = await addSpell(dsa, isETH, coll, debt, initial_coll, debt_amount, price_impact);

    if (isETH == 0) {
        await castETH(user_address, spells, _initial_coll);
    } else {
        await cast(user_address, spells);
    }

    await balanceCheck(dsa, user_address, coll, debt);
    console.log("Done!");
}

async function addSpell(dsa, isETH, coll, debt, initial_coll, debt_amount, price_impact) {
    // Deposit ( if ETH, convert it into WETH )
    let spells = await dsa.Spell();

    const _initial_coll = await web3.utils.toBN(initial_coll * coll[4]);

    if (isETH == 0) {
        await spells.add({
            connector: "BASIC-A",
            method: "deposit",
            args: [
                coll[5],
                _initial_coll
            ]
        });

        await spells.add({
            connector: "WETH-A",
            method: "deposit",
            args: [_initial_coll]
        });

    } else {

        await spells.add({
            connector: "BASIC-A",
            method: "deposit",
            args: [
                coll[0],
                _initial_coll
            ]
        });
    }

    const leverage = await getLeverage(coll, debt, initial_coll, debt_amount, price_impact)
    // Flashloan check
    const isFlashloan = await isFlashloanLev(coll, leverage);
    console.log("isFlashloan:" + isFlashloan);

    const borrow_amt_coll = await getBorrowAmtColl(coll, debt, debt_amount, price_impact);

    if (isFlashloan == 0) {
        const payback_amt = await getPayBackAmt(debt_amount);
        const total_coll = initial_coll + borrow_amt_coll;

        let _data = await flashSpell(dsa, coll, debt, total_coll, debt_amount, payback_amt);
        const data = await dsa.flashpool_v2.encodeFlashCastData(_data);

        await spells.add({
            connector: "FLASHPOOL-A",
            method: "flashBorrowAndCast",
            args: [
                debt[0],
                web3.utils.toBN(web3.utils.toWei(debt_amount.toString(), debt[6])),
                0, // flashloan from crToken
                data
            ]
        });

    } else {
        spells = await normalLeverageSpell(spells, coll, debt, initial_coll, debt_amount, borrow_amt_coll);
    }

    return [spells, _initial_coll];
}

async function flashSpell(dsa, coll, debt, total_coll, flash_amt, flash_payback_amt) {

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
            web3.utils.toBN(web3.utils.toWei(total_coll.toString(), coll[6]))
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

    return spell_flash;

}

async function normalLeverageSpell(spells, coll, debt, initial_coll, debt_amount, borrow_amt_coll) {

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
            web3.utils.toBN(web3.utils.toWei(initial_coll.toString(), coll[6])),
        ]
    });

    await spells.add({
        connector: "CREAM-A",
        method: "borrowRaw",
        args: [
            debt[0],
            debt[2], // from cyToken in normal leverage
            web3.utils.toBN(web3.utils.toWei(debt_amount.toString(), debt[6])),
        ]
    });

    await spells.add({
        connector: "UNISWAP-V2-A",
        method: "sell",
        args: [
            coll[0],
            debt[0],
            web3.utils.toBN(web3.utils.toWei(debt_amount.toString(), debt[6])),
            0 // unit Amount 
        ]
    });

    await spells.add({
        connector: "CREAM-A",
        method: "depositRaw",
        args: [
            coll[0],
            coll[2], // to cyToken
            web3.utils.toBN(web3.utils.toWei(borrow_amt_coll.toString(), coll[6])),
        ]
    });

    return spells;
}

module.exports = {
    _leverage,
    addSpell
};

