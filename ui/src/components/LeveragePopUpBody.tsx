import React, { useEffect, useState } from 'react';
import { getDebtRatioFromBrowser, getLiquidationPriceFromBrowser, supplyFromBrowser } from '../../../insta_scripts/experiments/fromBrowser';
import { getAssetAPYs, getNetAPY } from '../../../insta_scripts/experiments/getInfo';
import { getTokenTickerFromTokenID, TokenID } from '../types/TokenID';
import { AmountInput } from './AmountInput';
import { SliderRow } from './SilderBar';

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
}

export default function LeveragePopUp(props: Props) {
  const [isInitialRender, setIsInitialRender] = useState<boolean>(true)
  const [leverageRate, setLeverageRate] = useState<number>(1)
  const [initialCollateral, setInitialCollateralAmount] = useState<number>(0);
  const [debtAmount, setDebtAmount] = useState<number>(0)
  const [priceImpact, setPriceImpact] = useState<number>(0.5);
  const [borrowAPY, setBorrowAPY] = useState<string>("")
  const [supplyAPY, setSupplyAPY] = useState<string>("")
  const [netAPY, setNetAPY] = useState<string>("")
  const [collErrorMsg, setCollErrorMsg] = useState<string>("")
  const [debtErrorMsg, setDebtErrorMsg] = useState<string>("")
  const [debtRatio, setDebtRatio] = useState<number>(0)
  const [liquidationPrice, setLiquidationPrice] = useState<number>(0)

  const isError = debtErrorMsg !== '' || collErrorMsg !== ''
  const hasInput = initialCollateral > 0 && debtAmount > 0
  const shouldNotExecute = isError || !hasInput;

  async function executeSupply() {
    await supplyFromBrowser(window.ethereum, props.myAddress, initialCollateral, debtAmount, priceImpact, props.collateralToken, props.debtToken)
  }

  function onPriceImpactInput(e:any) {
    const input = e.target.value as number
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

    setDebtAmount(roundAmount(amount))
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
    }
    setInitialCollateralAmount(amount)
    setLeverageRate(rate)
    updateDebtStats()
  }

  function onLeverageRateChange(rate: number) {
    if (debtErrorMsg !== '') {
      setDebtErrorMsg('')
    }
    const debtAmount = calculateDebtFromRate(rate, initialCollateral)
    setDebtAmount(roundAmount(debtAmount))
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
      setLiquidationPrice(price)
    })
  }

  function roundAmount(amount: number): number {
    let finalAmount = amount
    if (props.debtToken === TokenID.DAI || props.debtToken === TokenID.USDC) {
      finalAmount = Number(amount.toFixed(2))
    }

    return finalAmount
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
  }, [initialCollateral, debtAmount])

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
        currentCollateral={props.currentCollateral}
        currentDebt={props.currentDebt}
        hasPosition={props.hasPosition}
      />
      <div className="leverage-label">Leverage</div>
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
          Execute Leverage
        </button>
      </div>
    </div>
  )
} 