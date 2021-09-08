// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import { GELATO_GAS_PRICE_ORACLE } from "../../constants/CGelato.sol";
import { ETH } from "../../constants/CInstaDapp.sol";
import { mul } from "../../math/DSMath.sol";
import { _getAmountsIn } from "../dapps/FUniswap.sol";

function _getGelatoGasPrice() view returns (uint256) {
    return uint256(GELATO_GAS_PRICE_ORACLE.latestAnswer());
}

function _getGelatoProviderFees(uint256 _gas, address _colToken) view returns (uint256) {
    uint256 gasFeesInWei = mul(_gas, _getGelatoGasPrice());
    if (_colToken == ETH) {
        return gasFeesInWei;
    } else {
        // Get fees amount in colToken
        address[] memory _paths = new address[](2);
        _paths[0] = _colToken;
        _paths[1] = ETH;
        uint256[] memory _amounts = _getAmountsIn(gasFeesInWei, _paths);
        return _amounts[0];
    }
}
