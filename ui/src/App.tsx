import React from 'react';
import './App.css';
import { LeveragePopUp } from './LeveragePopUp';
import { TokenID } from './types/TokenID';

export function App() {
  return (
    <div className="modal-container">
      <div className="modal-body">
        <LeveragePopUp
          collateralToken={TokenID.ETH}
          debtToken={TokenID.DAI}
        />
      </div>
    </div>
  )
}