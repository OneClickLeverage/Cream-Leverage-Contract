import React from 'react';
import { TokenID } from '../types/TokenID';
import { roundAmount } from '../utils/number';
interface NumberInputProps {
  onInput: (amount: number) => void
  value: number
  otherPairValue: number
  ticker: string
  otherPairTicker: string
  errorMessage: string
  tokenID: TokenID
  otherPairTokenID: TokenID
  isMaxShown: boolean
  maxValue: number
}

function NumberInput(props: NumberInputProps) {
  const isError = props.errorMessage !== ''

  function onInput(e: React.FormEvent<HTMLInputElement>) {
    const amount = Number(e.currentTarget.value)
    props.onInput(amount)
  }
  
  return (
    <div className={`price-input-outer ${isError ? 'price-input-outer--error' : ''}`}>
      <div className="price-input-inner">
        <div className="price-input-inner-inner">
          <div className="price-input-wrapper">
            <input
              className={`price-input ${isError ? 'price-input--error' : ''}`}
              type="number"
              onInput={onInput}
              value={props.value}
            >
            </input>
            <span>{props.ticker}</span>
          </div>
          <div>
            {`${props.otherPairTicker === '$' ? '$' : ''}${roundAmount(props.otherPairValue, props.otherPairTokenID)}${props.otherPairTicker === '$' ? '' : ' ' + props.otherPairTicker}`}
          </div>
        </div>
        { props.isMaxShown &&
          <button
            className="supply-max-button"
            onClick={() => props.onInput(props.maxValue)}
          >
            MAX
          </button>
        }
      </div>
      { isError &&
        <div
          style={{display: "initial"}}
          className="price-input-error-message"
        >
          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="exclamation-triangle" className="svg-inline--fa fa-exclamation-triangle fa-w-18 " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" color="black"><path fill="currentColor" d="M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"></path></svg>
          {` ${props.errorMessage}`}
        </div>
      }
    </div>
  )
}

interface Props {
  balance: number
  initialCollateral: number
  debtAmount: number
  conversionRate: number
  collateralTicker: string
  debtTicker: string
  collErrorMessage: string
  debtErrorMessage: string
  isDeleverage: boolean
  collateralTokenID: TokenID
  debtTokenID: TokenID
  maxCollateral: number
  setCollateralAmount: (amount: number) => void
  setDebtAmount: (amount: number) => void
}

export function AmountInput(props: Props) {
  function onDepositAmountInput(amount: number) {
    props.setCollateralAmount(amount)
  }

  function onDebtAmountInput(amount: number) {
    props.setDebtAmount(amount)
  }

  return (
    <div className="row">
      <div className="row-header">
        <div className="row-header-label">
          {props.isDeleverage ? 'WITHDRAW (COLLATERAL)' : 'SUPPLY (COLLATERAL)'}
        </div>
        <div className="balance-amount text-align-right">
            Balance:&nbsp;
            <span className={`eth-balance ${props.isDeleverage ? "color-pink" : "color-emerald"}`}>
              {`${props.balance.toFixed(4)} ${props.collateralTicker}`}
            </span>
          </div>
      </div>
      <NumberInput
        value={props.initialCollateral}
        otherPairValue={Number((props.initialCollateral * props.conversionRate).toFixed(2))}
        ticker={props.collateralTicker}
        onInput={onDepositAmountInput}
        otherPairTicker={props.debtTicker}
        errorMessage={props.collErrorMessage}
        tokenID={props.collateralTokenID}
        otherPairTokenID={props.debtTokenID}
        isMaxShown={true}
        maxValue={props.maxCollateral}
      />
      <div className="row-header">
        <div className="row-header-label">
        {props.isDeleverage ? 'PAYBACK (DEBT)' : 'BORROW (DEBT)'}
        </div>
      </div>
      <NumberInput
        value={props.debtAmount}
        otherPairValue={Number((props.debtAmount / props.conversionRate).toFixed(6))}
        ticker={props.debtTicker}
        otherPairTicker={props.collateralTicker}
        onInput={onDebtAmountInput}
        errorMessage={props.debtErrorMessage}
        tokenID={props.debtTokenID}
        otherPairTokenID={props.collateralTokenID}
        isMaxShown={false}
        maxValue={0}
      />
  </div>
  )
}