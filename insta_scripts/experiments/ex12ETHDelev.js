const secret = require("../../secret.json");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));

const {
    getPayBackAmt,
    getSoldAmtColl,
    isFlashloanDelev,
} = require("./getInfo.js");
const { cast, getDsaId, hasDSA } = require("./dsa.js");
const { balanceCheck } = require("./balance_info.js")

async function _deleverage(dsa, user_address, coll, debt, isETH, withdraw_amt, payback_amt, price_impact) {
    let bool = await hasDSA(dsa, user_address);
    if (!bool) {
        console.log("No position")
        return;
    }

    const dsaId = await getDsaId(dsa, user_address);
    await dsa.setInstance(dsaId);

    let spells = await addSpell(dsa, user_address, isETH, coll, debt, withdraw_amt, payback_amt, price_impact);

    await cast(user_address, spells);

    await balanceCheck(dsa, user_address, coll, debt);
    console.log("Done!");
}

async function addSpell(dsa, user_address, isETH, coll, debt, withdraw_amt, payback_amt, price_impact) {

    // Deposit ( if ETH, convert it into WETH )
    spells = await dsa.Spell();
    // Flashloan check
    const isFlashloan = await isFlashloanDelev(dsa, user_address, coll, debt, withdraw_amt, payback_amt);
    console.log("isFlashloan: " + isFlashloan);
    const sold_coll_amt = await getSoldAmtColl(coll, debt, payback_amt, price_impact);

    if (isFlashloan == 0) {

        const flash_payback_amt = await getPayBackAmt(payback_amt);
        let _data = await flashSpell(dsa, coll, debt, withdraw_amt, payback_amt, sold_coll_amt, flash_payback_amt);
        const data = await dsa.flashpool_v2.encodeFlashCastData(_data);

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
    const excess_fund = withdraw_amt - sold_coll_amt;

    if (isETH == 0) {

        await spells.add({
            connector: "WETH-A",
            method: "withdraw",
            args: [web3.utils.toBN(web3.utils.toWei(excess_fund.toString(), coll[6]))]
        });

        await spells.add({
            connector: "BASIC-A",
            method: "withdraw",
            args: [
                coll[5],
                web3.utils.toBN(web3.utils.toWei(excess_fund.toString(), coll[6])),
                user_address
            ]
        });

    } else {

        await spells.add({
            connector: "BASIC-A",
            method: "withdraw",
            args: [
                coll[0],
                web3.utils.toBN(web3.utils.toWei(excess_fund.toString(), coll[6])),
                user_address
            ]
        });
    }

    return spells;
}

async function flashSpell(dsa, coll, debt, withdraw_amt, payback_amt, sold_coll_amt, flash_payback_amt) {

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

    await spell_flash.add({
        connector: "FLASHPOOL-A",
        method: "flashPayback",
        args: [debt[0],
        web3.utils.toBN(web3.utils.toWei(flash_payback_amt.toString(), debt[6]))
        ]
    });

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
            web3.utils.toBN(web3.utils.toWei(payback_amt.toString(), debt[6]))
        ]
    });

    return spells;
}

module.exports = {
    _deleverage,
    addSpell
};