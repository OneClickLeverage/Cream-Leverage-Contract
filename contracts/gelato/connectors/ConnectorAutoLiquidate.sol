// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/GelatoBytes.sol";
import "../interfaces/InstaDapp/connectors/IConnectInstaPoolV2.sol";
import { sub, add, wdiv } from "../math/DSMath.sol";
import "../utils/SafeMath.sol";
import "../utils/IERC20.sol";
import { AccountInterface, ConnectorInterface } from "../interfaces/InstaDapp/IInstaDapp.sol";
import { DAI, ETH, CONNECT_MAKER, CONNECT_UNISWAP, INSTA_POOL_V2 } from "../constants/CInstaDapp.sol";
import { _getMakerVaultDebt } from "../functions/dapps/FMaker.sol";
import { _encodeFlashPayback } from "../functions/InstaDapp/connectors/FInstaPoolV2.sol";
import {
    _encodePaybackMakerVault,
    _encodedWithdrawMakerVault
} from "../functions/InstaDapp/connectors/FConnectMaker.sol";
import { _encodePayGelatoProvider } from "../functions/InstaDapp/connectors/FConnectGelatoProviderPayment.sol";
import { _getGelatoProviderFees } from "../functions/gelato/FGelato.sol";
import {
    _getFlashLoanRoute,
    _getGasConsumedAutoLiquidation,
    _convertTo18
} from "../functions/gelato/FGelatoAutoLiquidation.sol";
import { _encodeUniswapBuy } from "../functions/InstaDapp/connectors/FUniswap.sol";
import { _getAmountsIn } from "../functions/dapps/FUniswap.sol";

contract ConnectorAutoLiquidate is ConnectorInterface {
    using GelatoBytes for bytes;
    using SafeMath for uint256;

    // solhint-disable const-name-snakecase
    string public constant override name = "ConnectorAutoLiquidate-v1.0";
    uint256 internal immutable _id;
    address internal immutable _connectGelatoProviderPayment;

    constructor(uint256 id, address connectGelatoProviderPayment) {
        _id = id;
        _connectGelatoProviderPayment = connectGelatoProviderPayment;
    }

    /// @dev Connector Details
    function connectorID() external view override returns (uint256 _type, uint256 id) {
        (_type, id) = (1, _id);
    }

    function getDataAndCastAutoLiquidation(uint256 _vaultId, address _colToken) external payable {
        (address[] memory targets, bytes[] memory datas) = _dataAutoLiquidation(_vaultId, _colToken);

        _cast(targets, datas);
    }

    function _cast(address[] memory targets, bytes[] memory datas) internal {
        // Instapool V2 / FlashLoan call
        bytes memory castData =
            abi.encodeWithSelector(
                AccountInterface.cast.selector,
                targets,
                datas,
                msg.sender // msg.sender == GelatoCore
            );

        // solhint-disable  avoid-low-level-calls
        (bool success, bytes memory returndata) = address(this).delegatecall(castData);
        if (!success) {
            returndata.revertWithError("ConnectorAutoLiquidate._cast:");
        }
    }

    // Call `flashBorrowAndCast` with our recipe to self liquidate the cdp
    function _dataAutoLiquidation(uint256 _vaultId, address _colToken)
        internal
        view
        returns (address[] memory targets, bytes[] memory datas)
    {
        targets = new address[](1);
        targets[0] = INSTA_POOL_V2;

        uint256 wDaiToBorrow = _getMakerVaultDebt(_vaultId);
        uint256 route = _getFlashLoanRoute(DAI, wDaiToBorrow);
        uint256 gasConsumed = _getGasConsumedAutoLiquidation(route, _colToken);
        // Fees amount come converted already to be paid with colToken
        uint256 gasFeesInColToken = _getGelatoProviderFees(gasConsumed, _colToken);

        (address[] memory _targets, bytes[] memory _datas) =
            _spellsAutoLiquidate(_vaultId, _colToken, wDaiToBorrow, gasFeesInColToken);

        datas = new bytes[](1);
        datas[0] = abi.encodeWithSelector(
            IConnectInstaPoolV2.flashBorrowAndCast.selector,
            DAI,
            wDaiToBorrow,
            route,
            abi.encode(_targets, _datas)
        );
    }

    // Auto Liquidation recipe:
    // [1) Take DAI flash loan equal to current CDP debt] -> flashBorrowAndCast
    // Spells to be casted:
    //      2) Pay back debt using flash loaned DAI
    //      3) Withdraw ETH/ERC20 from the CDP
    //      4) Convert required amount of ETH/ERC20 to DAI using a DEX
    //      5) Pay back DAI flash loan debt
    //      6) Withdraw remaining ETH/ERC20 to account
    function _spellsAutoLiquidate(
        uint256 _vaultId,
        address _colToken,
        uint256 _wDaiToBorrow,
        uint256 _gasFeesInColToken
    ) internal view returns (address[] memory targets, bytes[] memory datas) {
        targets = new address[](5);
        targets[0] = CONNECT_MAKER; // payback cdp debt
        targets[1] = CONNECT_MAKER; // withdraw eth from cdp
        targets[2] = CONNECT_UNISWAP; // convert eth to required dai to pay flash loan
        targets[3] = _connectGelatoProviderPayment; // payProvider
        targets[4] = INSTA_POOL_V2; // flashPayback

        datas = new bytes[](5);
        datas[0] = _encodePaybackMakerVault(_vaultId, uint256(-1), 0, 0);
        datas[1] = _encodedWithdrawMakerVault(_vaultId, uint256(-1), 0, 0);

        address[] memory _paths = new address[](2);
        _paths[0] = _colToken;
        _paths[1] = DAI;

        uint256[] memory _amounts = _getAmountsIn(_wDaiToBorrow, _paths);

        // use wdiv to equal _amounts[0].mul(10**18).div(_wDaiToBorrow);
        uint256 _askPrice = wdiv(_amounts[0], _wDaiToBorrow);
        uint256 _askPriceWithSlippage = add(_askPrice, _askPrice.div(50)); // 2% slipagge
        // Connector receives unitAmount with 18 decimals
        uint256 _unitAmt = _convertTo18(_colToken == ETH ? 18 : IERC20(_colToken).decimals(), _askPriceWithSlippage);

        datas[2] = _encodeUniswapBuy(DAI, _colToken, _wDaiToBorrow, _unitAmt, 0, 0);
        datas[3] = _encodePayGelatoProvider(_colToken, _gasFeesInColToken, 0, 0);
        datas[4] = _encodeFlashPayback(DAI, _wDaiToBorrow, 0, 0);
    }
}
