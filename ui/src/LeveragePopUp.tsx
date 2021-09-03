import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { supplyFromBrowser } from '../../insta_scripts/experiments/fromBrowser';
import { AmountInput } from './components/AmountInput';
import { SliderRow } from './components/SilderBar';
import "./LeveragePopUp.css";

declare let window: any;

export default function LeveragePopUp() {
  const [myAddress, setMyAddress] = useState<string>("")
  const [balance, setBalance] = useState<number>(0)
  const [leverageRate, setLeverageRate] = useState<number>(0)
  const [inputAmount, setInputAmount] = useState<number>(0);
  const [priceImpact, setPriceImpact] = useState<number>(0.5);

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
    await supplyFromBrowser(window.ethereum, myAddress, inputAmount, leverageRate, priceImpact)
  }

  function onPriceImpactInput(e:any) {
    const input = e.target.value as number
    setPriceImpact(input)
  }

  useEffect(() => {
    requestAccount();
  }, [])

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
            inputAmount={inputAmount}
            setInputAmount={setInputAmount}
          />
            <div className="leverage-label">Leverage</div>
            <SliderRow
              numberOfMarkers={5}
              maxLabelX={5}
              isPercentage={false}
              updateValue={setLeverageRate}
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
              onClick={executeSupply}
              className="borrow-button"
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