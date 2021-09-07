import React, { useState } from 'react';
import { createWallet } from '../../../insta_scripts/experiments/fromBrowser';
import { CSS_RGB_EMERALD_BRIGHT } from '../utils/color';

declare let window: any;

interface Props {
  userAddress: string,
  onCreateWallet: () => void
}

export function CreateWallet(props: Props) {
  const [errorMsg, setErrMsg] = useState<string>("")
  async function onCreateWallet() {
    try {
      await createWallet(window.ethereum, props.userAddress)
      window.location.reload()
    } catch (e: any) {
      setErrMsg(e.message?.toString())
    }
  }
  return (
    <div
      className="leverage-body"
    >
      <div
        className="row-content"
        style={{
          flexFlow: "row",
          flexDirection: "column",
        }}
      >
        <h1
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBottom: "32px"
          }}
        >
          Create a Wallet to Start Trading
        </h1>
        { errorMsg !== '' &&
          <h3
            style={{
              display: "flex",
              justifyContent: "center",
              paddingBottom: "32px",
              color: "rgb(255,0,0)"
            }}
          >
            {errorMsg}
          </h3>
        }
        <button
          type="button"
          onClick={onCreateWallet}
          className="borrow-button"
          // disabled={shouldNotExecute}
          style={{
            // width: "30%",
            // marginTop: "6px",
            // marginLeft: "0px",
            // top: "16px",
            margin: "auto",
            display: "flex",
            justifyContent: "center",
            // cursor: shouldNotExecute ? 'not-allowed' : 'pointer',
            // opacity: shouldNotExecute ? 0.2 : 1,
            backgroundColor: CSS_RGB_EMERALD_BRIGHT
          }}
        >
          CREATE
        </button>
      </div>
    </div>
  )
}