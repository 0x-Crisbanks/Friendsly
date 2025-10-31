import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployment Script
 * Deploys all Friendsly smart contracts in correct order
 */

interface DeploymentAddresses {
  network: string;
  chainId: number;
  deployer: string;
  creatorRegistry: string;
  paymentEscrow: string;
  subscriptionManager: string;
  deployedAt: string;
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║           FRIENDSLY SMART CONTRACT DEPLOYMENT           ║");
  console.log("║                Designed by Friendsly Team               ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("📊 Deployment Configuration:");
  console.log("─".repeat(60));
  console.log(`Network:        ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer:       ${deployer.address}`);
  console.log(`Balance:        ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("─".repeat(60));
  console.log("");

  // Confirm deployment
  if (network.chainId === 1n) {
    console.log("⚠️  WARNING: Deploying to MAINNET!");
    console.log("Please confirm you want to proceed...\n");
    // In production, add manual confirmation here
  }

  const deploymentAddresses: DeploymentAddresses = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    creatorRegistry: "",
    paymentEscrow: "",
    subscriptionManager: "",
    deployedAt: new Date().toISOString(),
  };

  try {
    // 1. Deploy CreatorRegistry
    console.log("🚀 [1/3] Deploying CreatorRegistry...");
    const CreatorRegistry = await ethers.getContractFactory("CreatorRegistry");
    const creatorRegistry = await CreatorRegistry.deploy();
    await creatorRegistry.waitForDeployment();
    const creatorRegistryAddress = await creatorRegistry.getAddress();

    console.log(`✅ CreatorRegistry deployed to: ${creatorRegistryAddress}`);
    deploymentAddresses.creatorRegistry = creatorRegistryAddress;

    // 2. Deploy PaymentEscrow
    console.log("\n🚀 [2/3] Deploying PaymentEscrow...");
    const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
    const paymentEscrow = await PaymentEscrow.deploy(creatorRegistryAddress);
    await paymentEscrow.waitForDeployment();
    const paymentEscrowAddress = await paymentEscrow.getAddress();

    console.log(`✅ PaymentEscrow deployed to: ${paymentEscrowAddress}`);
    deploymentAddresses.paymentEscrow = paymentEscrowAddress;

    // 3. Deploy SubscriptionManager
    console.log("\n🚀 [3/3] Deploying SubscriptionManager...");
    const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
    const subscriptionManager = await SubscriptionManager.deploy(
      creatorRegistryAddress,
      paymentEscrowAddress
    );
    await subscriptionManager.waitForDeployment();
    const subscriptionManagerAddress = await subscriptionManager.getAddress();

    console.log(`✅ SubscriptionManager deployed to: ${subscriptionManagerAddress}`);
    deploymentAddresses.subscriptionManager = subscriptionManagerAddress;

    // Save deployment addresses
    console.log("\n💾 Saving deployment addresses...");
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `deployment-${network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentAddresses, null, 2));

    // Also save as latest
    const latestPath = path.join(deploymentsDir, `deployment-${network.name}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deploymentAddresses, null, 2));

    console.log(`✅ Deployment addresses saved to: ${filename}`);

    // Print summary
    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║            DEPLOYMENT SUCCESSFUL ✅                    ║");
    console.log("╚═══════════════════════════════════════════════════════╝\n");

    console.log("📋 Contract Addresses:");
    console.log("─".repeat(60));
    console.log(`CreatorRegistry:       ${creatorRegistryAddress}`);
    console.log(`PaymentEscrow:         ${paymentEscrowAddress}`);
    console.log(`SubscriptionManager:   ${subscriptionManagerAddress}`);
    console.log("─".repeat(60));

    console.log("\n📝 Next Steps:");
    console.log("1. Verify contracts on Etherscan:");
    console.log(`   npx hardhat verify --network ${network.name} ${creatorRegistryAddress}`);
    console.log(`   npx hardhat verify --network ${network.name} ${paymentEscrowAddress} ${creatorRegistryAddress}`);
    console.log(`   npx hardhat verify --network ${network.name} ${subscriptionManagerAddress} ${creatorRegistryAddress} ${paymentEscrowAddress}`);
    console.log("\n2. Update backend environment variables with contract addresses");
    console.log("3. Update frontend environment variables with contract addresses");
    console.log("4. Test basic functionality on the network\n");

    // Generate TypeScript constants file for frontend/backend
    console.log("🔧 Generating TypeScript constants...");
    const constantsContent = `// Auto-generated by deployment script
// Network: ${network.name} (Chain ID: ${network.chainId})
// Deployed at: ${deploymentAddresses.deployedAt}

export const CONTRACTS = {
  CREATOR_REGISTRY: "${creatorRegistryAddress}",
  PAYMENT_ESCROW: "${paymentEscrowAddress}",
  SUBSCRIPTION_MANAGER: "${subscriptionManagerAddress}",
} as const;

export const NETWORK = {
  NAME: "${network.name}",
  CHAIN_ID: ${network.chainId},
} as const;
`;

    const constantsPath = path.join(deploymentsDir, `contracts-${network.name}.ts`);
    fs.writeFileSync(constantsPath, constantsContent);
    console.log(`✅ TypeScript constants saved to: contracts-${network.name}.ts\n`);

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
