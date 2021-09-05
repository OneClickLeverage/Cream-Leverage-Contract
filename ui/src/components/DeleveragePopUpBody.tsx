import React, { useEffect, useState } from 'react';
import { deleverageFromBrowser, getDebtRatioFromBrowser, getLiquidationPriceFromBrowser } from '../../../insta_scripts/experiments/fromBrowser';
import { getAssetAPYs, getNetAPY } from '../../../insta_scripts/experiments/getInfo';
import { getTokenTickerFromTokenID, TokenID } from '../types/TokenID';
import { roundAmount } from '../utils/number';
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

const MAX_LEVERAGE_RATE = 5

export function DeleveragePopUpBody(props: Props) {
  const initialCollateral = props.currentCollateral - (props.currentDebt / props.conversionRate)
  const currentLeverageRate = Number((props.currentCollateral / initialCollateral).toFixed(2))

  const [isInitialRender, setIsInitialRender] = useState<boolean>(true)
  const [collateralToReduce, setCollateraToReduce] = useState<number>(0)
  const [debtToReduce, setDebtToReduce] = useState<number>(0)
  const [collErrorMsg, setCollErrorMsg] = useState<string>("")
  const [debtErrorMsg, setDebtErrorMsg] = useState<string>("")
  const [leverageRate, setLeverageRate] = useState<number>(currentLeverageRate)

  // Liquidation Stats
  const [priceImpact, setPriceImpact] = useState<number>(0.5);
  const [borrowAPY, setBorrowAPY] = useState<string>("")
  const [supplyAPY, setSupplyAPY] = useState<string>("")
  const [netAPY, setNetAPY] = useState<string>("")
  const [liquidationPrice, setLiquidationPrice] = useState<number>(0)
  const [debtRatio, setDebtRatio] = useState<number>(0)

  async function executeDeleverage() {
    await deleverageFromBrowser(window.ethereum, props.myAddress, collateralToReduce, debtToReduce, priceImpact, props.collateralToken, props.debtToken)
  }

  function onPriceImpactInput(e:any) {
    const input = e.target.value as number
    setPriceImpact(input)
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
    updateDebtStats()
  }

  function onSetDebtAmountInput(amount: number) {
    const expectedDebtRatio = (props.currentDebt-amount) / ((props.currentCollateral-collateralToReduce) * props.conversionRate)

    if (amount > props.currentDebt) {
      setDebtErrorMsg(`Cannot reduce more than the current debt amount, ${props.currentDebt} ${getTokenTickerFromTokenID(props.debtToken)}`)
    } else if (amount > (collateralToReduce * props.conversionRate)) {
      setDebtErrorMsg(`Cannot reduce more than the collateral amount to reduce. Either increase the collateral to reduce or decrease the debt to payback.`)
    } else if (amount < 0) {
      setDebtErrorMsg('Cannot reduce less than 0')
    } else if (expectedDebtRatio > props.collateralRatio) {
      setDebtErrorMsg(`The expected debt ratio ${(expectedDebtRatio*100).toFixed(0)}% is greater than the collateral ratio ${(props.collateralRatio * 100).toFixed(0)}%`)
    } else if (debtErrorMsg !== '') {
      setDebtErrorMsg('')
    }
    setDebtToReduce(amount)
    updateDebtStats()
  }

  function onLeverageRateChange(rate: number) {
    if (debtErrorMsg !== '') {
      setDebtErrorMsg('')
    }
    setLeverageRate(rate)
    const debtAmount = calculateDebtFromRate(rate, initialCollateral)
    const totalCollateralInDebtUnit = props.currentCollateral/props.conversionRate
    const debtAmountToReduce = props.currentDebt - debtAmount - totalCollateralInDebtUnit
    setDebtToReduce(roundAmount(debtAmountToReduce, props.debtToken))
    setCollateraToReduce(roundAmount(debtAmountToReduce/props.conversionRate, props.collateralToken))
  }

  function calculateDebtFromRate(rate: number, collateral: number): number {
    const total = rate * collateral
    const debtEquivalent = (total - initialCollateral) * props.conversionRate
    return debtEquivalent
  }

  function updateDebtStats() {
    getDebtRatioFromBrowser(
      window.ethereum,
      props.myAddress,
      props.collateralToken,
      props.debtToken,
      -collateralToReduce,
      -debtToReduce, 2)
    .then((ratio: number) => {
      setDebtRatio(ratio)
    })

    getLiquidationPriceFromBrowser(
      window.ethereum,
      props.myAddress,
      props.collateralToken,
      props.debtToken,
      -collateralToReduce,
      -debtToReduce, 2)
    .then((price: number) => {
      setLiquidationPrice(price)
    })
  }

  useEffect(() => {
    if (!isInitialRender) return

    getAssetAPYs(props.collateralToken).then(([, sAPY]:number[]) => setSupplyAPY(sAPY.toFixed(2)))
    getAssetAPYs(props.debtToken).then(([bAPY]:number[]) => setBorrowAPY(bAPY.toFixed(2)))
    getNetAPY(props.collateralToken, props.debtToken).then((nAPY: number) => setNetAPY(nAPY.toFixed(2)))
    updateDebtStats()

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
        maxLabelX={MAX_LEVERAGE_RATE}
        isPercentage={false}
        leverageRate={leverageRate}
        updateLeverageRate={(onLeverageRateChange)}
        onDragEnd={(rate: number) => {
          setLeverageRate(rate)
          updateDebtStats()
        }}
      />

      <div className="slippage-label">Slippage Tolerance</div>
      <div className="priceimpact-input-outer">
        <input
          className="priceimpact-input"
          type="number" value="0.5"
          onInput={onPriceImpactInput}
        >
        </input>
        <span > % ( default: 0.5% )</span>
      </div>

      <div className="row" style={{ marginTop: "42px" }}>
        <div className="row-header" style={{ marginBottom: "12px" }}>
          <div className="row-header-label">LEVERAGE STATS (EXPECTED)</div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Debt Ratio</div>
          <div className="row-content-value">{`${(debtRatio * 100).toFixed(2)}% / ${(props.collateralRatio * 100).toFixed(0)}%`}</div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Liquidation Price</div>
          <div className="row-content-value">{`$${(liquidationPrice).toFixed(2)}`}</div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Borrow APY</div>
          <div className="row-content-value">
            <div>{`${borrowAPY}%`}</div>
          </div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Supply APY</div>
          <div className="row-content-value">
              <div>{`${supplyAPY}%`}</div>
          </div>
        </div>
        <div className="row-content">
          <div className="row-content-label">Net APY (supply - borrow)</div>
          <div className="row-content-value">
            <div>{`${netAPY}%`}</div>
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