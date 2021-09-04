pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

/**
 * @title CREAM.
 * @dev Lending & Borrowing.
 */

import {TokenInterface} from "../../common/interfaces.sol";
import {Helpers} from "./helpers.sol";
import {CETHInterface, CTokenInterface} from "./interface.sol";
import "hardhat/console.sol";

abstract contract CreamResolver is Helpers {
    function depositRaw(
        address token,
        address cToken,
        uint256 amt
    ) public payable {
        require(
            token != address(0) && cToken != address(0),
            "invalid token/ctoken address"
        );

        enterMarket(cToken);

        if (token == ethAddr) {
            amt = amt == uint256(-1) ? address(this).balance : amt;
            CETHInterface(cToken).mint{value: amt}();
        } else {
            TokenInterface tokenContract = TokenInterface(token);

            amt = amt == uint256(-1)
                ? tokenContract.balanceOf(address(this))
                : amt;

            approve(tokenContract, cToken, amt);

            require(CTokenInterface(cToken).mint(amt) == 0, "deposit-failed");
            console.log("16");
        }
    }

    function withdrawRaw(
        address token,
        address cToken,
        uint256 amt
    ) public payable {
        require(
            token != address(0) && cToken != address(0),
            "invalid token/ctoken address"
        );

        CTokenInterface cTokenContract = CTokenInterface(cToken);
        if (amt == uint256(-1)) {
            TokenInterface tokenContract = TokenInterface(token);
            uint256 initialBal = token == ethAddr
                ? address(this).balance
                : tokenContract.balanceOf(address(this));
            require(
                cTokenContract.redeem(
                    cTokenContract.balanceOf(address(this))
                ) == 0,
                "full-withdraw-failed"
            );
            uint256 finalBal = token == ethAddr
                ? address(this).balance
                : tokenContract.balanceOf(address(this));
            amt = finalBal - initialBal;
        } else {
            require(
                cTokenContract.redeemUnderlying(amt) == 0,
                "withdraw-failed"
            );
        }
    }

    function borrowRaw(
        address token,
        address cToken,
        uint256 amt
    ) public payable {
        require(
            token != address(0) && cToken != address(0),
            "invalid token/ctoken address"
        );

        enterMarket(cToken);

        require(CTokenInterface(cToken).borrow(amt) == 0, "borrow-failed");
    }

    function paybackRaw(
        address token,
        address cToken,
        uint256 amt
    ) public payable {
        require(
            token != address(0) && cToken != address(0),
            "invalid token/ctoken address"
        );

        CTokenInterface cTokenContract = CTokenInterface(cToken);
        amt = amt == uint256(-1)
            ? cTokenContract.borrowBalanceCurrent(address(this))
            : amt;

        if (token == ethAddr) {
            require(address(this).balance >= amt, "not-enough-eth");
            CETHInterface(cToken).repayBorrow{value: amt}();
        } else {
            TokenInterface tokenContract = TokenInterface(token);
            require(
                tokenContract.balanceOf(address(this)) >= amt,
                "not-enough-token"
            );
            approve(tokenContract, cToken, amt);
            require(cTokenContract.repayBorrow(amt) == 0, "repay-failed.");
        }
    }
}

contract ConnectV2Cream is CreamResolver {
    string public name = "Cream";
}
