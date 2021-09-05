import React, { MouseEvent, useEffect, useRef, useState } from 'react';

interface Props {
  numberOfMarkers: number
  maxLabelX: number
  isPercentage: boolean
  leverageRate: number
  updateLeverageRate: (rate: number) => void
  onDragEnd: (rate: number) => void
}

export function SliderRow(props: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null)
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [rangeOffsetLeft, setRangeOffsetLeft] = useState<number>(0)
  const [rangeWidth, setRangeWidth] = useState<number>(0)

  const unit = 100 / (props.numberOfMarkers - 1);

  function getLabelUnit(i: number, isPercentage: boolean): number {
    const maxLabel = isPercentage ? props.maxLabelX : props.maxLabelX - 1;
    const percentageUnit = maxLabel / (props.numberOfMarkers - 1)
    return isPercentage ? percentageUnit*i: 1+percentageUnit*i
  }

  function onMarkerClick(i: any) {
    const percent = i / (props.numberOfMarkers - 1) * 100
    onSetGuagePercent(percent)
  }

  function calculateLeverageFromPercentage(percent: number): number {
    return (percent / 100) * (props.maxLabelX - 1) +1
  }

  function calculatePercentageFromLeverage(leverageRate: number): number {
    return (leverageRate-1) / (props.maxLabelX-1) * 100
  }

  function onDragEnd(e: MouseEvent<HTMLDivElement>) {
    setIsMouseDown(false)
    const percent = calculateGuagePercent(e.clientX, rangeOffsetLeft, rangeWidth)
    onSetGuagePercent(percent)
    const leverageRate = calculateLeverageFromPercentage(percent)
    props.onDragEnd(leverageRate)
  }

  function onDragStart(e: MouseEvent<HTMLDivElement>) {
    setIsMouseDown(true);
  }

  function onDragMove(e: MouseEvent<HTMLDivElement>) {
    if (!isMouseDown) return

    const percent = calculateGuagePercent(e.clientX, rangeOffsetLeft, rangeWidth)
    onSetGuagePercent(percent)
  }

  function onSetGuagePercent(percent: number) {
    if (guagePercent === percent) return

    const leverageRate = calculateLeverageFromPercentage(percent)
    props.updateLeverageRate(leverageRate)
  }

  function calculateGuagePercent(clientX: number, offsetLeft: number, width: number): number {
    let relativeRate = (clientX - offsetLeft) / width
    if (relativeRate > 1 && relativeRate !== Infinity) {
      relativeRate = 1
    } else if (relativeRate < 0) {
      relativeRate = 0
    }
    return Number((relativeRate * 100).toFixed(2))
  }

  function onSliderClick(e: MouseEvent<HTMLDivElement>) {
    const percent = calculateGuagePercent(e.clientX, rangeOffsetLeft, rangeWidth)
    onSetGuagePercent(percent)
  }

  useEffect(() => {
    setRangeOffsetLeft(outerRef.current?.offsetLeft || 0)
    setRangeWidth(railRef.current?.offsetWidth || 0)
  }, [outerRef.current?.offsetLeft, railRef.current?.offsetWidth])

  const guagePercent = calculatePercentageFromLeverage(props.leverageRate)

  return (
    <div
      className="row"
      style={{marginBottom: "12px"}}
      onMouseMove={onDragMove}
      onMouseUp={onDragEnd}
      >
      <div
        className="rc-slider-outer"
        style={{marginTop: "42px"}}
        ref={outerRef}
      >
      <div
        className="rc-slider rc-slider-with-marks"
        onClick={onSliderClick}
      >
        <div
          className="rc-slider-rail"
          style={{"backgroundColor": "rgb(21, 27, 40)"}}
          ref={railRef}
        >
        </div>
        <div
          className="rc-slider-track"
          style={{"backgroundColor": "rgb(105, 226, 219)", left: "0%", right: "auto", width: `${guagePercent}%`}
          }></div>
        <div className="rc-slider-step"
        >
          {
            [...Array(props.numberOfMarkers).keys()].map((v,  i: number) => {
              const isActive = guagePercent >= getLabelUnit(i, true)
              return (
                <span
                  key={`${unit*i}`}
                  className={`rc-slider-dot ${isActive ? 'rc-slider-dot-active rc-slider-dot--instyle-active' : 'rc-slider-dot--instyle'}`}
                  style={{left: `${unit*i}%`}}
                  onClick={() => onMarkerClick(i)}
                ></span>
              )
            })
          }
        </div>
        <div
          tabIndex={0}
          className="rc-slider-handle rc-slider-handle--instyle"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100} aria-valuenow={guagePercent} aria-disabled="false"
          onMouseDown={onDragStart}
          style={{left: `${guagePercent}%`}}
        />
        <div className="rc-slider-mark">
          {
            [...Array(props.numberOfMarkers).keys()].map((v,  i: number) => {
              const isActive = guagePercent >= getLabelUnit(i, true)
              return (
                <span
                  key={`${unit*i}`}
                  className={`rc-slider-mark-text rc-slider-mark-text--instyle ${isActive ? 'rc-slider-dot-active' : ''}`}
                  style={{left: `${unit*i}%`}}
                  onClick={() => onMarkerClick(i)}
                >
                  {props.isPercentage ? `${getLabelUnit(i, props.isPercentage).toFixed(0)}%` : `${getLabelUnit(i, props.isPercentage).toFixed(1)}x`}
                </span>
              )
            })
          }
          <div
          className="rc-slider-tooltip rc-slider-tooltip-placement-bottom"
          style={{
            left: `${guagePercent}%`,
            top: "50%",
            position: "relative",
            width: "4rem"
        }}>
          <div className="rc-slider-tooltip-content">
            <div className="rc-slider-tooltip-arrow"></div>
            <div className="rc-slider-tooltip-inner" role="tooltip"
              style={{
                backgroundColor: "rgb(21, 27, 40)",
                boxShadow: "none",
                borderRadius: "4px",
                padding: "4px 10px",
                color: "rgb(105, 226, 219)",
                fontSize: "13px",
                fontWeight: 500,
                lineHeight: "15px"
              }}>
              {`${calculateLeverageFromPercentage(guagePercent).toFixed(2)}x`}
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>
      </div>
      )
}