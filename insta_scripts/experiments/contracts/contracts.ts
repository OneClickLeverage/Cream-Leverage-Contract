// eslint-disable-next-line @typescript-eslint/no-var-requires
const hre = require('hardhat')
const { ethers } = hre

import { Signer } from '@ethersproject/abstract-signer'
import { Provider } from '@ethersproject/providers'
import {
  ConditionCreamCTokenUnsafe,
  ConditionCreamCTokenUnsafeFactory, CreamFlashImplementation,
  CreamFlashImplementationFactory
} from '../../../types/compiled'


export interface IContracts {
  ConditionCreamUnsafe: ConditionCreamCTokenUnsafe
  CreamFlashImplementation: CreamFlashImplementation
}

export interface IAccounts {
  user: Signer
  gelatoProvider: Signer
  gelatoExecutor: Signer
}

export const getMainnetDeployedContracts = (providerOrSigner: Provider | Signer): IContracts => {
  const ConditionCreamUnsafe = ConditionCreamCTokenUnsafeFactory
    .connect("0xd9140951d8aE6E5F625a02F5908535e16e3af964", providerOrSigner)
    // console.log(ConditionCreamUnsafe)

  const creamImp = CreamFlashImplementationFactory.connect("0xd9140951d8aE6E5F625a02F5908535e16e3af964", providerOrSigner)

  return {
    CreamFlashImplementation: creamImp,
    ConditionCreamUnsafe,
  }
}

// export const getDSA = (providerOrSigner: Provider | Signer, dsaAddress: string): DSA => {
//   const DSA = DSA__factory.connect(dsaAddress, providerOrSigner)
//   return DSA
// }

export const getAccounts = async (): Promise<IAccounts> => {
  const [user, gelatoProvider, gelatoExecutor] = await ethers.getSigners()
  return { user, gelatoProvider, gelatoExecutor }
}
