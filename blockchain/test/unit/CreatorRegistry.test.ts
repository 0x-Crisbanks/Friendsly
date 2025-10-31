import { expect } from "chai";
import { ethers } from "hardhat";
import { CreatorRegistry } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CreatorRegistry", function () {
  let creatorRegistry: CreatorRegistry;
  let owner: SignerWithAddress;
  let creator1: SignerWithAddress;
  let creator2: SignerWithAddress;
  let user1: SignerWithAddress;

  const MIN_PRICE = ethers.parseEther("0.001");
  const VALID_PRICE = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, creator1, creator2, user1] = await ethers.getSigners();

    const CreatorRegistryFactory = await ethers.getContractFactory("CreatorRegistry");
    creatorRegistry = await CreatorRegistryFactory.deploy();
    await creatorRegistry.waitForDeployment();
  });

  describe("Creator Registration", function () {
    it("Should register a new creator successfully", async function () {
      const username = "creator1";
      const profileCID = "QmTestCID123";

      await expect(
        creatorRegistry
          .connect(creator1)
          .registerCreator(username, profileCID, VALID_PRICE)
      )
        .to.emit(creatorRegistry, "CreatorRegistered")
        .withArgs(creator1.address, username, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      expect(await creatorRegistry.isCreator(creator1.address)).to.be.true;
      expect(await creatorRegistry.totalCreators()).to.equal(1);
    });

    it("Should fail if username is too short", async function () {
      await expect(
        creatorRegistry
          .connect(creator1)
          .registerCreator("ab", "QmTestCID", VALID_PRICE)
      ).to.be.revertedWith("CreatorRegistry: Username too short");
    });

    it("Should fail if username is too long", async function () {
      const longUsername = "a".repeat(21);
      await expect(
        creatorRegistry
          .connect(creator1)
          .registerCreator(longUsername, "QmTestCID", VALID_PRICE)
      ).to.be.revertedWith("CreatorRegistry: Username too long");
    });

    it("Should fail if username is already taken", async function () {
      const username = "creator1";

      await creatorRegistry
        .connect(creator1)
        .registerCreator(username, "QmTestCID1", VALID_PRICE);

      await expect(
        creatorRegistry
          .connect(creator2)
          .registerCreator(username, "QmTestCID2", VALID_PRICE)
      ).to.be.revertedWith("CreatorRegistry: Username taken");
    });

    it("Should fail if subscription price is too low", async function () {
      const lowPrice = ethers.parseEther("0.0001");

      await expect(
        creatorRegistry
          .connect(creator1)
          .registerCreator("creator1", "QmTestCID", lowPrice)
      ).to.be.revertedWith("CreatorRegistry: Invalid subscription price");
    });

    it("Should fail if already registered", async function () {
      await creatorRegistry
        .connect(creator1)
        .registerCreator("creator1", "QmTestCID", VALID_PRICE);

      await expect(
        creatorRegistry
          .connect(creator1)
          .registerCreator("creator2", "QmTestCID2", VALID_PRICE)
      ).to.be.revertedWith("CreatorRegistry: Already registered");
    });
  });

  describe("Profile Management", function () {
    beforeEach(async function () {
      await creatorRegistry
        .connect(creator1)
        .registerCreator("creator1", "QmTestCID", VALID_PRICE);
    });

    it("Should update profile successfully", async function () {
      const newCID = "QmNewCID456";

      await expect(creatorRegistry.connect(creator1).updateProfile(newCID))
        .to.emit(creatorRegistry, "ProfileUpdated")
        .withArgs(creator1.address, newCID, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      const profile = await creatorRegistry.getCreator(creator1.address);
      expect(profile.profileCID).to.equal(newCID);
    });

    it("Should fail if not a creator", async function () {
      await expect(
        creatorRegistry.connect(user1).updateProfile("QmNewCID")
      ).to.be.revertedWith("CreatorRegistry: Not a creator");
    });

    it("Should update subscription price successfully", async function () {
      const newPrice = ethers.parseEther("0.02");

      await expect(
        creatorRegistry.connect(creator1).updateSubscriptionPrice(newPrice)
      )
        .to.emit(creatorRegistry, "SubscriptionPriceUpdated")
        .withArgs(creator1.address, VALID_PRICE, newPrice);

      const profile = await creatorRegistry.getCreator(creator1.address);
      expect(profile.subscriptionPrice).to.equal(newPrice);
    });
  });

  describe("Creator Verification", function () {
    beforeEach(async function () {
      await creatorRegistry
        .connect(creator1)
        .registerCreator("creator1", "QmTestCID", VALID_PRICE);
    });

    it("Should verify creator as admin", async function () {
      await expect(creatorRegistry.connect(owner).verifyCreator(creator1.address))
        .to.emit(creatorRegistry, "CreatorVerified");

      const profile = await creatorRegistry.getCreator(creator1.address);
      expect(profile.verified).to.be.true;
      expect(await creatorRegistry.totalVerifiedCreators()).to.equal(1);
    });

    it("Should fail to verify if not admin", async function () {
      await expect(
        creatorRegistry.connect(user1).verifyCreator(creator1.address)
      ).to.be.reverted;
    });
  });

  describe("Creator Queries", function () {
    beforeEach(async function () {
      await creatorRegistry
        .connect(creator1)
        .registerCreator("creator1", "QmTestCID1", VALID_PRICE);
      await creatorRegistry
        .connect(creator2)
        .registerCreator("creator2", "QmTestCID2", VALID_PRICE);
    });

    it("Should get creator by address", async function () {
      const profile = await creatorRegistry.getCreator(creator1.address);
      expect(profile.username).to.equal("creator1");
      expect(profile.wallet).to.equal(creator1.address);
    });

    it("Should get creator by username", async function () {
      const address = await creatorRegistry.getCreatorByUsername("creator1");
      expect(address).to.equal(creator1.address);
    });

    it("Should check username availability", async function () {
      expect(await creatorRegistry.isUsernameAvailable("creator1")).to.be.false;
      expect(await creatorRegistry.isUsernameAvailable("newcreator")).to.be.true;
    });

    it("Should get all creators with pagination", async function () {
      const creators = await creatorRegistry.getAllCreators(0, 10);
      expect(creators.length).to.equal(2);
      expect(creators[0]).to.equal(creator1.address);
      expect(creators[1]).to.equal(creator2.address);
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause contract", async function () {
      await creatorRegistry.connect(owner).pause();

      await expect(
        creatorRegistry
          .connect(creator1)
          .registerCreator("creator1", "QmTestCID", VALID_PRICE)
      ).to.be.reverted;

      await creatorRegistry.connect(owner).unpause();

      await expect(
        creatorRegistry
          .connect(creator1)
          .registerCreator("creator1", "QmTestCID", VALID_PRICE)
      ).to.not.be.reverted;
    });
  });
});
