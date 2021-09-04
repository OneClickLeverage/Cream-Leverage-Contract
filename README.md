# Cream-Leverage-Contract

## Introduction & Demo

OneClickLeverage allows user to create leveraged positions and deleverage them Instantly on Cream Finance. 

Here is the Demo of taking 3x leveraged ETH position against DAI debt.

// gif video

And this is how deleverage looks like.

// gif video

### Descriptions

- With ETH, users can literally take leverage with one click. With other ERC20 tokens listed on Cream Finance, first, you need to create your contract wallet that manages your leveraged position and approve it. The part of contract creation is embedded in a transaction with ETH. 
- It uses flashloan to increase leverage because it's a much more gas-efficient way than looping where you need to deposit, borrow and swap multiple times depending on how much leverage you take.
- As the demo shows, users can dynamically specify how much you leverage or deleverage your position on the user interface. 


## Technical Architecture and Intention behind design

### Contract Wallet
Contract wallet that creates and closes leverage and deleverages positions is a modified fork of Instadap's DSA contract. 

※Note: We built the contract wallet because it turned out that it's impossible to let users take leverage position with ordinary contracts working as a proxy between the user and cream contract.

In that architecture, cr/cytoken that user would get is always sent to the contract instead of the user.  This is because `msg.sender` is the proxy contract, and the contract cannot send cr/cytoken back to a user unless it has 0 debt.

On the other hand, the contract wallet enables it and offers multiple flexible strategies by connectors. 

### Flashloan and Cream contracts
All leveraged positions are only made through depositing and borrowing from CreamV2, a.k.a. IronBank. Only when a position is created via flashloan, the liquidity (flashloaned funds) are taken by CreamV1 instead of the same cyToken pool to avoid reversions caused by reentrancy. 

※Note: We are not 100% sure this is because of the reentrancy guard, but it didn't succeed when the source of the liquidity where the collateral is deposited and funds are borrowed via flashloan are the same. 

## Build

 ```
 npm i // 1. Install packages
 npx hardhat node --fork https://eth-mainnet.alchemyapi.io/v2/<alchemy-key> --fork-block-number 13112347 // 2. run mainnet fork network
 npx hardhat run --network localhost insta_scripts/deploy/deployInsta.js // 3. deploy
 
 node insta_scripts/experiments/ex11ETHLev.js // leverage
 node insta_scripts/experiments/ex12ETHDelev.js // deleverage
 
 ```
 
 Inside script files, you need to set input data

 
 - Leverage
```
    // Inputs here
    const coll = tokens[0]; // ETH
    const debt = tokens[3]; // USDC,  (DAI = 3)
    const isETH = 0; // if initital deposit is ETH => 0, otherwise e.g WETH => 1.
    const leverage = 2; // 1 ~ 5
    const capital = 5; // Initial capital amount
    const price_impact = 1; // %
```

 - Deleverage
 ```
     // Inputs here
    const coll = tokens[0]; // ETH, (WBTC = 1)
    const debt = tokens[3]; // USDC,  (DAI = 3)
    const withdraw_amt = 1; // e.g. 1 ~ 5
    const payback_amt = 1000; // e.g. 1000 ~ 5000
    const price_impact = 1; // %
```

 *Hint<br>
 - coll => 0 = ETH<br>
 - debt => 2 = DAI, 3 = USDC


Js scripts integrate modified Instadapp sdk: https://github.com/porco-rosso-j/dsa-connect-1
