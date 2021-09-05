import React from 'react';
import LeveragePopUp from './LeveragePopUp';
import { TokenID } from './types/TokenID';

declare let window: any;

const MAX_LEVERAGE_RATE = 5

interface Props {
  collateralToken: TokenID,
  debtToken: TokenID,
}

export function LeveragePopupContainer(props: Props) {
  return (
    <div className="leverage-outer">
      <div className="leverage-inner">
        <div style={{ display: "flex" }}>
          <div className="borrow-tab borrow-tab--active">
            Leverage
          </div>
          <div className="borrow-tab borrow-tab--inactive">
            Deleverage
          </div>
        </div>
        <LeveragePopUp
          collateralToken={props.collateralToken}
          debtToken={props.debtToken}
        />
      </div>
    </div>
  )
}