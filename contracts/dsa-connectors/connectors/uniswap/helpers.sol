pragma solidity ^0.7.0;

import {TokenInterface} from "../../common/interfaces.sol";
import {DSMath} from "../../common/math.sol";
import {Basic} from "../../common/basic.sol";
import {IUniswapV2Router02, IUniswapV2Factory} from "./interface.sol";

abstract contract Helpers is DSMath, Basic {
    /**
     * @dev uniswap v2 router02
     */
    IUniswapV2Router02 internal constant router =
        IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    function getExpectedBuyAmt(address[] memory paths, uint256 sellAmt)
        internal
        view
        returns (uint256 buyAmt)
    {
        uint256[] memory amts = router.getAmountsOut(sellAmt, paths);
        buyAmt = amts[1];
    }

    function getExpectedSellAmt(address[] memory paths, uint256 buyAmt)
        internal
        view
        returns (uint256 sellAmt)
    {
        uint256[] memory amts = router.getAmountsIn(buyAmt, paths);
        sellAmt = amts[0];
    }

    function checkPair(address[] memory paths) internal view {
        address pair = IUniswapV2Factory(router.factory()).getPair(
            paths[0],
            paths[1]
        );
        require(pair != address(0), "No-exchange-address");
    }

    function getPaths(address buyAddr, address sellAddr)
        internal
        pure
        returns (address[] memory paths)
    {
        paths = new address[](2);
        paths[0] = address(sellAddr);
        paths[1] = address(buyAddr);
    }

    function getMinAmount(
        TokenInterface token,
        uint256 amt,
        uint256 slippage
    ) internal view returns (uint256 minAmt) {
        uint256 _amt18 = convertTo18(token.decimals(), amt);
        minAmt = wmul(_amt18, sub(WAD, slippage));
        minAmt = convert18ToDec(token.decimals(), minAmt);
    }
}
