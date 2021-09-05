import React, { useEffect, useState } from 'react';
import { DeleveragePopUpBody } from './components/DeleveragePopUpBody';
import LeveragePopUpBody from './components/LeveragePopUpBody';
import "./LeveragePopUp.css";
import { TokenID } from './types/TokenID';
interface Props {
  collateralToken: TokenID,
  debtToken: TokenID,
}

enum TabIndex {
  Leverage = 0,
  Deleverage = 1
}

export function LeveragePopUp(props: Props) {
  const [tabIndex, setTabIndex] = useState<TabIndex>(TabIndex.Deleverage)
  const [conversionRate, setConversionRate] = useState<number>(0)

  function onTabClick(i: TabIndex) {
    setTabIndex(i)
  }

  useEffect(() => {
    const getPrice = async () => {
      try {
        const resp = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum')
        const body = await resp.json();
        return body[0].current_price as number
      } catch (e) {
        return 0
      }
    }
    getPrice().then(value => {
      setConversionRate(value)
    })
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
          />
        }
        { tabIndex === TabIndex.Deleverage &&
          <DeleveragePopUpBody
            collateralToken={props.collateralToken}
            debtToken={props.debtToken}
          />
        }
      </div>
    </div>
  )
}