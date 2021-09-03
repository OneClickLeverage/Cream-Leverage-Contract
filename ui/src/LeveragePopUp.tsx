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

  async function requestAccount() {
    console.log('request')
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()
    const address = await signer.getAddress();
    setMyAddress(address)
    const balanceBN = await signer.getBalance();
    setBalance(Number(ethers.utils.formatEther(balanceBN)))
  }

  async function executeSupply() {
    await supplyFromBrowser(window.ethereum, myAddress, inputAmount, leverageRate)
  }

  useEffect(() => {
    requestAccount();
  }, [])

  return (
    <div className="leverage-outer">
      <div className="leverage-inner">
        <div style={{ display: "flex" }}>
          <div className="borrow-tab borrow-tab--active">Borrow</div>
          <div className="borrow-tab borrow-tab--inactive">Repay</div>
        </div>
        <div className="leverage-body">
          <AmountInput
            balance={balance}
            inputAmount={inputAmount}
            setInputAmount={setInputAmount}
          />
          <div className="row" style={{marginTop: "42px"}}>
            <div className="row-header" style={{marginBottom: "12px"}}>
              <div className="row-header-label">BORROW STATS</div>
            </div>
            <div className="row-content">
              <div className="row-content-label">Borrow APY</div>
              <div className="row-content-value">3.29%</div>
            </div>
            <div className="row-content">
              <div className="row-content-label">Borrow Balance</div>
              <div className="row-content-value">
                <div>0 ETH</div>
              </div>
            </div>
          </div>
          <div className="row" style={{marginTop: "42px"}}>
            <div className="row-header" style={{marginBottom: "12px"}}>
              <div className="row-header-label">BORROW LIMIT</div>
            </div>
            <div className="row-content">
              <div className="row-content-label">Your Borrow Limit</div>
              <div className="row-content-value">$0.00</div>
            </div>
            <div className="row-content">
              <div className="row-content-label">Borrow Limit Used</div>
              <div className="row-content-value">
                <div>0% -&gt; 0%</div>
              </div>
            </div>
          </div>
          <SliderRow
            numberOfMarkers={5}
            maxLabelX={3}
            isPercentage={false}
            updateValue={setLeverageRate}
          />
          <div className="row-header-label">LEVERAGE STATS</div>
              <div className="row-content">
                <div className="row-content-label">Expected MIM amount</div>
                <div className="row-content-value">~ 0.0000</div>
              </div>
              <div className="row-content">
                <div className="row-content-label">Expected Apy</div>
                <div className="row-content-value">
                  <div>~ 6.2532%</div>
                </div>
              </div>
              <div className="row-content">
                <div className="row-content-label">Expected leverage</div>
                <div className="row-content-value">~ 0x</div>
              </div>
              <div className="row-content">
                <div className="row-content-label">Expected liquidation price</div>
                <div className="row-content-value">~ $xxx.xx</div>
              </div>
              <div className="row-content">
                <div className="row-content-label">Maximum Collateral Factor</div>
                <div className="row-content-value">75%</div>
              </div>
          <div className="sc-fWCJfs sc-jWUzTF kjawyH bflNhW" style={{marginTop: "100px", display: "flex"}}>
            <button className="sc-iAKVOt sc-efQUeY sc-cTApHj dEknAC eWLxTJ fVRyQa"
              onClick={executeSupply}
            >
              <div className="sc-jObXwK cBBNUN">1</div>
              Approve
            </button>
            <button disabled={true} className="sc-iAKVOt sc-efQUeY sc-cTApHj ITVgk eWLxTJ fVRyQa">
              <div className="sc-jObXwK cBBNUN">2</div>
              Supply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 