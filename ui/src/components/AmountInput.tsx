import React, { useEffect } from 'react';

interface NumberInputProps {
  onInput: (e: any) => void
  value: number
  otherPairValue: number
  ticker: string
  otherPairTicker: string
}

function NumberInput(props: NumberInputProps) {
  
  return (
    <div className="price-input-outer">
      <div className="price-input-inner">
        <div className="price-input-inner-inner">
          <div className="price-input-wrapper">
            <input
              className="price-input"
              type="number"
              onInput={props.onInput}
              value={props.value === 0 ? '' : props.value}
            >
            </input>
            <span>{props.ticker}</span>
          </div>
          <div>{`${props.otherPairTicker === '$' ? '$' : ''}${props.otherPairValue}${props.otherPairTicker === '$' ? '' : ' ' + props.otherPairTicker}`}</div>
        </div>
      </div>
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
  setCollateralAmount: (amount: number) => void
  setDebtAmount: (amount: number) => void
  setConversionRate: (amount: number) => void
}

export function AmountInput(props: Props) {
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
      props.setConversionRate(value)
    })
  }, [])

  function onDepositAmountInput(e:any) {
    const input = e.target.value as number
    props.setCollateralAmount(Number(input))
  }

  function onDebtAmountInput(e:any) {
    const input = e.target.value as number
    props.setDebtAmount(Number(input))
  }

  return (
    <div className="row">
      <div className="row-header">
        <div className="row-header-label">
          DEPOSIT AMOUNT
        </div>
        <div className="balance-amount">
          Balance:&nbsp;
          <span className="eth-balance-color">
            {`${props.balance.toFixed(4)} ${props.collateralTicker}`}
          </span>
        </div>
      </div>
      <NumberInput
        value={props.initialCollateral}
        otherPairValue={Number((props.initialCollateral * props.conversionRate).toFixed(2))}
        ticker={props.collateralTicker}
        onInput={onDepositAmountInput}
        otherPairTicker={'$'}
      />
      <div className="row-header">
        <div className="row-header-label">
          DEBT AMOUNT
        </div>
      </div>
      <NumberInput
        value={props.debtAmount}
        otherPairValue={Number((props.debtAmount / props.conversionRate).toFixed(6))}
        ticker={props.debtTicker}
        otherPairTicker={props.collateralTicker}
        onInput={onDebtAmountInput}
      />
  </div>
  )
}