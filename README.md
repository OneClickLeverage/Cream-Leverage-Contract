# Cream-Leverage-Contract
 
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
