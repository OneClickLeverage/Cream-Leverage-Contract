import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { LeveragePopUp } from './LeveragePopUp';
import reportWebVitals from './reportWebVitals';
import { TokenID } from './types/TokenID';

ReactDOM.render(
  <React.StrictMode>
    <LeveragePopUp
      collateralToken={TokenID.ETH}
      debtToken={TokenID.DAI}
    />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
