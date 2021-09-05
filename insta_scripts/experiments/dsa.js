const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));

async function build(dsa, userAddress) {

    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(userAddress);

    await dsa.build({
        gasPrice: gasPrice,
        origin: userAddress,
        authority: userAddress,
        from: userAddress,
        nonce: nonce
    });
}

async function hasDSA(dsa, address) {
    const account = await dsa.getAccounts(address);
    return account[0];
}

async function getDsaId(dsa, userAddress) {
    const account = await dsa.getAccounts(userAddress);
    return account[0].id;
}

async function getDsaAddress(dsa, userAddress) {
    const account = await dsa.getAccounts(userAddress);
    return account[0].address;
}

async function cast(userAddress, spells) {
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(userAddress);

    const transactionHash = await spells.cast({
        gasPrice: gasPrice,
        nonce: nonce
    });

    console.log("transactionHash: " + transactionHash)
}

async function castETH(userAddress, spells, initial_coll) {
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(userAddress);

    const transactionHash = await spells.cast({
        gasPrice: gasPrice,
        value: initial_coll,
        nonce: nonce
    });

    console.log("transactionHash: " + transactionHash)
}



module.exports = {
    build,
    hasDSA,
    getDsaId,
    getDsaAddress,
    cast,
    castETH,
};