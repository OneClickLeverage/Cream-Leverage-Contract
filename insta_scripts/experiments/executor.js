const secret = require("../../secret.json");
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');

// Address & Key 
const user1 = secret.address1;
const key1 = secret.key1;

const { tokens } = require("../constant/dsa_cream2.js");
const { _leverage } = require("./ex11ETHLev");
const { _deleverage } = require("./ex12ETHDelev");
const { _adjustCream } = require("./ex13Cream");

const dsa = new DSA({
    web3: web3,
    mode: "node",
    privateKey: key1
});

async function Leverage() {

    // Inputs here
    const coll = tokens[0]; // ETH
    const debt = tokens[2]; // USDC = 2, DAI = 3
    const isETH = 0; // if initital deposit is ETH => 0, otherwise e.g WETH => 1.
    const initial_coll = 5; // Initial capital amount
    const debt_amount = 3000;
    const price_impact = 1; // %

    await _leverage(dsa, user1, coll, debt, isETH, initial_coll, debt_amount, price_impact)
}

//Leverage()

async function Deleverage() {

    // Inputs here
    const coll = tokens[0]; // ETH, (WBTC = 1)
    const debt = tokens[2]; // USDC = 2,  DAI = 3
    const isETH = 0; // if withdraw asset is ETH => 0, otherwise e.g WETH => 1.
    const withdraw_amt = 1; // e.g. 1 ~ 5
    const payback_amt = 3000; // e.g. 1000 ~ 5000
    const price_impact = 1; // %

    await _deleverage(dsa, user1, coll, debt, isETH, withdraw_amt, payback_amt, price_impact)
}

Deleverage()

async function adjustCream() {

    // Inputs here
    const coll = tokens[0]; // ETH, (WBTC = 1)
    const debt = tokens[2]; // USDC = 2,  DAI = 3
    const isETH = 0; // if asset is ETH => 0, otherwise e.g WETH => 1.
    const amount = 0.2;
    const action = 2; // deosit = 0, borrow = 1, withdraw = 2, payback = 3

    await _adjustCream(dsa, user1, coll, debt, isETH, amount, action);
}

