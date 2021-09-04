import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { supplyFromBrowser } from '../../insta_scripts/experiments/fromBrowser';
import { getAssetAPYs, getNetAPY } from '../../insta_scripts/experiments/getInfo';
import { AmountInput } from './components/AmountInput';
import { SliderRow } from './components/SilderBar';
import "./LeveragePopUp.css";

declare let window: any;

const MAX_LEVERAGE_RATE = 5

export enum TokenID {
  ETH = 0,
  WBTC = 1,
  USDC = 2,
  DAI = 3,
}

function getTokenTickerFromTokenID(id: TokenID) {
  switch (id) {
    case 0: {
      return 'ETH';
    }
    case 1: {
      return 'WBTC';
    }
    case 2: {
      return 'USDC';
    }
    case 3: {
      return 'DAI';
    }
    default: {
      return ''
    }
  }
}
interface Props {
  collateralToken: TokenID,
  debtToken: TokenID,
}

export default function LeveragePopUp(props: Props) {
  const [myAddress, setMyAddress] = useState<string>("")
  const [balance, setBalance] = useState<number>(0)
  const [conversionRate, setConversionRate] = useState<number>(0)
  const [leverageRate, setLeverageRate] = useState<number>(1)
  const [initialCollateral, setInitialCollateralAmount] = useState<number>(0);
  const [debtAmount, setDebtAmount] = useState<number>(0)
  const [priceImpact, setPriceImpact] = useState<number>(0.5);
  const [borrowAPY, setBorrowAPY] = useState<string>("")
  const [supplyAPY, setSupplyAPY] = useState<string>("")
  const [netAPY, setNetAPY] = useState<string>("")
  const [collErrorMsg, setCollErrorMsg] = useState<string>("")
  const [debtErrorMsg, setDebtErrorMsg] = useState<string>("")

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()
    const address = await signer.getAddress();
    setMyAddress(address)
    const balanceBN = await signer.getBalance();
    setBalance(Number(ethers.utils.formatEther(balanceBN)))
  }

  async function executeSupply() {
    await supplyFromBrowser(window.ethereum, myAddress, initialCollateral, debtAmount, priceImpact, props.collateralToken, props.debtToken)
  }

  function onPriceImpactInput(e:any) {
    const input = e.target.value as number
    setPriceImpact(input)
  }

  function calculateLeverageRate(collateral: number, debt: number): number {
    const equivalentDebtAmount = debt / conversionRate
    const total = collateral + equivalentDebtAmount
    const rate = total / collateral
    return rate
  }

  function calculateDebtFromRate(rate: number, collateral: number): number {
    const total = rate * collateral
    const debtEquivalent = (total - initialCollateral) * conversionRate
    return debtEquivalent
  }

  function onSetDebtAmount(amount: number) {
    let rate = calculateLeverageRate(initialCollateral, amount)

    if (rate > MAX_LEVERAGE_RATE) {
      setDebtErrorMsg(`The current leverage ${rate.toFixed(2)}x is over the maximum ${MAX_LEVERAGE_RATE}x`)
      rate = MAX_LEVERAGE_RATE
    } else {
      setDebtErrorMsg('')
    }

    setDebtAmount(roundAmount(amount))
    setLeverageRate(rate)
  }

  function onSetCollateral(amount: number) {
    if (amount > balance) {
      setCollErrorMsg('Insufficient Balance')
    } else {
      setCollErrorMsg('')
    }

    let rate = calculateLeverageRate(amount, debtAmount)

    if (rate > MAX_LEVERAGE_RATE) {
      setCollErrorMsg(`The current leverage ${rate.toFixed(2)}x is over the maximum ${MAX_LEVERAGE_RATE}x`)
    }
    setInitialCollateralAmount(amount)
    setLeverageRate(rate)
  }

  function onLeverageRateChange(rate: number) {
    setDebtErrorMsg('')
    const debtAmount = calculateDebtFromRate(rate, initialCollateral)
    setDebtAmount(roundAmount(debtAmount))
    setLeverageRate(rate)
  }

  function roundAmount(amount: number): number {
    let finalAmount = amount
    if (props.debtToken === TokenID.DAI || props.debtToken === TokenID.USDC) {
      finalAmount = Number(amount.toFixed(2))
    }

    return finalAmount
  }

  useEffect(() => {
    requestAccount();
    getAssetAPYs(props.collateralToken).then(([, sAPY]:number[]) => setSupplyAPY(sAPY.toFixed(2)))
    getAssetAPYs(props.debtToken).then(([bAPY]:number[]) => setBorrowAPY(bAPY.toFixed(2)))
    getNetAPY(props.collateralToken, props.debtToken).then((nAPY: number) => setNetAPY(nAPY.toFixed(2)))
    
  }, [])

  const isError = debtErrorMsg !== '' || collErrorMsg !== ''
  const hasInput = initialCollateral > 0 && debtAmount > 0

  return (
    <div className="leverage-outer">
      <div className="leverage-inner">
        <div style={{ display: "flex" }}>
          <div className="borrow-tab borrow-tab--active">Leverage</div>
          <div className="borrow-tab borrow-tab--inactive">Deleverage</div>
        </div>
        <div className="leverage-body">
          <AmountInput
            balance={balance}
            initialCollateral={initialCollateral}
            debtAmount={debtAmount}
            conversionRate={conversionRate}
            debtErrorMessage={debtErrorMsg}
            collErrorMessage={collErrorMsg}
            collateralTicker={getTokenTickerFromTokenID(props.collateralToken)}
            debtTicker={getTokenTickerFromTokenID(props.debtToken)}
            setCollateralAmount={onSetCollateral}
            setDebtAmount={onSetDebtAmount}
            setConversionRate={setConversionRate}
          />
            <div className="leverage-label">Leverage</div>
            <SliderRow
              numberOfMarkers={5}
              maxLabelX={MAX_LEVERAGE_RATE}
              isPercentage={false}
              leverageRate={leverageRate}
              updateLeverageRate={onLeverageRateChange}
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
              <div className="row-content-value">%</div>
            </div>
            <div className="row-content">
              <div className="row-content-label">Liquidation Price</div>
              <div className="row-content-value">$</div>
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
              disabled={isError || !hasInput}
              style={{ width: "100%", marginTop: "6px", marginLeft: "0px" }}
            >
              Execute Leverage
            </button>
          </div>
        </div>
      </div>
      </div>
  )
} 