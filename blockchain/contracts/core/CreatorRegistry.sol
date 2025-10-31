// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/ICreatorRegistry.sol";

/**
 * @title CreatorRegistry
 * @author Friendsly Team
 * @notice Core registry for all creators on the platform
 * @dev Manages creator registration, verification, and profile data
 */
contract CreatorRegistry is ICreatorRegistry, AccessControl, ReentrancyGuard, Pausable {
    /// @notice Role for administrators who can verify creators
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Role for moderators
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    /// @notice Minimum subscription price (0.001 ETH)
    uint256 public constant MIN_SUBSCRIPTION_PRICE = 0.001 ether;

    /// @notice Maximum subscription price (10 ETH)
    uint256 public constant MAX_SUBSCRIPTION_PRICE = 10 ether;

    /// @notice Mapping from address to creator profile
    mapping(address => CreatorProfile) private creators;

    /// @notice Mapping from username to creator address
    mapping(string => address) private usernameToAddress;

    /// @notice Array of all creator addresses
    address[] private creatorList;

    /// @notice Total number of registered creators
    uint256 public totalCreators;

    /// @notice Total number of verified creators
    uint256 public totalVerifiedCreators;

    /**
     * @notice Constructor - sets up admin role
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Register as a creator
     * @param username Unique username for the creator
     * @param profileCID IPFS hash containing profile metadata
     * @param subscriptionPrice Monthly subscription price in wei
     */
    function registerCreator(
        string calldata username,
        string calldata profileCID,
        uint256 subscriptionPrice
    ) external override nonReentrant whenNotPaused {
        require(
            creators[msg.sender].wallet == address(0),
            "CreatorRegistry: Already registered"
        );
        require(bytes(username).length >= 3, "CreatorRegistry: Username too short");
        require(bytes(username).length <= 20, "CreatorRegistry: Username too long");
        require(
            usernameToAddress[username] == address(0),
            "CreatorRegistry: Username taken"
        );
        require(
            subscriptionPrice >= MIN_SUBSCRIPTION_PRICE &&
                subscriptionPrice <= MAX_SUBSCRIPTION_PRICE,
            "CreatorRegistry: Invalid subscription price"
        );
        require(bytes(profileCID).length > 0, "CreatorRegistry: Invalid profile CID");

        // Create creator profile
        creators[msg.sender] = CreatorProfile({
            wallet: msg.sender,
            username: username,
            profileCID: profileCID,
            subscriptionPrice: subscriptionPrice,
            verified: false,
            active: true,
            reputation: 0,
            totalEarnings: 0,
            subscriberCount: 0,
            registeredAt: block.timestamp
        });

        usernameToAddress[username] = msg.sender;
        creatorList.push(msg.sender);
        totalCreators++;

        emit CreatorRegistered(msg.sender, username, block.timestamp);
    }

    /**
     * @notice Update creator profile
     * @param profileCID New IPFS hash for profile metadata
     */
    function updateProfile(string calldata profileCID)
        external
        override
        nonReentrant
        whenNotPaused
    {
        require(isCreator(msg.sender), "CreatorRegistry: Not a creator");
        require(bytes(profileCID).length > 0, "CreatorRegistry: Invalid CID");

        creators[msg.sender].profileCID = profileCID;

        emit ProfileUpdated(msg.sender, profileCID, block.timestamp);
    }

    /**
     * @notice Update subscription price
     * @param newPrice New subscription price in wei
     */
    function updateSubscriptionPrice(uint256 newPrice)
        external
        override
        nonReentrant
        whenNotPaused
    {
        require(isCreator(msg.sender), "CreatorRegistry: Not a creator");
        require(
            newPrice >= MIN_SUBSCRIPTION_PRICE && newPrice <= MAX_SUBSCRIPTION_PRICE,
            "CreatorRegistry: Invalid price"
        );

        uint256 oldPrice = creators[msg.sender].subscriptionPrice;
        creators[msg.sender].subscriptionPrice = newPrice;

        emit SubscriptionPriceUpdated(msg.sender, oldPrice, newPrice);
    }

    /**
     * @notice Verify a creator (admin only)
     * @param creator Address of creator to verify
     */
    function verifyCreator(address creator)
        external
        override
        onlyRole(ADMIN_ROLE)
    {
        require(isCreator(creator), "CreatorRegistry: Not a creator");
        require(!creators[creator].verified, "CreatorRegistry: Already verified");

        creators[creator].verified = true;
        totalVerifiedCreators++;

        emit CreatorVerified(creator, block.timestamp);
    }

    /**
     * @notice Deactivate creator account
     */
    function deactivateCreator() external override nonReentrant {
        require(isCreator(msg.sender), "CreatorRegistry: Not a creator");
        require(creators[msg.sender].active, "CreatorRegistry: Already deactivated");

        creators[msg.sender].active = false;

        emit CreatorDeactivated(msg.sender, block.timestamp);
    }

    /**
     * @notice Update creator earnings (called by payment contracts)
     * @param creator Address of the creator
     * @param amount Amount to add to earnings
     */
    function updateEarnings(address creator, uint256 amount)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(isCreator(creator), "CreatorRegistry: Not a creator");
        creators[creator].totalEarnings += amount;
    }

    /**
     * @notice Update subscriber count
     * @param creator Address of the creator
     * @param increment True to increment, false to decrement
     */
    function updateSubscriberCount(address creator, bool increment)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(isCreator(creator), "CreatorRegistry: Not a creator");

        if (increment) {
            creators[creator].subscriberCount++;
        } else if (creators[creator].subscriberCount > 0) {
            creators[creator].subscriberCount--;
        }
    }

    /**
     * @notice Get creator profile
     * @param creator Address of the creator
     * @return CreatorProfile struct
     */
    function getCreator(address creator)
        external
        view
        override
        returns (CreatorProfile memory)
    {
        require(isCreator(creator), "CreatorRegistry: Creator not found");
        return creators[creator];
    }

    /**
     * @notice Check if address is a registered creator
     * @param creator Address to check
     * @return bool True if registered creator
     */
    function isCreator(address creator) public view override returns (bool) {
        return creators[creator].wallet != address(0);
    }

    /**
     * @notice Check if username is available
     * @param username Username to check
     * @return bool True if available
     */
    function isUsernameAvailable(string calldata username)
        external
        view
        override
        returns (bool)
    {
        return usernameToAddress[username] == address(0);
    }

    /**
     * @notice Get creator by username
     * @param username Username to lookup
     * @return address Creator's wallet address
     */
    function getCreatorByUsername(string calldata username)
        external
        view
        override
        returns (address)
    {
        address creator = usernameToAddress[username];
        require(creator != address(0), "CreatorRegistry: Username not found");
        return creator;
    }

    /**
     * @notice Get all creators (paginated)
     * @param offset Starting index
     * @param limit Number of creators to return
     * @return address[] Array of creator addresses
     */
    function getAllCreators(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory)
    {
        require(offset < creatorList.length, "CreatorRegistry: Invalid offset");

        uint256 end = offset + limit;
        if (end > creatorList.length) {
            end = creatorList.length;
        }

        uint256 resultLength = end - offset;
        address[] memory result = new address[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = creatorList[offset + i];
        }

        return result;
    }

    /**
     * @notice Pause contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
