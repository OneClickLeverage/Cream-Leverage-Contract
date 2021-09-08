const hre = require("hardhat");
const { ethers } = hre;
const web3 = require("web3");

const token_ = require("../constant/cream_tokens.js");


async function main() {

  const [deployer] = await ethers.getSigners()
  const deployerAddress = deployer.address
  console.log(`\n Deployer Address: ${deployerAddress} \n`)

  console.log("-- Deployment --");
  const InstaIndex = await ethers.getContractFactory("InstaIndex");
  const instaIndex = await InstaIndex.deploy();
  await instaIndex.deployed();
  const instaIndexAddress = instaIndex.address;
  console.log("instaIndex: ", instaIndexAddress);

  const InstaList = await ethers.getContractFactory("InstaList");
  const instaList = await InstaList.deploy(instaIndexAddress);
  await instaList.deployed();
  console.log("instaList: ", instaList.address);

  const InstaConnectorsV2 = await ethers.getContractFactory("InstaConnectorsV2");
  const instaConnectorsV2 = await InstaConnectorsV2.deploy(instaIndexAddress);
  await instaConnectorsV2.deployed();
  console.log("InstaConnectorsV2: ", instaConnectorsV2.address);

  // might be unnecessary
  const InstaConnectorsV2Proxy = await ethers.getContractFactory("InstaConnectorsV2Proxy");
  const instaConnectorsV2Proxy = await InstaConnectorsV2Proxy.deploy(instaConnectorsV2.address, deployerAddress, "0x");
  await instaConnectorsV2Proxy.deployed();
  console.log("InstaConnectorsV2 Proxy: ", instaConnectorsV2Proxy.address);

  const InstaDefaultImplementation = await ethers.getContractFactory("InstaDefaultImplementation");
  const instaAccountV2DefaultImpl = await InstaDefaultImplementation.deploy(instaIndexAddress);
  await instaAccountV2DefaultImpl.deployed();
  console.log("InstaDefaultImplementation: ", instaAccountV2DefaultImpl.address);

  const InstaImplementations = await ethers.getContractFactory("InstaImplementations");
  const implementationsMapping = await InstaImplementations.deploy(instaIndexAddress);
  await implementationsMapping.deployed();
  console.log("InstaImplementations: ", implementationsMapping.address);

  const InstaImplementationM1 = await ethers.getContractFactory("InstaImplementationM1");
  const instaAccountV2ImplM1 = await InstaImplementationM1.deploy(instaIndexAddress, instaConnectorsV2.address);
  await instaAccountV2ImplM1.deployed();
  console.log("InstaImplementationM1: ", instaAccountV2ImplM1.address);

  const InstaAccountV2 = await ethers.getContractFactory("InstaAccountV2");
  const instaAccountV2 = await InstaAccountV2.deploy(implementationsMapping.address);
  await instaAccountV2.deployed();
  console.log("InstaAccountV2: ", instaAccountV2.address);

  console.log("");
  console.log("-- Initialization --");
  const setBasicsArgs = [
    deployerAddress,
    instaList.address,
    instaAccountV2.address,
    instaConnectorsV2.address
  ]
  const tx = await instaIndex.setBasics(...setBasicsArgs)
  const txDetails = await tx.wait()
  console.log(`
          - InstaIndex: setBasics
          status: ${txDetails.status == 1},
          tx: ${txDetails.transactionHash},
        `)

  let txSetDefaultImplementation = await implementationsMapping.setDefaultImplementation(instaAccountV2DefaultImpl.address)
  let txSetDefaultImplementationDetails = await txSetDefaultImplementation.wait()
    console.log(`
        - InstaImplementations: setDefaultImplementation
        status: ${txSetDefaultImplementationDetails.status == 1},
        tx: ${txSetDefaultImplementationDetails.transactionHash},
      `)

  const implementationV1Args = [
    instaAccountV2ImplM1.address,
    [
      "cast(string[],bytes[],address)"
    ].map((a) => web3.utils.keccak256(a).slice(0, 10))
  ]
  const txAddImplementation = await implementationsMapping.addImplementation(...implementationV1Args)
  const txAddImplementationDetails = await txAddImplementation.wait()
  console.log(`
        - InstaImplementations: addImplementation 
        status: ${txAddImplementationDetails.status == 1},
        tx: ${txAddImplementationDetails.transactionHash},
      `)

  const addNewAccountArgs = [
    instaAccountV2.address,
    instaConnectorsV2Proxy.address,
    "0x0000000000000000000000000000000000000000"
  ]
  const txAddNewAccount = await instaIndex.addNewAccount(...addNewAccountArgs)
  const txDetailsAddNewAccount = await txAddNewAccount.wait()

  console.log(`
          - InstaIndex: addNewAccount
          status: ${txDetailsAddNewAccount.status == 1},
          tx: ${txDetailsAddNewAccount.transactionHash},
      `)
  //console.log("###########\n\n")

  console.log("");
  console.log("-- CreamMapping --");

    const CreamMapping = await ethers.getContractFactory("InstaCreamMapping");
    const creamMapping = await CreamMapping.deploy(
        instaConnectorsV2.address,
        token_.names,
        token_.tokens,
        token_.ctokens
    );
    await creamMapping.deployed();
    console.log("CreamMapping: ", creamMapping.address) //"0xe7a85d0adDB972A4f0A4e57B698B37f171519e88");


  console.log("");
  console.log("-- CreamFlash --");

    const CreamFlashImplementation = await ethers.getContractFactory("CreamFlashImplementation");
    const creamflash = await CreamFlashImplementation.deploy();
    await creamflash.deployed();
    console.log("CreamFlashImplementation: ", creamflash.address);

    const CreamFlashProxy = await ethers.getContractFactory("CreamFlashProxy");
    const creamflashproxy = await CreamFlashProxy.deploy(
        creamflash.address,
        deployerAddress,
        "0x"
    );
    await creamflashproxy.deployed();
    console.log("CreamFlashProxy: ", creamflashproxy.address);


  console.log("");
  console.log("-- Connectors --");

    const ConnectV2Auth = await ethers.getContractFactory("ConnectV2Auth");
    const Auth = await ConnectV2Auth.deploy();
    await Auth.deployed();
    console.log("ConnectV2Auth: ", Auth.address);
    
    const ConnectV2Basic = await ethers.getContractFactory("ConnectV2Basic");
    const Basic = await ConnectV2Basic.deploy();
    await Basic.deployed();
    console.log("ConnectV2Basic: ", Basic.address);

    const ConnectV2Cream = await ethers.getContractFactory("ConnectV2Cream");
    const Cream = await ConnectV2Cream.deploy();
    await Cream.deployed();
    console.log("ConnectV2Cream: ", Cream.address);

    const ConnectV2FlashPool = await ethers.getContractFactory("ConnectV2FlashPool");
    const FlashPool = await ConnectV2FlashPool.deploy();
    await FlashPool.deployed();
    console.log("ConnectV2FlashPool: ", FlashPool.address);

    const ConnectV2UniswapV2 = await ethers.getContractFactory("ConnectV2UniswapV2");
    const UniswapV2 = await ConnectV2UniswapV2.deploy();
    await UniswapV2.deployed();
    console.log("ConnectV2UniswapV2: ", UniswapV2.address);

    const ConnectV2WETH = await ethers.getContractFactory("ConnectV2WETH");
    const WETH = await ConnectV2WETH.deploy();
    await WETH.deployed();
    console.log("ConnectV2WETH: ", WETH.address);


  console.log("");
  console.log("-- Resolver --");
    const InstaDSAResolver = await ethers.getContractFactory("InstaDSAResolver");
    const resolver = await InstaDSAResolver.deploy(instaIndexAddress);
    await resolver.deployed();
    console.log("InstaDSAResolver: ", resolver.address);


  console.log("");
  console.log("-- Enable Connectors --");

    const Addresses = [
        Auth.address,
        Basic.address,
        Cream.address,
        FlashPool.address,
        UniswapV2.address,
        WETH.address
    ];

    const Names = [
      "AUTHORITY-A",
      "BASIC-A",
      "CREAM-A",
      "FLASHPOOL-A",
      "UNISWAP-V2-A",
      "WETH-A"
    ]

  const txaddConnectors = await instaConnectorsV2.addConnectors(Names, Addresses)
  const txtxaddConnectorsDetails = await txaddConnectors.wait()
  console.log(`
          - instaConnectorsV2: addConnectors
          status: ${txtxaddConnectorsDetails.status == 1},
          tx: ${txtxaddConnectorsDetails.transactionHash},
        `)

  console.log("=====Gelato====")

  const ConditionCreamCTokenUnsafe = await ethers.getContractFactory("ConditionCreamCTokenUnsafe");
  const conditionCreamCTokenUnsafe = await ConditionCreamCTokenUnsafe.deploy();
  await conditionCreamCTokenUnsafe.deployed();
  console.log("conditionCreamCTokenUnsafe: ", conditionCreamCTokenUnsafe.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });