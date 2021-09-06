import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { getBalanceCheck, getPriceWithTokenID, hasDSAFromBrowser, hasPositionFromBrowser } from '../../insta_scripts/experiments/fromBrowser';
import { DeleveragePopUpBody } from './components/DeleveragePopUpBody';
import LeveragePopUpBody from './components/LeveragePopUpBody';
import "./LeveragePopUp.css";
import { Balance, ZeroBalance } from './types/CheckBalanceAPI';
import { TokenID } from './types/TokenID';

declare let window: any;
interface Props {
  collateralToken: TokenID,
  debtToken: TokenID,
}

enum TabIndex {
  Leverage = 0,
  Deleverage = 1
}

export function LeveragePopUp(props: Props) {
  const [tabIndex, setTabIndex] = useState<TabIndex>(TabIndex.Leverage)
  const [conversionRate, setConversionRate] = useState<number>(0)
  const [isInitialRender, setIsInitialRender] = useState<boolean>(true)
  const [myAddress, setMyAddress] = useState<string>("")
  const [balance, setBalance] = useState<number>(0)
  const [defiBalance, setDefiBalance] = useState<Balance>(ZeroBalance)
  const [hasPosition, setHasPosition] = useState<boolean>(false)

  function onTabClick(i: TabIndex) {
    setTabIndex(i)
    requestAccount()
  }

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()
    const address = await signer.getAddress();
    setMyAddress(address)
    const balanceBN = await signer.getBalance();
    setBalance(Number(ethers.utils.formatEther(balanceBN)))

    const hasDSA = await hasDSAFromBrowser(window.ethereum, address)
    if (hasDSA) {
      checkBalances(address)
    }
  }

  async function checkBalances(address: string) {
    const balanceInfo = await getBalanceCheck(window.ethereum, address, props.collateralToken, props.debtToken)
    setDefiBalance(balanceInfo)
    const isAvailable = await hasPositionFromBrowser(window.ethereum, address, props.collateralToken, props.debtToken)
    setHasPosition(isAvailable)
  }

  async function getPrice() {
    try {
      const collPrice = await getPriceWithTokenID(props.collateralToken)
      const debtPrice = await getPriceWithTokenID(props.debtToken)
      const price = collPrice / debtPrice
      return price
    } catch (e) {
      return 0
    }
  }

  useEffect(() => {
    if (!isInitialRender) return

    requestAccount()
    getPrice().then(value => {
      setConversionRate(value)
    })

    if (isInitialRender) {
      setIsInitialRender(false)
    }
  }, [])

  return (
    <div className="leverage-outer">
      <div className="leverage-inner">
        <div style={{ display: "flex" }}>
          <div
            onClick={() => onTabClick(TabIndex.Leverage)}
            className={`borrow-tab ${tabIndex === TabIndex.Leverage ? 'borrow-tab--active borrow-tab--emerald': 'borrow-tab--inactive'}`}
          >
            Leverage
          </div>
          <div
            onClick={() => onTabClick(TabIndex.Deleverage)}
            className={`borrow-tab ${tabIndex === TabIndex.Deleverage ? 'borrow-tab--active borrow-tab--pink': 'borrow-tab--inactive'}`}
          >
            Deleverage
          </div>
        </div>
        { tabIndex === TabIndex.Leverage &&
          <LeveragePopUpBody
            collateralToken={props.collateralToken}
            debtToken={props.debtToken}
            conversionRate={conversionRate}
            myAddress={myAddress}
            balance={balance}
            currentDebt={defiBalance.totalDebtAmount}
            currentCollateral={defiBalance.totalCollateralAmount}
            collateralRatio={defiBalance.collateralRatio}
            hasPosition={hasPosition}
            updateBalances={() => checkBalances(myAddress)}
          />
        }
        { tabIndex === TabIndex.Deleverage &&
          <DeleveragePopUpBody
            collateralToken={props.collateralToken}
            debtToken={props.debtToken}
            conversionRate={conversionRate}
            myAddress={myAddress}
            balance={balance}
            currentDebt={defiBalance.totalDebtAmount}
            currentCollateral={defiBalance.totalCollateralAmount}
            collateralRatio={defiBalance.collateralRatio}
            hasPosition={hasPosition}
            updateBalances={() => checkBalances(myAddress)}
          />
        }
      </div>
    </div>
  )
}