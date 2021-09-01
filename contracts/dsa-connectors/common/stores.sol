pragma solidity ^0.7.0;

import {InstaMapping} from "./interfaces.sol";

abstract contract Stores {
    /**
     * @dev Return ethereum address
     */
    address internal constant ethAddr =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /**
     * @dev Return Wrapped ETH address
     */
    address internal constant wethAddr =
        0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    /**
     * @dev Return InstaDApp Mapping Addresses
     */
    InstaMapping internal constant instaMapping =
        InstaMapping(0xe81F70Cc7C0D46e12d70efc60607F16bbD617E88);
}
