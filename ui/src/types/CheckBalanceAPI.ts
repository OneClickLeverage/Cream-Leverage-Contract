export interface Balance {
  userEthBalance: number,
  dsaCollateralBalance: number,
  dsaCTokenBalance: number,
  totalDebtAmount: number,
  totalCollateralAmount: number,
  totalCollateralDollarAmount: number,
  debtRatio: number,
  collateralPrice: number,
  debtPrice: number,
  collateralRatio: number,
}

export const ZeroBalance = {
  userEthBalance: 0,
  dsaCollateralBalance: 0,
  dsaCTokenBalance: 0,
  totalDebtAmount: 0,
  totalCollateralAmount: 0,
  totalCollateralDollarAmount: 0,
  debtRatio: 0,
  collateralPrice: 0,
  debtPrice: 0,
  collateralRatio: 0,
}