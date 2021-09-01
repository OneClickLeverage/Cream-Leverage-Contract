module.exports = {
  connectors: {
    basic: require("./abi/connectors/basic.json"),
    auth: require("./abi/connectors/auth.json"),
    cream: require("./abi/connectors/cream.json"),
    flashpool: require("./abi/connectors/flashpool.json"),
    uniswap: require("./abi/connectors/uniswap.json"),
  },
  basic: {
    erc20: require("./abi/basics/erc20.json"),
  },
  other: {
    connector: require("./abi/external/InstaConnectorsV2.json"),
  },
};
