// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/GelatoBytes.sol";
import "@gelatonetwork/core/contracts/conditions/GelatoConditionsStandard.sol";
import "../interfaces/InstaDapp/resolvers/IInstaMakerResolver.sol";
import { TokenInterface } from "../../dsa-connectors/common/interfaces.sol";
// import { CTokenInterface } from "../../dsa-connectors/connectors/cream.sol";
import { wmul, wdiv } from "../math/DSMath.sol";
import { console } from "hardhat/console.sol";
import { _getSupplyAndDebtAmount } from "../functions/dapps/FCream.sol";

/// @title ConditionCreamCTokenUnsafe
/// @notice Condition tracking Maker vault collateralization safety requirements.
/// @author Gelato Team
/// @dev taken from https://github.com/gelatodigital/gelato-instadapp/blob/master/contracts/contracts/gelato/conditions/ConditionCreamVaultUnsafe.sol
contract ConditionCreamCTokenUnsafe  {
    address internal constant ethAddr =
      0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    using GelatoBytes for bytes;

    /// @notice Convenience function for off-chain _conditionData encoding
    /// @dev Use the return for your Task's Condition.data field off-chain.
    /// @return The encoded payload for your Task's Condition.data field.
    function getConditionData(
        address _dsaAddress,
        address _colCToken,
        address _debtCToken
    ) public pure virtual returns (bytes memory) {
        return abi.encode(_dsaAddress, _colCToken, _debtCToken);
    }

    /// @notice Standard GelatoCore system function
    /// @dev A standard interface for GelatoCore to read Conditions
    // / @param _conditionData The data you get from `getConditionData()`
    /// @return OK if the Condition is there, else some error message.
    function ok(
        uint256,
        bytes calldata _conditionData,
        uint256
    ) public view virtual returns (string memory) {
        (address _dsaAddress,
        address _colCToken,
        address _debtCToken) =
            abi.decode(_conditionData, (address, address, address));

        return isPositionUnsafe(_dsaAddress, _colCToken, _debtCToken);
    }

    /// @notice Specific implementation of this Condition's ok function
    /// @dev The price oracle must return a uint256 WAD (10**18) value.
    // / @param _vaultId The id of the Maker vault
    // / @param _priceOracle The price oracle contract to supply the collateral price
    // /  e.g. Maker's ETH/USD oracle for ETH collateral pricing.
    // / @param _oraclePayload The data for making the staticcall to the oracle's read
    // /  method e.g. the selector for MakerOracle's read fn.
    // / @param _minColRatio The minimum collateral ratio measured in the price
    /// of the collateral as specified by the _priceOracle.
    /// @return OK if the Maker Vault is unsafe, otherwise some error message.
    function isPositionUnsafe(
        address _dsaAddress,
        address _colCToken,
        address _debtCToken
    ) public view virtual returns (string memory) {
        (uint256 supplyAmount, uint256 debtAmount) = _getSupplyAndDebtAmount(_dsaAddress, _colCToken, _debtCToken);

        console.log("supplyAmount", supplyAmount, "debtAmount", debtAmount);

        // uint256 colRatio = wdiv(wmul(vault.collateral, colPriceInWad), vault.debt);
        // return colRatio < _minColRatio ? OK : "MakerVaultNotUnsafe";
        return "OK";
    }

}