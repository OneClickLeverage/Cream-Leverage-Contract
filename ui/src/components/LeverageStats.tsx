import React from 'react'
import { CSS_RGB_CREAM_YELLOW, CSS_RGB_EMERALD_BRIGHT, CSS_RGB_PINK } from '../utils/color'


function setRiskColor(rate: number): string {
  if (rate > 0.7) {
    return CSS_RGB_PINK
  } else if (rate <= 0.7 && rate > 0.5) {
    return CSS_RGB_CREAM_YELLOW
  }
  return CSS_RGB_EMERALD_BRIGHT
}

interface Props {
  hasPosition: boolean
  currentDebtRatio: number
  debtRatio: number
  collateralRatio: number
  currentLiquidationPrice: number
  conversionRate: number
  liquidationPrice: number
  currentDebt: number
  currentCollateral: number
  debtToAdd: number
  collateralToAdd: number
  debtTicker: string
  collateralTicker: string
  leverageRate: number
  currentLeverageRate: number
}

export function LeverageStats(props: Props) {
  return (
    <>
      <div className="row" style={{ marginTop: "32px" }}>
          <div className="row-header" style={{ marginBottom: "12px" }}>
            <div className="row-header-label">POSITION</div>
          </div>
          <div className="row-content">
            <div className="row-content-label">
              Collateral:&nbsp;
            </div>
            <span className={`row-content-value eth-balance`}>
              <span>
                {`${props.currentCollateral.toFixed(4)} ${props.collateralTicker}`}
              </span>
              { props.hasPosition &&
                <span>
                  {` -> `}
                </span>
              }
              { props.hasPosition &&
                <span className="color-emerald">
                  {`${(props.currentCollateral+props.collateralToAdd).toFixed(4)} ${props.collateralTicker}`}
                </span>
              }
            </span>
          </div>
          <div className="row-content">
            <div className="row-content-label">
            {`Debt (${props.collateralTicker}): `}
            </div>
            <span className={`row-content-value eth-balance`}>
              <span>
                {`~${((props.currentDebt/props.conversionRate) || 0).toFixed(4)} ${props.collateralTicker}`}
              </span>
              <span>
                {` -> `}
              </span>
              <span className="color-pink">
                {`~${(((props.debtToAdd + props.currentDebt)/props.conversionRate) || 0).toFixed(4)} ${props.collateralTicker}`}
              </span>
            </span>
          </div>
          <div className="row-content">
            <div className="row-content-label">
              {`Debt (${props.debtTicker}): `}
            </div>
            <span className={`row-content-value eth-balance`}>
              <span>
                {`${props.currentDebt.toFixed(2)} ${props.debtTicker}`}
              </span>
              <span>
                {` -> `}
              </span>
              <span className="color-pink">
                {`${(props.debtToAdd + props.currentDebt).toFixed(2)} ${props.debtTicker}`}
              </span>
            </span>
          </div>
          <div className="row-content">
            <div className="row-content-label">
              {`Leverage: `}
            </div>
            <span className={`row-content-value eth-balance`}>
              <span>
                {`${props.currentLeverageRate.toFixed(1)}x`}
              </span>
              <span>
                {` -> `}
              </span>
              <span>
                {`${props.leverageRate.toFixed(1)}x`}
              </span>
            </span>
          </div>
        </div>
      <div className="row" style={{ marginTop: "32px" }}>
        <div className="row-header" style={{ marginBottom: "12px" }}>
          <div className="row-header-label">LEVERAGE STATS (EXPECTED)</div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Debt Ratio</div>
          <div className="row-content-value">
            { props.hasPosition &&
              <div>
                <span style={{ color: setRiskColor(props.currentDebtRatio)}}>
                  {`${(props.currentDebtRatio * 100).toFixed(2)}%`}
                </span>
                <span>
                  {' -> '}
                </span>
                <span style={{ color: setRiskColor(props.debtRatio)}}>
                  {`${(props.debtRatio * 100).toFixed(2)}%`}
                </span>
              </div>
            }
            { !props.hasPosition &&
                <span style={{ color: setRiskColor(props.debtRatio)}}>
                  {`${(props.debtRatio * 100).toFixed(2)}%`}
                </span>
            }
          </div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Max Debt Ratio</div>
          <div className="row-content-value">
            <span>{`${(props.collateralRatio * 100).toFixed(0)}%`}</span>
          </div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Liquidation Price</div>
          <div className="row-content-value">
            { props.hasPosition &&
              <div>
                <span style={{ color: setRiskColor(props.currentDebtRatio)}}>
                  {`$${(props.currentLiquidationPrice).toFixed(2)}`}
                </span>
                <span>{" -> "}</span>
                <span style={{ color: setRiskColor(props.debtRatio)}}>
                  {`$${(props.liquidationPrice).toFixed(2)}`}
                </span>
              </div>
            }
            { !props.hasPosition &&
                <span style={{ color: setRiskColor(props.debtRatio)}}>
                {`$${(props.liquidationPrice).toFixed(2)}`}
                </span>
            }
            </div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Current Price</div>
          <div className="row-content-value">
            <span>{`$${props.conversionRate.toFixed(2)}`}</span>
          </div>
        </div>
      </div>
    </>
  )
}