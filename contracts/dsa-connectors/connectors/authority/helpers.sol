pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import {DSMath} from "../../common/math.sol";
import {Basic} from "../../common/basic.sol";
import {ListInterface} from "./interface.sol";

abstract contract Helpers is DSMath, Basic {
    ListInterface internal constant listContract = ListInterface(0x7969c5eD335650692Bc04293B07F5BF2e7A673C0);

    function checkAuthCount() internal view returns (uint256 count) {
        uint64 accountId = listContract.accountID(address(this));
        count = listContract.accountLink(accountId).count;
    }
}
