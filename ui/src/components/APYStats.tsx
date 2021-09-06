import React from 'react'

interface Props {
  borrowAPY: string
  supplyAPY: string
  netAPY: string
}

export function APYStats(props: Props) {
  return (
    <div className="row" style={{ marginTop: "32px" }}>
      <div className="row-header" style={{ marginBottom: "12px" }}>
        <div className="row-header-label">APY STATS</div>
      </div>
      <div className="row-content">
        <div className="row-content-label">Borrow APY</div>
        <div className="row-content-value">
          <div>{`${props.borrowAPY}%`}</div>
        </div>
      </div>
      <div className="row-content">
        <div className="row-content-label">Supply APY</div>
        <div className="row-content-value">
            <div>{`${props.supplyAPY}%`}</div>
        </div>
      </div>
      <div className="row-content">
        <div className="row-content-label">Net APY (supply - borrow)</div>
        <div className="row-content-value">
          <div>{`${props.netAPY}%`}</div>
        </div>
      </div>
    </div>
  )
}