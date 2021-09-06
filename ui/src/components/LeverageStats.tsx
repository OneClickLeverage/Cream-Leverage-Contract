import React from 'react'
import { CSS_COLOR_GREEN, CSS_COLOR_RED, CSS_COLOR_YELLOW } from '../utils/color'


function setRiskColor(rate: number): string {
  if (rate > 0.7) {
    return CSS_COLOR_RED
  } else if (rate <= 0.7 && rate > 0.5) {
    return CSS_COLOR_YELLOW
  }
  return CSS_COLOR_GREEN
}

interface Props {
  hasPosition: boolean
  currentDebtRatio: number
  debtRatio: number
  collateralRatio: number
  currentLiquidationPrice: number
  conversionRate: number
  liquidationPrice: number
}

export function LeverageStats(props: Props) {
  return (
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
  )
}