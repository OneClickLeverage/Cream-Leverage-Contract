// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "../../../interfaces/InstaDapp/connectors/IConnectUniswap.sol";

function _encodeUniswapSell(
    address buyAddr,
    address sellAddr,
    uint256 sellAmt,
    uint256 unitAmt,
    uint256 getId,
    uint256 setId
) pure returns (bytes memory) {
    return abi.encodeWithSelector(IConnectUniswap.sell.selector, buyAddr, sellAddr, sellAmt, unitAmt, getId, setId);
}

function _encodeUniswapBuy(
    address buyAddr,
    address sellAddr,
    uint256 buyAmt,
    uint256 unitAmt,
    uint256 getId,
    uint256 setId
) pure returns (bytes memory) {
    return abi.encodeWithSelector(IConnectUniswap.buy.selector, buyAddr, sellAddr, buyAmt, unitAmt, getId, setId);
}
