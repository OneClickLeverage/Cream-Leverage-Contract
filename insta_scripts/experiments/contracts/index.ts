// eslint-disable-next-line @typescript-eslint/no-var-requires
const hre = require('hardhat')
const { ethers } = hre

import { Signer } from 'ethers'
import {
  ConnectorAutoLiquidate,
  ConnectGelatoProviderPayment,
  ConditionMakerVaultUnsafe,
  MockAutoLiquidationExecutor,
  MockConnectorAutoLiquidate,
} from '../../../types/compiled'
import { getMainnetDeployedContracts } from '../contracts'
import { expect } from 'chai'

export interface IConnectors {
  ConnectGelatoProviderPayment: ConnectGelatoProviderPayment
  ConnectorAutoLiquidate: ConnectorAutoLiquidate
}

export interface IConditions {
  ConditionMakerVaultUnsafe: ConditionMakerVaultUnsafe
}

export interface IMocks {
  MockAutoLiquidationExecutor: MockAutoLiquidationExecutor
  MockConnectorAutoLiquidate: MockConnectorAutoLiquidate
}

export async function deployConnectors([user, gelatoProvider]: Signer[]): Promise<IConnectors> {
  const { InstaConnectors } = getMainnetDeployedContracts(user)

  const gelatoProviderAddress = await gelatoProvider.getAddress()

  const connectorLength = await InstaConnectors.connectorLength()

  const instaMaster = await ethers.provider.getSigner(hre.network.config.InstaMaster)

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [await instaMaster.getAddress()],
  })

  const connectGelatoProviderPayment_ConnectorId = connectorLength.add(1)
  const ConnectGelatoProviderPaymentContract = await ethers.getContractFactory('ConnectGelatoProviderPayment')
  const ConnectGelatoProviderPayment = (await ConnectGelatoProviderPaymentContract.deploy(
    connectGelatoProviderPayment_ConnectorId,
    gelatoProviderAddress,
  )) as ConnectGelatoProviderPayment
  await ConnectGelatoProviderPayment.deployed()

  await InstaConnectors.connect(instaMaster).enable(ConnectGelatoProviderPayment.address)

  const connectorAutoLiquidate_ConnectorId = connectGelatoProviderPayment_ConnectorId.add(1)
  const ConnectorAutoLiquidateContract = await ethers.getContractFactory('ConnectorAutoLiquidate')
  const ConnectorAutoLiquidate = (await ConnectorAutoLiquidateContract.deploy(
    connectorAutoLiquidate_ConnectorId,
    ConnectGelatoProviderPayment.address,
  )) as ConnectorAutoLiquidate
  await ConnectorAutoLiquidate.deployed()

  await InstaConnectors.connect(instaMaster).enable(ConnectorAutoLiquidate.address)

  expect(await InstaConnectors.isConnector([ConnectorAutoLiquidate.address, ConnectGelatoProviderPayment.address])).to
    .be.true

  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [await instaMaster.getAddress()],
  })

  return {
    ConnectGelatoProviderPayment,
    ConnectorAutoLiquidate,
  }
}

// eslint-disable-next-line no-empty-pattern
export async function deployConditions([]: Signer[]): Promise<IConditions> {
  const ConditionMakerVaultUnsafeContract = await ethers.getContractFactory('ConditionMakerVaultUnsafe')
  const ConditionMakerVaultUnsafe = (await ConditionMakerVaultUnsafeContract.deploy()) as ConditionMakerVaultUnsafe
  await ConditionMakerVaultUnsafe.deployed()

  return {
    ConditionMakerVaultUnsafe,
  }
}

/**
 * MOCKs
 */

export async function deployMocks([user, gelatoProvider]: Signer[]): Promise<IMocks> {
  const { GelatoCore, InstaConnectors } = getMainnetDeployedContracts(user)
  const gelatoProviderAddress = await gelatoProvider.getAddress()

  const instaMaster = await ethers.provider.getSigner(hre.network.config.InstaMaster)

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [await instaMaster.getAddress()],
  })

  const connectorLength = await InstaConnectors.connectorLength()

  const connectGelatoProviderPayment_ConnectorId = connectorLength.add(1)
  const ConnectGelatoProviderPaymentContract = await ethers.getContractFactory('ConnectGelatoProviderPayment')
  const ConnectGelatoProviderPayment = (await ConnectGelatoProviderPaymentContract.deploy(
    connectGelatoProviderPayment_ConnectorId,
    gelatoProviderAddress,
  )) as ConnectGelatoProviderPayment
  await ConnectGelatoProviderPayment.deployed()

  await InstaConnectors.connect(instaMaster).enable(ConnectGelatoProviderPayment.address)

  const mockConnectorAutoLiquidate_ConnectorId = connectGelatoProviderPayment_ConnectorId.add(1)
  const MockConnectorAutoLiquidateContract = await ethers.getContractFactory('MockConnectorAutoLiquidate')
  const MockConnectorAutoLiquidate = (await MockConnectorAutoLiquidateContract.deploy(
    mockConnectorAutoLiquidate_ConnectorId,
    ConnectGelatoProviderPayment.address,
  )) as MockConnectorAutoLiquidate
  await MockConnectorAutoLiquidate.deployed()

  await InstaConnectors.connect(instaMaster).enable(MockConnectorAutoLiquidate.address)

  expect(await InstaConnectors.isConnector([MockConnectorAutoLiquidate.address, ConnectGelatoProviderPayment.address]))
    .to.be.true

  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [await instaMaster.getAddress()],
  })

  const MockAutoLiquidationExecutorContract = await ethers.getContractFactory('MockAutoLiquidationExecutor')
  const MockAutoLiquidationExecutor = (await MockAutoLiquidationExecutorContract.deploy(GelatoCore.address, {
    value: await GelatoCore.minExecutorStake(),
  })) as MockAutoLiquidationExecutor
  await MockAutoLiquidationExecutor.deployed()

  return {
    MockAutoLiquidationExecutor,
    MockConnectorAutoLiquidate,
  }
}
