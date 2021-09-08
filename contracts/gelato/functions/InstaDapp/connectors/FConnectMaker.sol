// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "../../../interfaces/InstaDapp/connectors/IConnectMaker.sol";

function _encodePaybackMakerVault(
    uint256 _vaultId,
    uint256 _amt,
    uint256 _getId,
    uint256 _setId
) pure returns (bytes memory) {
    return abi.encodeWithSelector(IConnectMaker.payback.selector, _vaultId, _amt, _getId, _setId);
}

function _encodedWithdrawMakerVault(
    uint256 _vaultId,
    uint256 _amt,
    uint256 _getId,
    uint256 _setId
) pure returns (bytes memory) {
    return abi.encodeWithSelector(IConnectMaker.withdraw.selector, _vaultId, _amt, _getId, _setId);
}
