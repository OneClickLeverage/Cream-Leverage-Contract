//const secret = require("../../secret.json");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));

const { cast, castETH, getDsaId } = require("./dsa.js");
const { balanceCheck } = require("./balance_info.js");

async function _adjustCream(dsa, user_address, coll, debt, isETH, amount, action) {

    const dsaId = await getDsaId(dsa, user_address);
    await dsa.setInstance(dsaId);

    let spells = await dsa.Spell();
    let _method;
    let _arg1;
    let _arg2;
    let _amount;
    let _decimal;

    if (action == 0) {
        _method = "depositRaw";
        _arg1 = coll[0]
        _arg2 = coll[2]
        _amount = amount;
        _decimal = coll[6];
        _token = coll;

        spells = await deposit(spells, isETH, amount, _decimal, _token);

    } else if (action == 1) {
        _method = "borrowRaw";
        _arg1 = debt[0]
        _arg2 = debt[2]
        _amount = amount;
        _decimal = debt[6];
        _token = debt;

    } else if (action == 2) {
        _method = "withdrawRaw";
        _arg1 = coll[0]
        _arg2 = coll[2]
        _amount = amount;
        _decimal = coll[6];
        _token = coll;

    } else if (action == 3) {
        _method = "paybackRaw";
        _arg1 = debt[0]
        _arg2 = debt[2]
        _amount = amount;
        _decimal = debt[6];
        _token = debt;

        spells = await deposit(spells, isETH, amount, _decimal, _token);

    }

    await spells.add({
        connector: "CREAM-A",
        method: _method,
        args: [
            _arg1,
            _arg2, // to cyToken
            web3.utils.toBN(web3.utils.toWei(_amount.toString(), _decimal))
        ]
    });

    if (action == 1 || action == 3) {
        spells = await withdraw(spells, isETH, user_address, amount, _decimal, _token);
    }

    if (isETH == 0) {
        await castETH(user_address, spells,
            web3.utils.toBN(web3.utils.toWei(_amount.toString(), _token[6]))
        );
    } else {
        await cast(user_address, spells);
    }

    await balanceCheck(dsa, user_address, coll, debt);
    console.log("Done!");
}

async function deposit(spells, isETH, _amount, _decimal, decimal, token) {

    if (isETH == 0) {
        await spells.add({
            connector: "BASIC-A",
            method: "deposit",
            args: [
                token[5],
                web3.utils.toBN(web3.utils.toWei(_amount.toString(), decimal))
            ]
        });

        await spells.add({
            connector: "WETH-A",
            method: "deposit",
            args: [web3.utils.toBN(web3.utils.toWei(_amount.toString(), decimal))]
        });

    } else {

        await spells.add({
            connector: "BASIC-A",
            method: "deposit",
            args: [
                token[0],
                web3.utils.toBN(web3.utils.toWei(_amount.toString(), decimal))
            ]
        });
    }
    return spells;
}

async function withdraw(spells, isETH, user_address, amount, decimal, token) {

    if (isETH == 0) {
        await spells.add({
            connector: "WETH-A",
            method: "withdraw",
            args: [web3.utils.toBN(web3.utils.toWei(amount.toString(), decimal))]
        });

        await spells.add({
            connector: "BASIC-A",
            method: "withdraw",
            args: [
                token[5],
                web3.utils.toBN(web3.utils.toWei(amount.toString(), decimal)),
                user_address
            ]
        });

    } else {

        await spells.add({
            connector: "BASIC-A",
            method: "withdraw",
            args: [
                token[0],
                web3.utils.toBN(web3.utils.toWei(amount.toString(), decimal)),
                user_address
            ]
        });
    }

    return spells;
}


module.exports = {
    _adjustCream,
};