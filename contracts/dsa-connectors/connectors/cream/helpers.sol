pragma solidity ^0.7.0;

import {DSMath} from "../../common/math.sol";
import {Basic} from "../../common/basic.sol";
import {CTokenInterface, ComptrollerInterface, CreamMappingInterface} from "./interface.sol";

abstract contract Helpers is DSMath, Basic {
    /**
     * @dev Cream Comptroller
     */
    ComptrollerInterface internal constant troller1 =
        ComptrollerInterface(0x3d5BC3c8d13dcB8bF317092d84783c2697AE9258);

    ComptrollerInterface internal constant troller2 =
        ComptrollerInterface(0xAB1c342C7bf5Ec5F02ADEA1c2270670bCa144CbB);

    /**
     * @dev Cream Mapping
     */
    // TODO: wait for the cream mapping contract address
    CreamMappingInterface internal constant creamMapping =
        CreamMappingInterface(0xdbC43Ba45381e02825b14322cDdd15eC4B3164E6);

    /**
     * @dev enter cream market
     */
    function enterMarket(address cToken) internal {
        address comptroller = getTroller(cToken);
        ComptrollerInterface troller = ComptrollerInterface(comptroller);

        address[] memory markets = troller.getAssetsIn(address(this));
        bool isEntered = false;
        for (uint256 i = 0; i < markets.length; i++) {
            if (markets[i] == cToken) {
                isEntered = true;
            }
        }
        if (!isEntered) {
            address[] memory toEnter = new address[](1);
            toEnter[0] = cToken;
            troller.enterMarkets(toEnter);
        }
    }

    function getTroller(address cToken) internal view returns(address) {
        return CTokenInterface(cToken).comptroller();
    }


}
