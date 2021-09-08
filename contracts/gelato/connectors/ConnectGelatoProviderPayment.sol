// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "../interfaces/InstaDapp/connectors/IConnectGelatoProviderPayment.sol";
import "../utils/Ownable.sol";
import "../utils/Address.sol";
import "../libraries/GelatoString.sol";
import "../utils/IERC20.sol";
import "../utils/SafeERC20.sol";
import { _getUint, _setUint } from "../functions/InstaDapp/FInstaDapp.sol";
import { ETH } from "../constants/CInstaDapp.sol";
import { IGelatoProviders } from "@gelatonetwork/core/contracts/gelato_core/interfaces/IGelatoProviders.sol";

/// @title ConnectGelatoProviderPayment
/// @notice InstaDapp Connector to compensate Gelato automation-gas Providers.
/// @author Gelato Team
contract ConnectGelatoProviderPayment is IConnectGelatoProviderPayment, Ownable {
    using Address for address payable;
    using GelatoString for string;
    using SafeERC20 for IERC20;

    // solhint-disable-next-line const-name-snakecase
    string public constant override name = "ConnectGelatoProviderPayment-v1.0";

    address public constant override GELATO_CORE = 0x1d681d76ce96E4d70a88A00EBbcfc1E47808d0b8;
    address public override gelatoProvider;
    address internal immutable _this;

    uint256 internal immutable _id;

    constructor(uint256 id, address _gelatoProvider) noAddressZeroProvider(_gelatoProvider) {
        _id = id;
        _this = address(this);
        gelatoProvider = _gelatoProvider;
    }

    modifier noAddressZeroProvider(address _gelatoProvider) {
        require(_gelatoProvider != address(0x0), "ConnectGelatoProviderPayment.noAddressZeroProvider");
        _;
    }

    /// @dev Connector Details
    function connectorID() external view override returns (uint256 _type, uint256 id) {
        (_type, id) = (1, _id); // Should put specific value.
    }

    /// @notice Set the gelatoProvider address that will be paid for executing a task
    function setProvider(address _gelatoProvider) external override onlyOwner noAddressZeroProvider(_gelatoProvider) {
        gelatoProvider = _gelatoProvider;
    }

    /// @notice Transfers automation gas fees to Gelato Provider
    /// @dev Gelato Provider risks:
    ///    - _getId does not match actual InstaMemory gelatoProvider payment slot
    ///    - _token balance not in DSA
    ///    - worthless _token risk
    /// payable to be compatible in conjunction with DSA.cast payable target
    /// @param _token The token used to pay the Provider.
    /// @param _amt The amount of _token to pay the Gelato Provider.
    /// @param _getId The InstaMemory slot at which the payment amount was stored.
    /// @param _setId The InstaMemory slot to save the gelatoProvider payout amound in.
    function payProvider(
        address _token,
        uint256 _amt,
        uint256 _getId,
        uint256 _setId
    ) external payable override {
        address provider = IConnectGelatoProviderPayment(_this).gelatoProvider();

        uint256 amt = _getUint(_getId, _amt);
        _setUint(_setId, amt);

        if (_token == ETH) {
            // solhint-disable no-empty-blocks
            try IGelatoProviders(GELATO_CORE).provideFunds{ value: amt }(provider) {} catch Error(string memory error) {
                error.revertWithInfo("ConnectGelatoProviderPayment.payProvider.provideFunds:");
            } catch {
                revert("ConnectGelatoProviderPayment.payProvider.provideFunds:undefined");
            }
        } else {
            IERC20(_token).safeTransfer(provider, amt);
        }
    }
}
