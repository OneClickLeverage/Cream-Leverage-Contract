# Cream-Leverage-Contract

## Introduction & Demo

OneClickLeverage app allows users to easily create flexible leverage position and deleverage them on Cream Finance. 

Here is the working demo when creating 3x leverage position with ETH(collateral) and DAI(debt).


https://user-images.githubusercontent.com/88586592/132319567-10822f38-07ca-485f-a801-f8b2cd4d9e8f.mp4


And this is how deleverage looks like.

// gif video


## UI & UX

### Set-up
- First, users need to create an account but only at the beginning.

### Easy-to-Use
- With ETH, users can take leverage with one click. With ERC20 tokens listed on Cream Finance, approval for the account is necessary. 
- As the demo shows, users can dynamically specify how much they leverage or deleverage your position by a slider on the user interface. 
- Expected outcomes of users' positions, such as debt ratio, leverage, liquidation price, and Net APY are explicitly shown to them.

### Gas-Efficient
- Although users need to create an account first, overall, it's incredibly cost-efficient because flashloan drastically reduces the gas cost to take higher(3~5x) leverage. This is because there is no need to deposit, borrow, and swap multiple times to increase collateral more than the initial deposit.


## Technical Architecture

### Leverage Positions on Cream
All of leverage positions are made on CreamV2 a.k.a IronBank instead of V1 because cyTokens have looser debt ratio which allows higher leverage. 

### Contract Wallet
The contract wallet manages leverage positions is a modified fork of Instadap's DSA(DeFi Smart Account) contract. This model enables multiple flexible strategies by several kinds of DeFi protocol connectors.

※Note: One of the reasons we built the contract wallet is we realized that it's technologically quite challenging to let users take leverage position with the typical contract model working as a proxy interface between users and cr/cy tokens.

Especially in that model, cr/cytoken a user is supposed to receive is sent to contract instead of the user. This is because msg.sender for cr/cy tokens is the contract between them instead of the original caller(user). msg.origin may solve this, but it's proven not secure.

### Flashloan
When a position is created by utilizing flashloan, the liquidity (flashloaned funds) is taken by CreamV1 instead of the same cyToken pool to avoid reversions caused by reentrancy. When testing, it threw the error `re-enter`.

※Note: We aren't 100% sure that it stems from the reentrancy guard, but it's likely. The transaction didn't succeed when the collateral and debt's liquidity source(cr/cy token) are the same.

## Build

 ```
 git clone https://github.com/OneClickLeverage/Cream-Leverage-Contract.git
 npm i // 1. Install packages
 npx hardhat node --fork https://eth-mainnet.alchemyapi.io/v2/<alchemy-key> --fork-block-number 13112347 // 2. run mainnet fork network
 npx hardhat run --network localhost insta_scripts/deploy/deployInsta.js // 3. deploy
 npm start
 
 ```

