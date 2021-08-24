const hre = require("hardhat");
const { ethers } = hre;
const web3 = require("web3");


async function main() {
  const [deployer] = await ethers.getSigners()
  const deployerAddress = deployer.address
  console.log(`\n\n\n Deployer Address: ${deployerAddress} \n\n\n`)

    const InstaIndex = await ethers.getContractFactory("InstaIndex");
    const instaIndex = await InstaIndex.deploy();
    await instaIndex.deployed();
    
    const instaIndexAddress = instaIndex.address;
    console.log("instaIndex: ", instaIndexAddress);


    const InstaList = await ethers.getContractFactory("InstaList");
    const instaList = await InstaList.deploy(instaIndexAddress);
    await instaList.deployed();

    console.log("instaList: ", instaList.address);

/*
    const InstaAccount = await ethers.getContractFactory("InstaAccount");
    const instaAccount = await InstaAccount.deploy(instaIndexAddress);
    await instaAccount.deployed();

    console.log("InstaAccountV2 deployed: ", instaAccount.address);
*/

    const InstaConnectors = await ethers.getContractFactory("InstaConnectorsV2");
    const instaConnectors = await InstaConnectors.deploy(instaIndexAddress);
    await instaConnectors.deployed();
    console.log("InstaConnectorsV2: ", instaConnectors.address);

/*
    const InstaEvent = await ethers.getContractFactory("InstaEvent");
    const instaEvent = await InstaEvent.deploy(instaList.address);
    await instaEvent.deployed();
    
    console.log("instaEvent deployed: ", instaEvent.address);

    const InstaMemory = await ethers.getContractFactory("InstaMemory");
    const instaMemory = await InstaMemory.deploy();
    await instaMemory.deployed();

    console.log("instaMemory deployed: ", instaMemory.address);
    
    const InstaConnectorsV2Impl = await ethers.getContractFactory("InstaConnectorsV2Impl");
    const instaConnectorsV2Impl = await InstaConnectorsV2Impl.deploy();
    await instaConnectorsV2Impl.deployed();

    console.log("InstaConnectorsV2 Impl: ", instaConnectorsV2Impl.address);
*/

    const InstaConnectorsV2Proxy = await ethers.getContractFactory("InstaConnectorsV2Proxy");
    const instaConnectorsV2Proxy = await InstaConnectorsV2Proxy.deploy(instaConnectorsV2Impl.address, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x");
    await instaConnectorsV2Proxy.deployed();

    console.log("InstaConnectorsV2 Proxy: ", instaConnectorsV2Proxy.address);

    const InstaConnectorsV2 = await ethers.getContractFactory("InstaConnectorsV2");
    const instaConnectorsV2 = await InstaConnectorsV2.deploy(instaIndexAddress);
    await instaConnectorsV2.deployed();

    console.log("InstaConnectorsV2: ", instaConnectorsV2.address);

    const InstaImplementations = await ethers.getContractFactory("InstaImplementations");
    const implementationsMapping = await InstaImplementations.deploy(instaIndexAddress);
    await implementationsMapping.deployed();

    console.log("InstaImplementations: ", implementationsMapping.address);

    const InstaAccountV2 = await ethers.getContractFactory("InstaAccountV2");
    const instaAccountV2 = await InstaAccountV2.deploy(implementationsMapping.address);
    await instaAccountV2.deployed();

    console.log("InstaAccountV2: ", instaAccountV2.address);

    const InstaDefaultImplementation = await ethers.getContractFactory("InstaDefaultImplementation");
    const instaAccountV2DefaultImpl = await InstaDefaultImplementation.deploy(instaIndexAddress);
    await instaAccountV2DefaultImpl.deployed();

    console.log("InstaDefaultImplementation: ", instaAccountV2DefaultImpl.address);

    const InstaImplementationM1 = await ethers.getContractFactory("InstaImplementationM1");
    const instaAccountV2ImplM1 = await InstaImplementationM1.deploy(instaIndexAddress, instaConnectorsV2.address);
    await instaAccountV2ImplM1.deployed();

    console.log("InstaImplementationM1: ", instaAccountV2ImplM1.address);

    console.log("\n\n########### setBasics ########")
        const setBasicsArgs = [
            deployerAddress,
            instaList.address,
            instaAccountV2.address,
            instaConnectors.address
        ]
        const tx = await instaIndex.setBasics(...setBasicsArgs)
        const txDetails = await tx.wait()
        console.log(`
          status: ${txDetails.status == 1},
          tx: ${txDetails.transactionHash},
        `)
    console.log("###########\n\n")

    console.log("\n\n########### Add DSAv2 Implementations ########")
      let txSetDefaultImplementation = await implementationsMapping.setDefaultImplementation(instaAccountV2DefaultImpl.address)
      let txSetDefaultImplementationDetails = await txSetDefaultImplementation.wait()
      
      
      const implementationV1Args = [
          instaAccountV2ImplM1.address,
          [
            "cast(string[],bytes[],address)"
          ].map((a) => web3.utils.keccak256(a).slice(0, 10))
      ]
      const txAddImplementation = await implementationsMapping.addImplementation(...implementationV1Args)
      const txAddImplementationDetails = await txAddImplementation.wait()
      console.log(`
        status: ${txAddImplementationDetails.status == 1},
        tx: ${txAddImplementationDetails.transactionHash},
      `)
    console.log("###########\n\n")

    console.log("\n\n########### Add DSAv2 ########")
      const addNewAccountArgs = [
          instaAccountV2.address,
          instaConnectorsV2Proxy.address,
          "0x0000000000000000000000000000000000000000"
      ]
      const txAddNewAccount = await instaIndex.addNewAccount(...addNewAccountArgs)
      const txDetailsAddNewAccount = await txAddNewAccount.wait()

      console.log(`
          status: ${txDetailsAddNewAccount.status == 1},
          tx: ${txDetailsAddNewAccount.transactionHash},
      `)
    console.log("###########\n\n")


    if (hre.network.name === "mainnet" || hre.network.name === "kovan") {
      await hre.run("verify:verify", {
          address: instaConnectorsV2Impl.address,
          constructorArguments: [],
          contract: "contracts/v2/proxy/dummyConnectorsImpl.sol:InstaConnectorsV2Impl"
        }
      )
      await hre.run("verify:verify", {
          address: instaConnectorsV2Proxy.address,
          constructorArguments: [instaConnectorsV2Impl.address, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x"],
          contract: "contracts/v2/proxy/connectorsProxy.sol:InstaConnectorsV2Proxy"
        }
      )

      await hre.run("verify:verify", {
          address: instaConnectorsV2.address,
          constructorArguments: []
        }
      )

      await hre.run("verify:verify", {
          address: implementationsMapping.address,
          constructorArguments: []
        }
      )

      await hre.run("verify:verify", {
          address: instaAccountV2DefaultImpl.address,
          constructorArguments: []
        }
      )

      await hre.run("verify:verify", {
          address: instaAccountV2ImplM1.address,
          constructorArguments: [instaConnectorsV2.address]
        }
      )

      await hre.run("verify:verify", {
          address: instaAccountV2Proxy.address,
          constructorArguments: [implementationsMapping.address]
        }
      )
    } else {
      console.log("Contracts deployed to", hre.network.name)
    }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });