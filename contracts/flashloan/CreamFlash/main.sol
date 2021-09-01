pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import {Helper} from "./helpers.sol";
import "hardhat/console.sol";

import {
    IndexInterface, 
    ListInterface, 
    TokenInterface, 
    DSAInterface, 
    ERC3156FlashLenderInterface, 
    ERC3156FlashBorrowerInterface
    } from "./interfaces.sol";

contract CreamFlash is Helper, ERC3156FlashBorrowerInterface {
    using SafeERC20 for IERC20;

    function initiateFlashLoan(
        address _token,
        uint256 _amount,
        uint256 _route,
        bytes calldata _data
    ) external isDSA {
        bytes memory callDatas = abi.encode(msg.sender, _data);

        console.log("5");
        // approve lender?
        // https://soliditydeveloper.com/eip-3156

        if (_route == 0) {
            // CreamV1
            ERC3156FlashLenderInterface(lender1).flashLoan(
                this,
                _token,
                _amount,
                callDatas
            );
        } else if (_route == 1) {
            // IronBank
            ERC3156FlashLenderInterface(lender2).flashLoan(
                this,
                _token,
                _amount,
                callDatas
            );
        }
        return;
    }

    function onFlashLoan(
        address initiator,
        address _token,
        uint256 _amount,
        uint256 _fee,
        bytes calldata _data
    ) external override returns (bytes32) {
        require(initiator == address(this), "Not the same sender");
        console.log("6");

        (address _dsa, bytes memory _data) = abi.decode(_data, (address, bytes));

        console.log("_token", _token);

        // Send flashloaned token to my DSA
        if (_token == ethAddr) {
            (bool success, ) = address(_dsa).call{value: _amount}("");
            require(success, "Failed to transfer ETH");
        } else {
            //  is it necessary here ?
            // TokenInterface(_token).approve(_dsa, _amount.add(_fee));
            IERC20(_token).safeTransfer(_dsa, _amount);
            console.log("safeTransfer");
        }
        console.log("7");
        uint dsa_token_balance = IERC20(_token).balanceOf(_dsa);
        console.log("dsa_token_balance", dsa_token_balance);

        console.log("dsa", _dsa);

        address cream_connector = 0xD8a5a9b31c3C0232E196d518E89Fd8bF83AcAd43;
        uint dsa_wbtc_allowance = IERC20(_token).allowance(_dsa, cream_connector);
        console.log("dsa_wbtc_allowance", dsa_wbtc_allowance);
        // Call dsa to execute operations

        
        console.log("_amount", _amount);
        console.log("_fee", _fee);
        TokenInterface(_token).approve(msg.sender, _amount + _fee);

        Address.functionCall(_dsa, _data, "DSA-flashloan-fallback-failed");
        console.log("8");
        // Payback triggered automatically.
        // See: https://github.com/CreamFi/compound-protocol/blob/23214f681bb947cfd0e34303356dac17664a054a/contracts/CCollateralCapErc20.sol#L225

        return keccak256("ERC3156FlashBorrowerInterface.onFlashLoan");
    }

    //https://github.com/CreamFi/flashloan-playground/blob/main/contracts/FlashloanBorrower.sol
    //https://github.com/Instadapp/dsa-flashloan/blob/master/contracts/flashloan/Instapool/main.sol
    //convertTo18(_amount, _decimals)
    //wmul ??
    //TokenInterface(token).decimals()
}

contract CreamFlashImplementation is CreamFlash {
    receive() external payable {}
}
