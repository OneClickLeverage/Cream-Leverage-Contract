// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

interface UniswapAnchoredView {
  /**
    * @notice Get the underlying price of a cToken
    * @dev Implements the PriceOracle interface for Compound v2.
    * @param cToken The cToken address for price retrieval
    * @return Price denominated in USD, with 18 decimals, for the given cToken address
    */
  function getUnderlyingPrice(address cToken) external view returns (uint);
}