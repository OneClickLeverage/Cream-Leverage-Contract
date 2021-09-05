import React from 'react';
import LeveragePopUpBody from './components/LeveragePopUpBody';
import "./LeveragePopUp.css";
import { TokenID } from './types/TokenID';
interface Props {
  collateralToken: TokenID,
  debtToken: TokenID,
}

export function LeveragePopUp(props: Props) {
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
        <LeveragePopUpBody
          collateralToken={props.collateralToken}
          debtToken={props.debtToken}
        />
      </div>
    </div>
  )
}