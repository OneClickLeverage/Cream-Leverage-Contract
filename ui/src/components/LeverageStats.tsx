import React from 'react'
import { TokenID } from '../types/TokenID'
import { CSS_RGB_CREAM_YELLOW, CSS_RGB_EMERALD_BRIGHT, CSS_RGB_PINK } from '../utils/color'
import { roundAmount } from '../utils/number'

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
  collateralTokenID: TokenID
  debtTokenID: TokenID
}

export function LeverageStats(props: Props) {
  const nextDebt = props.debtToAdd + props.currentDebt
  const nextTotalDebtInColl = nextDebt /props.conversionRate
  const nextTotalCollateral = props.currentCollateral+props.collateralToAdd+(props.debtToAdd/props.conversionRate);
  const currentDebtInColl = props.currentDebt/props.conversionRate

  return (
    <>
      <div className="row" style={{ marginTop: "28px" }}>
          <div className="row-header" style={{ marginBottom: "0" }}>
            <div className="row-header-label">POSITION</div>
          </div>
          <div className="row-content">
            <div className="row-content-label">
              Collateral:&nbsp;
            </div>
            <span className={`row-content-value eth-balance flex-container`}>
              <span className="position-before">
                {`${roundAmount(props.currentCollateral - (currentDebtInColl), props.collateralTokenID)} ${props.collateralTicker}`}
              </span>
              { props.hasPosition &&
                <span className="position-arrow">
                  {` -> `}
                </span>
              }
              { props.hasPosition &&
                <span className="color-emerald position-after">
                  {`${roundAmount(nextTotalCollateral - nextTotalDebtInColl, props.collateralTokenID)} ${props.collateralTicker}`}
                </span>
              }
            </span>
          </div>
          <div className="row-content">
            <div className="row-content-label">
              {`Debt: `}
            </div>
            <span className={`row-content-value eth-balance flex-container`}>
              <span className="position-before">
                <span className="column">
                  <span>
                    {`${roundAmount(props.currentDebt, props.debtTokenID)} ${props.debtTicker}`}
                  </span>
                  <span>
                  {`(~${roundAmount(currentDebtInColl || 0, props.collateralTokenID)} ${props.collateralTicker})`}
                  </span>
                </span>
              </span>
              <span className="position-arrow">
                {` -> `}
              </span>
              <span className="color-pink position-after">
                <span className="column">
                  <span>
                    {`${roundAmount(nextDebt, props.debtTokenID)} ${props.debtTicker}`}
                  </span>
                  <span>
                    {`(~${roundAmount(nextTotalDebtInColl || 0, props.collateralTokenID)} ${props.collateralTicker})`}
                  </span>
                </span>
              </span>
            </span>
          </div>
          <div className="row-content">
            <div className="row-content-label">
              Total Collateral:&nbsp;
            </div>
            <span className={`row-content-value eth-balance flex-container`}>
            <span className="position-before">
                {`${roundAmount(props.currentCollateral, props.collateralTokenID)} ${props.collateralTicker}`}
              </span>
              { props.hasPosition &&
                <span className="position-arrow">
                {` -> `}
                </span>
              }
              { props.hasPosition &&
                <span className="color-emerald position-after">
                {`${roundAmount(nextTotalCollateral, props.collateralTokenID)} ${props.collateralTicker}`}
                </span>
              }
            </span>
          </div>
        </div>
      <div className="row" style={{ marginTop: "28px" }}>
        <div className="row-header" style={{ marginBottom: "0" }}>
          <div className="row-header-label">LEVERAGE STATS</div>
        </div>
        <div className="row-content">
          <div className="row-content-label">
            {`Leverage: `}
          </div>
          <span className={`row-content-value eth-balance`}>
            <span className="position-before">
              {`${props.currentLeverageRate.toFixed(1)}x`}
            </span>
            <span className="position-arrow">
              {` -> `}
            </span>
            <span className="position-after">
              {`${props.leverageRate.toFixed(1)}x`}
            </span>
          </span>
        </div>
        <div className="row-content">
          <div className="row-content-label">Debt Ratio</div>
          <div className="row-content-value">
            { props.hasPosition &&
              <div>
                <span style={{ color: setRiskColor(props.currentDebtRatio)}}>
                  {`${(props.currentDebtRatio * 100).toFixed(0)}%`}
                </span>
                <span>
                  {' -> '}
                </span>
                <span style={{ color: setRiskColor(props.debtRatio)}}>
                  {`${(props.debtRatio * 100).toFixed(0)}%`}
                </span>
                <span>
                  {` / ${(props.collateralRatio * 100).toFixed(0)}%`}
                </span>
              </div>
            }
            { !props.hasPosition &&
              <span>
                <span style={{ color: setRiskColor(props.debtRatio)}}>
                  {`${(props.debtRatio * 100).toFixed(0)}%`}
                </span>
                <span>
                  {` (Max: ${(props.collateralRatio * 100).toFixed(0)}%)`}
                </span>
              </span>
            }
          </div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Liquidation Price</div>
          <div className="row-content-value flex-container">
            { props.hasPosition &&
              <div>
                <span className="position-before" style={{ color: setRiskColor(props.currentDebtRatio)}}>
                  {`$${roundAmount(props.currentLiquidationPrice, props.debtTokenID)}`}
                </span>
                <span className="position-arrow">{" -> "}</span>
                <span className="position-after" style={{ color: setRiskColor(props.debtRatio)}}>
                  {`$${roundAmount(props.liquidationPrice, props.debtTokenID)}`}
                </span>
                <span>{` / $${roundAmount(props.conversionRate, props.debtTokenID)}`}</span>
              </div>
            }
            { !props.hasPosition &&
                <span style={{ color: setRiskColor(props.debtRatio)}}>
                {`$${roundAmount(props.liquidationPrice, props.debtTokenID)}`}
                </span>
            }
            </div>
        </div>
      </div>
    </>
  )
}