pragma solidity ^0.7.0;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {DSMath} from "../../common/math.sol";
import {Basic} from "../../common/basic.sol";

import "hardhat/console.sol";

abstract contract BasicResolver is DSMath, Basic {
    using SafeERC20 for IERC20;

    function deposit(address token, uint256 amt) public payable {
        if (token != ethAddr) {
            IERC20 tokenContract = IERC20(token);
            amt = amt == uint256(-1)
                ? tokenContract.balanceOf(msg.sender)
                : amt;
            tokenContract.safeTransferFrom(msg.sender, address(this), amt);
        } else {
            require(
                msg.value == amt || amt == uint256(-1),
                "invalid-ether-amount"
            );
            amt = msg.value;
        }
    }

    function withdraw(
        address token,
        uint256 amt,
        address payable to
    ) public payable {
        if (token == ethAddr) {
            amt = amt == uint256(-1) ? address(this).balance : amt;
            to.call{value: amt}("");
        } else {
            IERC20 tokenContract = IERC20(token);
            amt = amt == uint256(-1)
                ? tokenContract.balanceOf(address(this))
                : amt;
            tokenContract.safeTransfer(to, amt);
        }
    }
}

contract ConnectV2Basic is BasicResolver {
    string public constant name = "Basic";
}
