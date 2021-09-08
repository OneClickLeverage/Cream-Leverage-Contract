// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import { ETH } from "../../constants/CInstaDapp.sol";
import { UNISWAP_V2_ROUTER, WETH } from "../../constants/CUniswap.sol";

// Given an input asset amount and an array of token addresses, calculates all subsequent maximum output token amounts
// by calling getReserves for each pair of token addresses in the path in turn, and using these to call getAmountOut.
function _getAmountsOut(uint256 amountOut, address[] memory path) view returns (uint256[] memory amounts) {
    path[0] = path[0] == ETH ? WETH : path[0];
    path[1] = path[1] == ETH ? WETH : path[1];
    return UNISWAP_V2_ROUTER.getAmountsOut(amountOut, path);
}

// Given an output asset amount and an array of token addresses, calculates all preceding minimum input token amounts
// by calling getReserves for each pair of token addresses in the path in turn, and using these to call getAmountIn.
function _getAmountsIn(uint256 amountIn, address[] memory path) view returns (uint256[] memory amounts) {
    path[0] = path[0] == ETH ? WETH : path[0];
    path[1] = path[1] == ETH ? WETH : path[1];
    return UNISWAP_V2_ROUTER.getAmountsIn(amountIn, path);
}
