import React from 'react';
import { deleverageFromBrowser } from '../../../insta_scripts/experiments/fromBrowser';
import { TokenID } from '../types/TokenID';

declare let window: any;
interface Props {
  collateralToken: TokenID,
  debtToken: TokenID,
  myAddress: string,
}

export function DeleveragePopUpBody(props: Props) {
  async function executeDeleverage() {
    await deleverageFromBrowser(window.ethereum, props.myAddress, 2, 6000, 0.5, props.collateralToken, props.debtToken)
  }

  return (
    <div className="leverage-body">
      <div className="row">
        <div className="row-header">
          <div className="row-header-label">
            DEPOSIT AMOUNT
          </div>
          <div className="balance-amount">
            Balance:&nbsp;
            <span className="eth-balance-color">
              0.00 ETH
            </span>
          </div>
        </div>

        <div className="price-input-outer">
          <div className="price-input-inner">
            <div className="price-input-inner-inner">
              <div className="price-input-wrapper">
                <input
                  className="price-input"
                  type="number"
                >
                </input>
                <span>ETH</span>
              </div>
              <div>$0</div>
            </div>
          </div>
        </div>

        <div className="row-header">
          <div className="row-header-label">
            BORROW AMOUNT
          </div>
        </div>

        <div className="price-input-outer">
          <div className="price-input-inner">
            <div className="price-input-inner-inner">
              <div className="price-input-wrapper">
                <input
                  className="price-input"
                  type="number">
                </input>
                <span>DAI</span>
              </div>
              <div> ETH</div>
            </div>
          </div>
        </div>

        <div className="leverage-label">Leverage</div>
        <div className="rc-slider-outer">
          <div className="rc-slider rc-slider-with-marks">
            <div className="rc-slider-rail" style={{ "backgroundColor": "rgb(21, 27, 40)" }}>
            </div>
            <div className="rc-slider-track" style={{ "backgroundColor": "rgb(255, 184, 210)", left: "0%", right: "auto", width: "0%" }}></div>
            <div className="rc-slider-step">
              <span className="rc-slider-dot rc-slider-dot-active .rc-slider-dot--instyle-active"></span>
              <span className="rc-slider-dot rc-slider-dot--instyle" style={{ left: "25%" }}></span>
              <span className="rc-slider-dot rc-slider-dot--instyle" style={{ left: "50%" }}></span>
              <span className="rc-slider-dot rc-slider-dot--instyle" style={{ left: "75%" }}></span>
              <span className="rc-slider-dot rc-slider-dot--instyle" style={{ left: "100%" }}></span>
            </div>
            <div tabIndex={0} className="rc-slider-handle rc-slider-handle--instyle" role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} aria-disabled="false"></div>
            <div className="rc-slider-mark">
              <span className="rc-slider-mark-text rc-slider-mark-text-active rc-slider-mark-text--instyle ">1x</span>
              <span className="rc-slider-mark-text rc-slider-mark-text--instyle " style={{ left: "25%" }}>2x</span>
              <span className="rc-slider-mark-text rc-slider-mark-text--instyle " style={{ left: "50%" }}>3x</span>
              <span className="rc-slider-mark-text rc-slider-mark-text--instyle " style={{ left: "75%" }}>4x</span>
              <span className="rc-slider-mark-text rc-slider-mark-text--instyle " style={{ transform: "translateX(-80%)", left: "100%" }}>5x</span>
            </div>
          </div>
        </div>
      </div>

      <div className="slippage-label">Slippage Tolerance</div>
      <div className="priceimpact-input-outer">
        <input
          className="priceimpact-input"
          type="number" value="0.5">
        </input>
        <span > % ( default: 0.5% )</span>
      </div>

      <div className="row" style={{ marginTop: "42px" }}>
        <div className="row-header" style={{ marginBottom: "12px" }}>
          <div className="row-header-label">LEVERAGE STATS (EXPECTED)</div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Debt Ratio</div>
          <div className="row-content-value">%</div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Liquidation Price</div>
          <div className="row-content-value">$</div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Borrow APY</div>
          <div className="row-content-value">
            <div>0%</div>
          </div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Supply APY</div>
          <div className="row-content-value">
            <div>0%</div>
          </div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Net APY (supply - borrow)</div>
          <div className="row-content-value">
            <div>0%</div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: "100px", display: "flex" }}>
        <button
          onClick={executeDeleverage}
          className="borrow-button" style={{ width: "100%", marginTop: "6px", marginLeft: "0px" }}>Execute Leverage</button>
      </div>
    </div> 
  )
}