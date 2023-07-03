const hre = require("hardhat");

async function main() {
  console.log("Preparing deployment")
  // Fetch contract to deploy
  const Token = await hre.ethers.getContractFactory("Token")
  const Exchange = await hre.ethers.getContractFactory("Exchange")

  const accounts = await ethers.getSigners()
  console.log(`Accounts fetched\n${accounts[0].address}\n${accounts[1].address}\n`)

  // Deploy contracts
  const zeqToken = await Token.deploy('Zeq Token', 'ZEQ', 1000000)
  await zeqToken.deployed()
  console.log(`ZEQ Token deployed to : ${zeqToken.address}`)

  const mETH = await Token.deploy('mETH', 'mETH', 1000000)
  await mETH.deployed()
  console.log(`mETH Token deployed to : ${mETH.address}`)

  const mDAI = await Token.deploy('mDAI', 'mDAI', 1000000)
  await mDAI.deployed()
  console.log(`mDAI Token deployed to : ${mDAI.address}`)

  const exchange = await Exchange.deploy(accounts[1].address, 10)
  await exchange.deployed()
  console.log(`exchange deployed to : ${exchange.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
