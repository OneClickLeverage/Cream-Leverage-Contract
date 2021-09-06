import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { getBalanceCheck, getPriceWithTokenID, hasDSAFromBrowser, hasPositionFromBrowser } from '../../insta_scripts/experiments/fromBrowser';
import { CreateWallet } from './components/CreateWallet';
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

interface LeverageTabsProps {
  tabIndex: number,
  onClick: (i: number) => void
}

function LeverageTabs(props: LeverageTabsProps) {
  return (
    <div style={{ display: "flex" }}>
      <div
        onClick={() => props.onClick(TabIndex.Leverage)}
        className={`borrow-tab ${props.tabIndex === TabIndex.Leverage ? 'borrow-tab--active borrow-tab--emerald': 'borrow-tab--inactive'}`}
      >
        Leverage
      </div>
      <div
        onClick={() => props.onClick(TabIndex.Deleverage)}
        className={`borrow-tab ${props.tabIndex === TabIndex.Deleverage ? 'borrow-tab--active borrow-tab--pink': 'borrow-tab--inactive'}`}
      >
        Deleverage
      </div>
    </div>
  )
}

export function LeveragePopUp(props: Props) {
  const [tabIndex, setTabIndex] = useState<TabIndex>(TabIndex.Leverage)
  const [conversionRate, setConversionRate] = useState<number>(0)
  const [isInitialRender, setIsInitialRender] = useState<boolean>(true)
  const [myAddress, setMyAddress] = useState<string>("")
  const [balance, setBalance] = useState<number>(0)
  const [defiBalance, setDefiBalance] = useState<Balance>(ZeroBalance)
  const [hasPosition, setHasPosition] = useState<boolean>(false)
  const [hasDSA, setHasDSA] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string>("")

  function onTabClick(i: TabIndex) {
    setTabIndex(i)
    requestAccount()
  }

  async function requestAccount() {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner()
      const address = await signer.getAddress();
      setMyAddress(address)
      const balanceBN = await signer.getBalance();
      setBalance(Number(ethers.utils.formatEther(balanceBN)))

      const userHasDSA = await hasDSAFromBrowser(window.ethereum, address)
      setHasDSA(userHasDSA)
      if (userHasDSA) {
        await checkBalances(address)
      }
    } catch (e: any) {
      setErrorMsg(e.data?.message?.toString() || e.message)
    }
    setIsLoading(false)
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

    try {
      requestAccount()
      getPrice().then(value => {
        setConversionRate(value)
      })
    } catch (e: any) {
      setErrorMsg(e.data.message.toString() || e.message)
    }

    if (isInitialRender) {
      setIsInitialRender(false)
    }
  }, [])

  return (
    <div className="leverage-outer">
      <div className="leverage-inner">
        { isLoading &&
          <h1
            style={{
              display: "flex",
              justifyContent: "center",
              paddingBottom: "32px",
            }}
          >
             Loading...
          </h1>
        }
        { errorMsg !== '' &&
            <h3
              style={{
                display: "flex",
                justifyContent: "center",
                paddingBottom: "32px",
                color: "rgb(255,0,0)"
              }}
            >
              {errorMsg}
            </h3>
          }
        { !isLoading && errorMsg === ''&& !hasDSA && (
          <CreateWallet
            userAddress={myAddress}
            onCreateWallet={() => {
              console.log('oncreatewallet')
              setHasDSA(true)
              checkBalances(myAddress)
            }}
          />
        )}
        { !isLoading && errorMsg === '' && hasDSA &&
          <LeverageTabs
            onClick={(i: number) => onTabClick(i)}
            tabIndex={tabIndex}
          />
        }
        { !isLoading && errorMsg === '' && hasDSA && tabIndex === TabIndex.Leverage &&
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
        { !isLoading && errorMsg === ''&& hasDSA && tabIndex === TabIndex.Deleverage &&
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