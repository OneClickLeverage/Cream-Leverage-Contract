export enum TokenID {
  ETH = 0,
  WBTC = 1,
  USDC = 2,
  DAI = 3,
}

export function getTokenTickerFromTokenID(id: TokenID) {
  switch (id) {
    case 0: {
      return 'ETH';
    }
    case 1: {
      return 'WBTC';
    }
    case 2: {
      return 'USDC';
    }
    case 3: {
      return 'DAI';
    }
    default: {
      return ''
    }
  }
}