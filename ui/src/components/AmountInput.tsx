import React, { useEffect, useState } from 'react';

interface Props {
  balance: number
  inputAmount: number
  setInputAmount: (amount: number) => void
}

export function AmountInput(props: Props) {
  const [currentPrice, setCurrentPrice] = useState<number>(0);

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
    const price = getPrice()
    price.then(value => {
      setCurrentPrice(value)
    })
  }, [])

  function onInput(e:any) {
    const input = e.target.value as number
    props.setInputAmount(input)
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
            {props.balance.toFixed(4)} ETH
          </span>
        </div>
      </div>
      <div className="price-input-outer">
        <div className="price-input-inner">
          <div className="price-input-inner-inner">
            <div className="price-input-wrapper">
              <input
                className="price-input"
                type="number"
                onInput={onInput}
              >
              </input>
              <span>ETH</span>
            </div>
            <div>{`$${(props.inputAmount * currentPrice).toFixed(2)}`}</div>
          </div>
        </div>
      </div>
      <div className="row-header">
        <div className="row-header-label">
          BORROW AMOUNT
        </div>
      </div>

      <div className="price-input-outer">
        <div className="price-input-inner">
          <div className="price-input-inner-inner">
            <div className="price-input-wrapper">
              <input
                className="price-input"
                type="number">
              </input>
              <span>DAI</span>
            </div>
            <div> ETH</div>
          </div>
        </div>
      </div>
  </div>
  )
}