import { TokenID } from '../types/TokenID';

export function roundAmount(amount: number, tokenID: TokenID): number {
  let finalAmount = amount
  if (tokenID === TokenID.DAI || tokenID === TokenID.USDC) {
    finalAmount = Number(amount.toFixed(2))
  } else if (tokenID === TokenID.ETH) {
    finalAmount = Number(amount.toFixed(6))
  }

  return finalAmount
}