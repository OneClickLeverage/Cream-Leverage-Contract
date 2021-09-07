import React, { useEffect, useState } from 'react';
import { AdjustCreamAction, adjustCreamFromBrowser, deleverageFromBrowser, getDebtRatioFromBrowser, getLiquidationPriceFromBrowser } from '../../../insta_scripts/experiments/fromBrowser';
import { getAssetAPYs, getNetAPY } from '../../../insta_scripts/experiments/getInfo';
import { getTokenTickerFromTokenID, TokenID } from '../types/TokenID';
import { Color, CSS_RGB_PINK } from '../utils/color';
import { roundAmount } from '../utils/number';
import { AmountInput } from './AmountInput';
import { APYStats } from './APYStats';
import { LeverageStats } from './LeverageStats';
import { SliderBar } from './SliderBar';

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
  updateBalances: () => void,
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
  const [isExecuting, setIsExecuting] = useState<boolean>(false)

  const [currentDebtRatio, setCurrentDebtRatio] = useState<number>(0)
  const [currentLiquidationPrice, setCurrentLiquidationPrice] = useState<number>(0)

  const isError = debtErrorMsg !== '' || collErrorMsg !== ''
  const hasInput = collateralToReduce > 0 || debtToReduce > 0
  const shouldNotExecute = isError || !hasInput || isExecuting;

  async function executeDeleverage() {
    setIsExecuting(true)
    if (collateralToReduce !== 0 && debtToReduce === 0) {
      await adjustCreamFromBrowser(window.ethereum, props.myAddress, props.collateralToken, props.debtToken, collateralToReduce, AdjustCreamAction.Withdraw)
    } else {
      await deleverageFromBrowser(window.ethereum, props.myAddress, collateralToReduce, debtToReduce, priceImpact, props.collateralToken, props.debtToken)
    }
    await props.updateBalances()
    setIsExecuting(false)
  }

  function onPriceImpactInput(e: any) {
    const input = parseFloat(e.target.value)
    if (isNaN(input)) {
      return
    }
    setPriceImpact(input)
  }

  function onSetCollateralInput(amount: number) {
    const expectedDebtRatio = amount / ((props.currentCollateral - collateralToReduce) * props.conversionRate)

    if (amount > props.currentCollateral) {
      setCollErrorMsg(`Cannot reduce more than the current collateral amount, ${props.currentCollateral} ${getTokenTickerFromTokenID(props.collateralToken)}`)
    } else if (amount < 0) {
      setCollErrorMsg('Cannot reduce less than 0')
    } else if (expectedDebtRatio > props.collateralRatio) {
      setDebtErrorMsg(`The expected debt ratio ${(expectedDebtRatio * 100).toFixed(0)} is greater than the collateral ratio ${(props.collateralRatio * 100).toFixed(0)}`)
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
    const expectedDebtRatio = (props.currentDebt - amount) / ((props.currentCollateral - collateralToReduce) * props.conversionRate)

    if (amount > props.currentDebt) {
      setDebtErrorMsg(`Cannot reduce more than the current debt amount, ${props.currentDebt} ${getTokenTickerFromTokenID(props.debtToken)}`)
    } else if (amount > (collateralToReduce * props.conversionRate) && collateralToReduce !== 0) {
      setDebtErrorMsg(`Cannot reduce more than the collateral amount to reduce. Either increase the collateral to reduce or decrease the debt to payback.`)
    } else if (amount < 0) {
      setDebtErrorMsg('Cannot reduce less than 0')
    } else if (expectedDebtRatio > props.collateralRatio) {
      setDebtErrorMsg(`The expected debt ratio ${(expectedDebtRatio * 100).toFixed(0)}% is greater than the collateral ratio ${(props.collateralRatio * 100).toFixed(0)}%`)
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
    if (rate > currentLeverageRate) {
      setDebtErrorMsg('Cannot add more leverage')
      return
    }
    setLeverageRate(rate)
    const debtAmount = calculateDebtFromRate(rate, initialCollateral)
    const totalCollateralInDebtUnit = props.currentCollateral / props.conversionRate
    const debtAmountToReduce = props.currentDebt - debtAmount - totalCollateralInDebtUnit
    setDebtToReduce(roundAmount(debtAmountToReduce, props.debtToken))
    const boundRoom = 1.05
    setCollateraToReduce(roundAmount(debtAmountToReduce / props.conversionRate * boundRoom, props.collateralToken))
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
      -debtToReduce, 3)
      .then((ratio: number) => {
        if (isInitialRender) {
          setCurrentDebtRatio(ratio)
        }
        setDebtRatio(ratio)
      })

    getLiquidationPriceFromBrowser(
      window.ethereum,
      props.myAddress,
      props.collateralToken,
      props.debtToken,
      -collateralToReduce,
      -debtToReduce, 3)
      .then((price: number) => {
        if (isInitialRender) {
          setCurrentLiquidationPrice(price)
        }
        setLiquidationPrice(price)
      })
  }

  useEffect(() => {
    if (!isInitialRender) return

    getAssetAPYs(props.collateralToken).then(([, sAPY]: number[]) => setSupplyAPY(sAPY.toFixed(2)))
    getAssetAPYs(props.debtToken).then(([bAPY]: number[]) => setBorrowAPY(bAPY.toFixed(2)))
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
      />
      <div className="leverage-label">Deleverage</div>
      <SliderBar
        numberOfMarkers={5}
        maxLabelX={MAX_LEVERAGE_RATE}
        isPercentage={false}
        leverageRate={leverageRate}
        updateLeverageRate={(onLeverageRateChange)}
        onDragEnd={(rate: number) => {
          if (rate > currentLeverageRate) {
            return
          }
          setLeverageRate(rate)
          updateDebtStats()
        }}
        color={Color.Pink}
      />

      <div className="slippage-label">Slippage Tolerance</div>
      <div className="priceimpact-input-outer">
        <input
          className="priceimpact-input"
          type="number" value={priceImpact}
          onInput={onPriceImpactInput}
        >
        </input>
        <span > % ( default: 0.5% )</span>
      </div>
      <LeverageStats
        hasPosition={props.hasPosition}
        currentDebtRatio={currentDebtRatio}
        debtRatio={debtRatio}
        collateralRatio={props.collateralRatio}
        currentLiquidationPrice={currentLiquidationPrice}
        conversionRate={props.conversionRate}
        liquidationPrice={liquidationPrice}
        currentDebt={props.currentDebt}
        debtToAdd={-debtToReduce}
        currentCollateral={props.currentCollateral}
        collateralToAdd={-collateralToReduce}
        collateralTicker={getTokenTickerFromTokenID(props.collateralToken)}
        debtTicker={getTokenTickerFromTokenID(props.debtToken)}
        leverageRate={leverageRate}
        currentLeverageRate={currentLeverageRate}
      />
      <APYStats
        borrowAPY={borrowAPY}
        supplyAPY={supplyAPY}
        netAPY={netAPY}
      />
      <div style={{ marginTop: "32px", display: "flex" }}>
        <button
          type="button"
          onClick={executeDeleverage}
          className="borrow-button"
          disabled={shouldNotExecute}
          style={{
            width: "100%",
            marginTop: "6px",
            marginLeft: "0px",
            cursor: shouldNotExecute ? 'not-allowed' : 'pointer',
            opacity: shouldNotExecute ? 0.2 : 1,
            backgroundColor: CSS_RGB_PINK
          }}
        >
          Deleverage
        </button>
      </div>
    </div>
  )
}