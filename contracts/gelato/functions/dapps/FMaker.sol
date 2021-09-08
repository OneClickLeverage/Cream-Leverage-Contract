// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "../../interfaces/dapps/Maker/IMcdManager.sol";
import "../../interfaces/dapps/Maker/IVat.sol";
import { MCD_MANAGER } from "../../constants/CMaker.sol";
import { RAY, sub, mul } from "../../math/DSMath.sol";

function _getMakerVaultDebt(uint256 _vaultId) view returns (uint256 wad) {
    IMcdManager manager = IMcdManager(MCD_MANAGER);

    (bytes32 ilk, address urn) = _getVaultData(manager, _vaultId);
    IVat vat = IVat(manager.vat());
    (, uint256 rate, , , ) = vat.ilks(ilk);
    (, uint256 art) = vat.urns(ilk, urn);
    uint256 dai = vat.dai(urn);

    uint256 rad = sub(mul(art, rate), dai);
    wad = rad / RAY;

    wad = mul(wad, RAY) < rad ? wad + 1 : wad;
}

function _getVaultData(IMcdManager manager, uint256 vault) view returns (bytes32 ilk, address urn) {
    ilk = manager.ilks(vault);
    urn = manager.urns(vault);
}
