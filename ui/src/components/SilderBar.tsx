import React, { useState } from 'react';

interface Props {
  numberOfMarkers: number
  maxLabelX: number
  isPercentage: boolean
  onClick: (activeIndex: number) => void
}

export function SliderRow(props: Props) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const unit = 100 / (props.numberOfMarkers - 1);

  function getLabelUnit(i: number): number {
    const maxLabel = props.isPercentage ? props.maxLabelX : props.maxLabelX - 1;
    const percentageUnit = maxLabel / (props.numberOfMarkers - 1)
    return props.isPercentage ? percentageUnit*i: 1+percentageUnit*i
  }

  function onClick(i: any) {
    console.log('click', i)
    setActiveIndex(i)
    props.onClick(getLabelUnit(i))
  }

  return (
    <div className="row" style={{marginBottom: "12px"}}>
      <div className="rc-slider-outer"  style={{marginTop: "42px"}}>
      <div className="rc-slider rc-slider-with-marks">
        <div className="rc-slider-rail" style={{"backgroundColor": "rgb(21, 27, 40)"}}>
        </div>
        <div className="rc-slider-track" style={{"backgroundColor": "rgb(255, 184, 210)", left: "0%", right: "auto", width: "0%"}}></div>
        <div className="rc-slider-step">
          {
            [...Array(props.numberOfMarkers).keys()].map((v,  i: number) => {
              const isActive = activeIndex === i
              return (
                <span
                  key={`${unit*i}`}
                  className={`rc-slider-dot ${isActive ? 'rc-slider-dot-active .rc-slider-dot--instyle-active' : 'rc-slider-dot--instyle'}`}
                  onClick={() => onClick(i)}
                  style={{left: `${unit*i}%`}}
                ></span>
              )
            })
          }
        </div>
        <div
          tabIndex={0}
          className="rc-slider-handle rc-slider-handle--instyle"
          style={{left: `${unit*activeIndex}%`}}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100} aria-valuenow={0} aria-disabled="false"></div>
        <div className="rc-slider-mark">
          {
            [...Array(props.numberOfMarkers).keys()].map((v,  i: number) => {
              const isActive = activeIndex === i
              return (
                <span
                  key={`${unit*i}`}
                  className={`rc-slider-mark-text rc-slider-mark-text--instyle ${isActive ? 'rc-slider-dot-active' : ''}`}
                  style={{left: `${unit*i}%`}}
                >
                  {props.isPercentage ? `${getLabelUnit(i).toFixed(0)}%` : `${getLabelUnit(i).toFixed(1)}x`}
                </span>
              )
            })
          }
        </div>
      </div>
      </div>
      </div>
   )
}