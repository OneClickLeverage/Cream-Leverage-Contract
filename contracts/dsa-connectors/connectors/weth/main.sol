pragma solidity ^0.7.0;

/**
 * @title WETH.
 * @dev Wrap and Unwrap WETH.
 */

import {DSMath} from "../../common/math.sol";
import {Basic} from "../../common/basic.sol";
import {Helpers} from "./helpers.sol";

abstract contract Resolver is DSMath, Basic, Helpers {
    function deposit(uint256 amt) public payable {
        amt = amt == uint256(-1) ? address(this).balance : amt;
        wethContract.deposit{value: amt}();
    }

    function withdraw(uint256 amt) public payable {
        amt = amt == uint256(-1) ? wethContract.balanceOf(address(this)) : amt;
        approve(wethContract, wethAddr, amt);
        wethContract.withdraw(amt);
    }
}

contract ConnectV2WETH is Resolver {
    string public constant name = "WETH";
}
