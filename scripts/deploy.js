// scripts/deploy.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const PaymentContract = await ethers.getContractFactory("PaymentContract");
  console.log("Deploying PaymentContract...");

  const paymentContract = await upgrades.deployProxy(PaymentContract, [], {
    initializer: 'initialize',
    kind: 'transparent'
  });
  await paymentContract.waitForDeployment();

  const address = await paymentContract.getAddress();
  console.log("PaymentContract deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });