const secret = require("../../secret.json");
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
const DSA = require('dsa-connect-1');

// Abi & addressses
const erc20 = require("../constant/abi/basics/erc20.json");
const cToken = require("../constant/abi/external/cToken.json");
const { tokens } = require("../constant/dsa_cream2.js");
const {
    getAccountSnapshot,
    getPrice,
    getValue
} = require("./getInfo.js");
const { getDsaAddress } = require("./dsa.js");

async function balanceCheck(dsa, user_address, coll, debt) {

    // DSA Address
    const dsaAddress = await getDsaAddress(dsa, user_address);

    // Balance
    const coll_token = new web3.eth.Contract(erc20, coll[0]);
    const dsa_coll_balance = await coll_token.methods.balanceOf(dsaAddress).call();
    const coll_ctoken = new web3.eth.Contract(cToken, coll[2]);
    const dsa_ctoken_balance = await coll_ctoken.methods.balanceOf(dsaAddress).call();
    const user_eth_balance = await web3.eth.getBalance(user_address);

    // Loan & Debt
    const [supply_amount, debt_amount] = await getAccountSnapshot(user_address, coll, debt);
    const coll_price = await getPrice(coll);
    const debt_price = await getPrice(debt);
    const [coll_value, debt_value] = await getValue(user_address, coll, debt);

    // Calcu Debt Ratio
    const debt_ratio = debt_value / coll_value;

    // Output
    console.log("");
    console.log("-- Balance -- ");
    console.log("User ETH: " + user_eth_balance / tokens[0][4]);
    console.log("DSA Coll: " + dsa_coll_balance / coll[4]);
    console.log("DSA CToken: " + dsa_ctoken_balance / 1E8);
    console.log("");
    console.log("Total Debt: " + debt_amount / debt[4]);
    console.log("Total Coll: " + supply_amount / coll[4]);
    console.log("Total Coll ($): " + supply_amount / coll[4] * coll_price);
    console.log("Debt Ratio: " + parseFloat(debt_ratio * 100).toFixed(3) + "%");
    console.log("");
    console.log("coll_price: " + coll_price);
    console.log("debt_price: " + debt_price);

    console.log("");
}

const dsa = new DSA({
    web3: web3,
    mode: "node",
    privateKey: secret.key1
});

const user1 = secret.address1;
const coll = tokens[0];
const debt = tokens[2];
//balanceCheck(dsa, user1, coll, debt);


module.exports = {
    balanceCheck
};

