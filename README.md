# Cream-Leverage-Contract

## Introduction & Demo

OneClickLeverage allows user to create leveraged positions and deleverage them Instantly on Cream Finance. 

Here is the Demo of taking 3x leveraged ETH position against DAI debt.

// gif video

And this is how deleverage looks like.

// gif video

## UI & UX

### Set-up
- First, users need to create an account but only at the beginning.

### Easy-to-Use
- With ETH, users can literally take leverage with one click. With ERC20 tokens listed on Cream Finance, An approval of deposited token for the account is neccesary. 
- As the demo shows, users can dynamically specify how much you leverage or deleverage your position by slider on the user interface. 
- Expected outcomes of users' positions, such as debt ratio, leverage, liquidation price, and net apy are explicitly shown to them.

### Gas-Efficient
- Even though users need to create an account first, overall, it's extremely cost-efficient because flashloan drastically reduces the gas-cost to take higer(3~5x) leverage.This is because there is no need to deposit, borrow, and swap multiple times to increase collateral more than initial deposit.



## Technical Architecture

### Leverage Positions on Cream
All of leverage positions are made on CreamV2 a.k.a IronBank instead of V1 because cyTokens have looser debt ratio which allows higher leverage. 

### Contract Wallet
The contract wallet manages leverage positions is a modified fork of Instadap's DSA(DeFi Smart Account) contract. This model enables enables multiple flexible strategies by several kinds of DeFi protocol connectors. 

※Note: One of the reason we built the contract wallet because we realized that it's technologically quite challenging to let users take leverage position with normal contract model working as a proxy between users and cr/cy tokens.

Especially, in that model, cr/cytokens that users are supposed to receive are always sent to the contract instead of the user.  This is because `msg.sender` for cr/cy tokens is the contract between them instead of original caller(user). `msg.origin` may solve this but it's proven not secure. 

### Flashloan and Cream contracts
When a position is created via flashloan, the liquidity (flashloaned funds) are taken by CreamV1 instead of the same cyToken pool to avoid reversions caused by reentrancy. When testing, it threw error `re-enter`.

※Note: We aren't 100% sure that it stems from the reentrancy guard, but it's likely. Transaction just didn't succeed when the source of the liquidity where the collateral is deposited and funds are borrowed via flashloan are the same. 

## Build

 ```
 git clone https://github.com/OneClickLeverage/Cream-Leverage-Contract.git
 npm i // 1. Install packages
 npx hardhat node --fork https://eth-mainnet.alchemyapi.io/v2/<alchemy-key> --fork-block-number 13112347 // 2. run mainnet fork network
 npx hardhat run --network localhost insta_scripts/deploy/deployInsta.js // 3. deploy
 npm start
 
 ```

