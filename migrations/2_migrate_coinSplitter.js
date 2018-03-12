var CoinSplitter = artifacts.require("CoinSplitter");

module.exports = function(deployer) {
  // Deploy the Migrations contract as our only task
  deployer.deploy(CoinSplitter);
};
