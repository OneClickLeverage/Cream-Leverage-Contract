// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../../interfaces/InstaDapp/resolvers/IInstaPoolResolver.sol";
import { add, sub, wmul, wdiv } from "../../math/DSMath.sol";
import "../../utils/SafeMath.sol";
import { INSTA_POOL_RESOLVER, ETH } from "../../constants/CInstaDapp.sol";
import { GAS_CONSUMED_FOR_AUTO_LIQUIDATION } from "../../constants/CAutoLiquidation.sol";

function _getFlashLoanRoute(address _tokenA, uint256 _wTokenDebtToMove) view returns (uint256) {
    IInstaPoolResolver.RouteData memory rData = IInstaPoolResolver(INSTA_POOL_RESOLVER).getTokenLimit(_tokenA);

    if (rData.dydx > _wTokenDebtToMove) return 0;
    if (rData.maker > _wTokenDebtToMove) return 1;
    if (rData.compound > _wTokenDebtToMove) return 2;
    if (rData.aave > _wTokenDebtToMove) return 3;
    revert("FGelatoDebtBridge._getFlashLoanRoute: illiquid");
}

function _getGasConsumedAutoLiquidation(uint256 _route, address colToken) pure returns (uint256) {
    _checkRouteIndex(_route);
    if (colToken == ETH) return GAS_CONSUMED_FOR_AUTO_LIQUIDATION()[_route];
    // we add 10 000 as a surplus for simplicity
    // data from gas-reporter showed the the difference showed be in this range
    else return GAS_CONSUMED_FOR_AUTO_LIQUIDATION()[_route] + 10000;
}

function _checkRouteIndex(uint256 _route) pure {
    require(_route <= 4, "FGelatoDebtBridge._getGasCostMakerToMaker: invalid route index");
}

function _convertTo18(uint256 _dec, uint256 _amt) pure returns (uint256 amt) {
    amt = SafeMath.mul(_amt, 10**(18 - _dec));
}
