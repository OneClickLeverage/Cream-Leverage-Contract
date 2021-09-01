pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TokenInterface} from "../../common/interfaces.sol";
import { AccountInterface } from "./interfaces.sol";
import {Stores} from "../../common/stores.sol";
import {CreamFlashInterface, AccountInterface} from "./interfaces.sol";
import {DSMath} from "../../common/math.sol";
import "hardhat/console.sol";

//import {Variables} from "./variables.sol";

abstract contract FlashPoolResolver is DSMath, Stores {
    using SafeERC20 for IERC20;

    CreamFlashInterface public constant creamflash = CreamFlashInterface(0x4C4a2f8c81640e47606d3fd77B353E87Ba015584); // Proxy instead of imp

    function flashBorrowAndCast(
        address _token,
        uint256 _amt,
        uint256 _route,
        bytes memory _data
    ) external payable {
        AccountInterface(address(this)).enable(address(creamflash));

        (string[] memory _targets, bytes[] memory _callDatas) = abi.decode(
            _data,
            (string[], bytes[])
        );

        bytes memory callData = abi.encodeWithSignature(
            "cast(string[],bytes[],address)",
            _targets,
            _callDatas,
            address(creamflash)
        );

        creamflash.initiateFlashLoan(_token, _amt, _route, callData);
        AccountInterface(address(this)).disable(address(creamflash));
    }

    function flashPayback(address token, uint256 amt) external payable {
        IERC20 tokenContract = IERC20(token);

        if (token == ethAddr) {
            Address.sendValue(payable(address(creamflash)), amt);
        } else {
            console.log("creamflash", address(creamflash));
            console.log("amt", amt);
            console.log("token", token);

            uint this_token_balance = TokenInterface(token).balanceOf(address(this));
            uint dsa_token_balance = TokenInterface(token).balanceOf(0x33791c463B145298c575b4409d52c2BcF743BF67);
            console.log("this_token_balance", this_token_balance);
            console.log("dsa_token_balance", dsa_token_balance);

            console.log("20");
            //tokenContract.approve(address(0x197070723CE0D3810a0E47F06E935c30a480D4Fc), amt);
            tokenContract.safeTransfer(address(creamflash), amt);
            console.log("21");
            
        }
    }
}

contract ConnectV2FlashPool is FlashPoolResolver {
    string public name = "FlashPool";
}
