// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const deployArgs = require("./args.js");

async function main() {
  console.log(deployArgs);
  const wethToPirex = await hre.ethers.deployContract("WethToPirex", deployArgs, {});

  await wethToPirex.waitForDeployment();

  console.log(`Contract deployed to: ${wethToPirex.target}`);

  /*
  // skip this because etherscan takes a minute to be ready to verify
  if (hre.network.name === "mainnet") {
    console.log('verifying contract');
    await hre.run("verify:verify", {
      address: flappers.target,
      constructorArguments: deployArgs,
    });
  }
  */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
