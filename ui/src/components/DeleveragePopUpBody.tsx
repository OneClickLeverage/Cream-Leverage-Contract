import React, { useEffect, useState } from 'react';
import { deleverageFromBrowser } from '../../../insta_scripts/experiments/fromBrowser';
import { getTokenTickerFromTokenID, TokenID } from '../types/TokenID';
import { AmountInput } from './AmountInput';
import { SliderRow } from './SilderBar';

declare let window: any;
interface Props {
  collateralToken: TokenID,
  debtToken: TokenID,
  myAddress: string,
  balance: number,
  conversionRate: number,
  currentDebt: number,
  currentCollateral: number,
  collateralRatio: number,
  hasPosition: boolean,
}

export function DeleveragePopUpBody(props: Props) {
  const [isInitialRender, setIsInitialRender] = useState<boolean>(true)

  const [collateralToReduce, setCollateraToReduce] = useState<number>(0)
  const [debtToReduce, setDebtToReduce] = useState<number>(0)
  const [collErrorMsg, setCollErrorMsg] = useState<string>("")
  const [debtErrorMsg, setDebtErrorMsg] = useState<string>("")
  const [percentDebtToReduce, setPercentDebtToReduce] = useState<number>(0)

  async function executeDeleverage() {
    await deleverageFromBrowser(window.ethereum, props.myAddress, collateralToReduce, debtToReduce, 0.5, props.collateralToken, props.debtToken)
  }

  function onSetCollateralInput(amount: number) {
    const expectedDebtRatio = amount / ((props.currentCollateral-collateralToReduce) * props.conversionRate)

    if (amount > props.currentCollateral) {
      setCollErrorMsg(`Cannot reduce more than the current collateral amount, ${props.currentCollateral} ${getTokenTickerFromTokenID(props.collateralToken)}`)
    } else if (amount < 0) {
      setCollErrorMsg('Cannot reduce less than 0')
    } else if (expectedDebtRatio > props.collateralRatio) {
      setDebtErrorMsg(`The expected debt ratio ${(expectedDebtRatio*100).toFixed(0)} is greater than the collateral ratio ${(props.collateralRatio * 100).toFixed(0)}`)
    } else if (collErrorMsg !== '') {
      setCollErrorMsg('')
    }
    setCollateraToReduce(amount)
    let estimatedDebtToReduce = amount * props.conversionRate
    if (estimatedDebtToReduce > props.currentDebt) {
      estimatedDebtToReduce = props.currentDebt
    }
    setDebtToReduce(Number(estimatedDebtToReduce.toFixed(2)))
  }

  function onSetDebtAmountInput(amount: number) {
    const expectedDebtRatio = (props.currentDebt-amount) / ((props.currentCollateral-collateralToReduce) * props.conversionRate)

    console.log(expectedDebtRatio,(props.currentDebt-amount), ((props.currentCollateral-collateralToReduce) * props.conversionRate))
    if (amount > props.currentDebt) {
      setDebtErrorMsg(`Cannot reduce more than the current debt amount, ${props.currentDebt} ${getTokenTickerFromTokenID(props.debtToken)}`)
    } else if (amount < 0) {
      setDebtErrorMsg('Cannot reduce less than 0')
    } else if (expectedDebtRatio > props.collateralRatio) {
      setDebtErrorMsg(`The expected debt ratio ${(expectedDebtRatio*100).toFixed(0)}% is greater than the collateral ratio ${(props.collateralRatio * 100).toFixed(0)}%`)
    } else if (debtErrorMsg !== '') {
      setDebtErrorMsg('')
    }
    setDebtToReduce(amount)
    // const estimatedCollateralToReduce = amount / props.conversionRate
    // setCollateraToReduce(estimatedCollateralToReduce)
  }

  useEffect(() => {
    if (!isInitialRender) return


    if (isInitialRender) {
      setIsInitialRender(false)
    }
  })


  return (
    <div className="leverage-body">
      <AmountInput
        balance={props.balance}
        initialCollateral={collateralToReduce}
        debtAmount={debtToReduce}
        conversionRate={props.conversionRate}
        debtErrorMessage={debtErrorMsg}
        collErrorMessage={collErrorMsg}
        collateralTicker={getTokenTickerFromTokenID(props.collateralToken)}
        debtTicker={getTokenTickerFromTokenID(props.debtToken)}
        setCollateralAmount={onSetCollateralInput}
        setDebtAmount={onSetDebtAmountInput}
        isDeleverage={true}
        currentCollateral={props.currentCollateral}
        currentDebt={props.currentDebt}
        hasPosition={props.hasPosition}
      />
      <div className="leverage-label">Deleverage</div>
      <SliderRow
        numberOfMarkers={5}
        maxLabelX={100}
        isPercentage={true}
        leverageRate={percentDebtToReduce}
        updateLeverageRate={setPercentDebtToReduce}
        onDragEnd={(rate: number) => {
          setPercentDebtToReduce(rate)
          // updateDebtStats()
        }}
      />

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