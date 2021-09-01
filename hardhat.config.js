/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 require("@nomiclabs/hardhat-ethers");
 const secret = require("./secret.json")
 
 module.exports = {
   networks: {
     hardhat: {
       chainId: 1,
       loggingEnabled: true,
       forking: {
         url: secret.alchemy_key,
         blockNumber: 13112347
       }
     }
   },

  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: false,
            runs: 200,
          },
        },
      },
      { version: "0.6.0",},
      { version: "0.6.2",},
      { version: "0.6.5",},
      { version: "0.6.8",},
      { version: "0.7.0",},
    ],
  },
 };