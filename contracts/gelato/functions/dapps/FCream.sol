// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import { SafeMath } from "../../utils/SafeMath.sol";
import { CTokenInterface } from "../../../dsa-connectors/connectors/cream/interface.sol";
import { IERC20 } from "../../utils/IERC20.sol";
import { UniswapAnchoredView } from "../../interfaces/compound/IUniswapAnchoredView.sol";
import { console } from "hardhat/console.sol";

// same as getAccountData
function _getSupplyAndDebtAmount(
  address _dsaAddress,
  address _collCRToken,
  address _debtCRToken
) view returns (uint256, uint256) {
  require(_dsaAddress != address(0), "not-valid-address");

  CTokenInterface collToken = CTokenInterface(_collCRToken);
  (uint err, uint cTokenBalanceCol, , uint xChangeRateCol) = collToken.getAccountSnapshot(_dsaAddress);
  require(err > 0, "math-err_ctoken_snapshot_coll");

  CTokenInterface debtToken = CTokenInterface(_debtCRToken);
  (uint err2, , uint borrowBalanceDebt, ) = debtToken.getAccountSnapshot(_dsaAddress);
  require(err2 > 0, "math-err_ctoken_snapshot_debt");

  // IERC20 collToken = IERC20(_collToken);
  // uint256 decimals = collToken.decimals()
  // console.log("decimals", decimals)
  uint256 supplyAmount = SafeMath.div(SafeMath.mul(cTokenBalanceCol, xChangeRateCol), 10**18);
  console.log("supplyAmount", supplyAmount);
  uint256 debtAmount = borrowBalanceDebt;

  return (supplyAmount, debtAmount);
}

// function _getPrice(address token) returns (uint256) {
//   uint _usdcEth = UniswapAnchoredView(address("0x338EEE1F7B89CE6272f302bDC4b952C13b221f1d")).getUnderlyingPrice(address(0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c));
//   uint256 ethPrice = 
// }