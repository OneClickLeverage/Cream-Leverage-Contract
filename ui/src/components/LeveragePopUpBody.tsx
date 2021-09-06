import React, { useEffect, useState } from 'react';
import { getDebtRatioFromBrowser, getLiquidationPriceFromBrowser, supplyFromBrowser } from '../../../insta_scripts/experiments/fromBrowser';
import { getAssetAPYs, getNetAPY } from '../../../insta_scripts/experiments/getInfo';
import { getTokenTickerFromTokenID, TokenID } from '../types/TokenID';
import { Color } from '../utils/color';
import { roundAmount } from '../utils/number';
import { AmountInput } from './AmountInput';
import { APYStats } from './APYStats';
import { LeverageStats } from './LeverageStats';
import { SliderBar } from './SliderBar';

declare let window: any;

const MAX_LEVERAGE_RATE = 5
interface Props {
  collateralToken: TokenID,
  debtToken: TokenID,
  conversionRate: number,
  myAddress: string,
  balance: number,
  currentCollateral: number,
  currentDebt: number,
  collateralRatio: number,
  hasPosition: boolean,
  updateBalances: () => void
}

export default function LeveragePopUp(props: Props) {
  const initialCapital = props.currentCollateral - (props.currentDebt / props.conversionRate)
  const currentLeverageRate = Number((props.currentCollateral / initialCapital).toFixed(2))

  const [isInitialRender, setIsInitialRender] = useState<boolean>(true)
  const [leverageRate, setLeverageRate] = useState<number>(currentLeverageRate)
  const [initialCollateral, setInitialCollateralAmount] = useState<number>(props.currentCollateral);
  const [debtAmount, setDebtAmount] = useState<number>(props.currentDebt)
  const [priceImpact, setPriceImpact] = useState<number>(0.5);
  const [borrowAPY, setBorrowAPY] = useState<string>("")
  const [supplyAPY, setSupplyAPY] = useState<string>("")
  const [netAPY, setNetAPY] = useState<string>("")
  const [collErrorMsg, setCollErrorMsg] = useState<string>("")
  const [debtErrorMsg, setDebtErrorMsg] = useState<string>("")
  const [debtRatio, setDebtRatio] = useState<number>(0)
  const [liquidationPrice, setLiquidationPrice] = useState<number>(0)
  const [currentDebtRatio, setCurrentDebtRatio] = useState<number>(0)
  const [currentLiquidationPrice, setCurrentLiquidationPrice] = useState<number>(0)
  const [isExecuting, setIsExecuting] = useState<boolean>(false)

  const isError = debtErrorMsg !== '' || collErrorMsg !== ''
  const hasInput = initialCollateral > 0 && debtAmount > 0
  const shouldNotExecute = isError || !hasInput || isExecuting;

  async function executeSupply() {
    setIsExecuting(true)
    await supplyFromBrowser(window.ethereum, props.myAddress, initialCollateral, debtAmount, priceImpact, props.collateralToken, props.debtToken)
    setIsExecuting(false)
    props.updateBalances()
  }

  function onPriceImpactInput(e:any) {
    const input = parseFloat(e.target.value)
    if (isNaN(input)) {
      return
    }
    setPriceImpact(input)
  }

  function calculateLeverageRate(collateral: number, debt: number): number {
    const equivalentDebtAmount = debt / props.conversionRate
    const total = collateral + equivalentDebtAmount
    const rate = total / collateral
    return rate
  }

  function calculateDebtFromRate(rate: number, collateral: number): number {
    const total = rate * collateral
    const debtEquivalent = (total - initialCollateral) * props.conversionRate
    return debtEquivalent
  }

  function onSetDebtAmount(amount: number) {
    let rate = calculateLeverageRate(initialCollateral, amount)

    if (rate > MAX_LEVERAGE_RATE) {
      setDebtErrorMsg(`The current leverage ${rate.toFixed(2)}x is over the maximum ${MAX_LEVERAGE_RATE}x`)
      rate = MAX_LEVERAGE_RATE
    } else if (debtErrorMsg !== '') {
      setDebtErrorMsg('')
    }

    setDebtAmount(roundAmount(amount, props.debtToken))
    setLeverageRate(rate)
    updateDebtStats()
  }

  function onSetCollateral(amount: number) {
    if (amount > props.balance) {
      setCollErrorMsg('Insufficient Balance')
    } else if (collErrorMsg !== ''){
      setCollErrorMsg('')
    }

    let rate = calculateLeverageRate(amount, debtAmount)

    if (rate > MAX_LEVERAGE_RATE) {
      setCollErrorMsg(`The current leverage ${rate.toFixed(2)}x is over the maximum ${MAX_LEVERAGE_RATE}x`)
      rate = MAX_LEVERAGE_RATE
    }
    setInitialCollateralAmount(amount)
    setLeverageRate(rate)
    updateDebtStats()
  }

  function onLeverageRateChange(rate: number) {
    if (debtErrorMsg !== '') {
      setDebtErrorMsg('')
    }
    if (initialCollateral <= 0) {
      setCollErrorMsg('Set the collateral amount first')
    }
    const debtAmount = calculateDebtFromRate(rate, initialCollateral)
    setDebtAmount(roundAmount(debtAmount, props.debtToken))
    setLeverageRate(rate)
  }

  function updateDebtStats() {
    getDebtRatioFromBrowser(
      window.ethereum,
      props.myAddress,
      props.collateralToken,
      props.debtToken,
      initialCollateral,
      debtAmount, 2)
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
      initialCollateral,
      debtAmount, 2)
    .then((price: number) => {
      if (isInitialRender) {
        setCurrentLiquidationPrice(price)
      }
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
  }, [isInitialRender])

  return (
    <div className="leverage-body">
      <AmountInput
        balance={props.balance}
        initialCollateral={initialCollateral}
        debtAmount={debtAmount}
        conversionRate={props.conversionRate}
        debtErrorMessage={debtErrorMsg}
        collErrorMessage={collErrorMsg}
        collateralTicker={getTokenTickerFromTokenID(props.collateralToken)}
        debtTicker={getTokenTickerFromTokenID(props.debtToken)}
        setCollateralAmount={onSetCollateral}
        setDebtAmount={onSetDebtAmount}
        isDeleverage={false}
      />
      <div className="leverage-label">Leverage</div>
      <SliderBar
        numberOfMarkers={5}
        maxLabelX={MAX_LEVERAGE_RATE}
        isPercentage={false}
        leverageRate={leverageRate}
        updateLeverageRate={onLeverageRateChange}
        onDragEnd={(rate: number) => {
          setLeverageRate(rate)
          updateDebtStats()
        }}
        color={Color.Emerald}
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
        debtToAdd={debtAmount}
        currentCollateral={props.currentCollateral}
        collateralToAdd={initialCollateral}
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
          onClick={executeSupply}
          className="borrow-button"
          disabled={shouldNotExecute}
          style={{
            width: "100%",
            marginTop: "6px",
            marginLeft: "0px",
            cursor: shouldNotExecute ? 'not-allowed' : 'pointer',
            opacity: shouldNotExecute ? 0.2 : 1,
          }}
        >
          Leverage
        </button>
      </div>
    </div>
  )
} 