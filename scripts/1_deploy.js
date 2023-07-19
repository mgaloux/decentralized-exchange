const hre = require("hardhat");

async function main() {
  console.log("Preparing deployment");
  // Fetch contract to deploy
  const Token = await hre.ethers.getContractFactory("Token");
  const Exchange = await hre.ethers.getContractFactory("Exchange");

  const accounts = await ethers.getSigners();
  console.log(`Accounts fetched\n${accounts[0].address}\n${accounts[1].address}\n`);

  // Set a custom gas price (in Gwei)
  const gasPriceGwei = 50; // Adjust this value as needed

  // Deploy contracts with the specified gas price
  const zeqToken = await Token.deploy('Zeq Token', 'ZEQ', 1000000, { gasPrice: ethers.utils.parseUnits(gasPriceGwei.toString(), 'gwei') });
  await zeqToken.deployed();
  console.log(`ZEQ Token deployed to: ${zeqToken.address}`);

  const mETH = await Token.deploy('mETH', 'mETH', 1000000, { gasPrice: ethers.utils.parseUnits(gasPriceGwei.toString(), 'gwei') });
  await mETH.deployed();
  console.log(`mETH Token deployed to: ${mETH.address}`);

  const mDAI = await Token.deploy('mDAI', 'mDAI', 1000000, { gasPrice: ethers.utils.parseUnits(gasPriceGwei.toString(), 'gwei') });
  await mDAI.deployed();
  console.log(`mDAI Token deployed to: ${mDAI.address}`);

  const exchange = await Exchange.deploy(accounts[1].address, 10, { gasPrice: ethers.utils.parseUnits(gasPriceGwei.toString(), 'gwei') });
  await exchange.deployed();
  console.log(`Exchange deployed to: ${exchange.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
