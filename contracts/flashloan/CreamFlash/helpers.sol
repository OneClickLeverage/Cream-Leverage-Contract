pragma solidity ^0.7.0;

import {IndexInterface, ListInterface, TokenInterface, ERC3156FlashLenderInterface} from "./interfaces.sol";

import {DSMath} from "../../dsa-connectors/common/math.sol";

contract Setup {
    IndexInterface public constant instaIndex = IndexInterface(0x2bdCC0de6bE1f7D2ee689a0342D76F52E8EFABa3); //
    ListInterface public constant instaList = ListInterface(0x7969c5eD335650692Bc04293B07F5BF2e7A673C0); //

    ERC3156FlashLenderInterface public constant lender1 =
        ERC3156FlashLenderInterface(0xa8682Cfd2B6c714d2190fA38863d545c7a0b73D5);
    ERC3156FlashLenderInterface public constant lender2 =
        ERC3156FlashLenderInterface(0x1a21Ab52d1Ca1312232a72f4cf4389361A479829);

    address public constant wethAddr =
        0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant ethAddr =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    TokenInterface constant wethContract = TokenInterface(wethAddr);

    /**
     * @dev modifier to check if msg.sender is a master
     */
    modifier isMaster() {
        require(msg.sender == instaIndex.master(), "not-master");
        _;
    }

    /**
     * @dev Converts the encoded data to sig.
     * @param data encoded data
     */
    function convertDataToSig(bytes memory data)
        internal
        pure
        returns (bytes4 sig)
    {
        bytes memory _data = data;
        assembly {
            sig := mload(add(_data, 32))
        }
    }

    /**
     * FOR SECURITY PURPOSE
     * only Smart DEFI Account can access the liquidity pool contract
     */
    modifier isDSA() {
        uint64 id = instaList.accountID(msg.sender);
        require(id != 0, "not-dsa-id");
        _;
    }
}

contract Helper is Setup, DSMath {
    function convertTo18(uint256 _amt, uint256 _dec)
        internal
        pure
        returns (uint256 amt)
    {
        amt = mul(_amt, 10**(18 - _dec));
    }

    function encodeDsaCastData(
        address dsa,
        address token,
        uint256 amount,
        bytes memory data
    ) internal pure returns (bytes memory _data) {
        _data = abi.encode(dsa, token, amount, data);
    }

    function spell(address _target, bytes memory _data) internal {
        require(_target != address(0), "target-invalid");
        assembly {
            let succeeded := delegatecall(
                gas(),
                _target,
                add(_data, 0x20),
                mload(_data),
                0,
                0
            )
            switch iszero(succeeded)
            case 1 {
                let size := returndatasize()
                returndatacopy(0x00, 0x00, size)
                revert(0x00, size)
            }
        }
    }

    function masterSpell(address _target, bytes calldata _data)
        external
        isMaster
    {
        spell(_target, _data);
    }
}
