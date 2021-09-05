import React, { useState } from 'react';
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

  function onTabClick(i: TabIndex) {
    setTabIndex(i)
  }

  return (
    <div className="leverage-outer">
      <div className="leverage-inner">
        <div style={{ display: "flex" }}>
          <div
            onClick={() => onTabClick(TabIndex.Leverage)}
            className={`borrow-tab ${tabIndex === TabIndex.Leverage ? 'borrow-tab--active': 'borrow-tab--inactive'}`}
          >
            Leverage
          </div>
          <div
            onClick={() => onTabClick(TabIndex.Deleverage)}
            className={`borrow-tab ${tabIndex === TabIndex.Deleverage ? 'borrow-tab--active': 'borrow-tab--inactive'}`}
          >
            Deleverage
          </div>
        </div>
        { tabIndex === TabIndex.Leverage &&
          <LeveragePopUpBody
            collateralToken={props.collateralToken}
            debtToken={props.debtToken}
          />
        }
        { tabIndex === TabIndex.Deleverage &&
          <DeleveragePopUpBody
          />
        }
      </div>
    </div>
  )
}