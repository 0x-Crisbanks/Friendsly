// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ICreatorRegistry
 * @author Friendsly Team
 * @notice Interface for the Creator Registry contract
 * @dev Manages creator registration, verification, and profile data
 */
interface ICreatorRegistry {
    /// @notice Creator profile structure
    struct CreatorProfile {
        address wallet;
        string username;
        string profileCID; // IPFS hash for profile metadata
        uint256 subscriptionPrice;
        bool verified;
        bool active;
        uint256 reputation;
        uint256 totalEarnings;
        uint256 subscriberCount;
        uint256 registeredAt;
    }

    /// @notice Emitted when a new creator registers
    event CreatorRegistered(
        address indexed creator,
        string username,
        uint256 timestamp
    );

    /// @notice Emitted when a creator is verified
    event CreatorVerified(address indexed creator, uint256 timestamp);

    /// @notice Emitted when creator profile is updated
    event ProfileUpdated(
        address indexed creator,
        string profileCID,
        uint256 timestamp
    );

    /// @notice Emitted when subscription price is updated
    event SubscriptionPriceUpdated(
        address indexed creator,
        uint256 oldPrice,
        uint256 newPrice
    );

    /// @notice Emitted when creator is deactivated
    event CreatorDeactivated(address indexed creator, uint256 timestamp);

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
    ) external;

    /**
     * @notice Update creator profile
     * @param profileCID New IPFS hash for profile metadata
     */
    function updateProfile(string calldata profileCID) external;

    /**
     * @notice Update subscription price
     * @param newPrice New subscription price in wei
     */
    function updateSubscriptionPrice(uint256 newPrice) external;

    /**
     * @notice Verify a creator (admin only)
     * @param creator Address of creator to verify
     */
    function verifyCreator(address creator) external;

    /**
     * @notice Deactivate creator account
     */
    function deactivateCreator() external;

    /**
     * @notice Get creator profile
     * @param creator Address of the creator
     * @return CreatorProfile struct
     */
    function getCreator(address creator)
        external
        view
        returns (CreatorProfile memory);

    /**
     * @notice Check if address is a registered creator
     * @param creator Address to check
     * @return bool True if registered creator
     */
    function isCreator(address creator) external view returns (bool);

    /**
     * @notice Check if username is available
     * @param username Username to check
     * @return bool True if available
     */
    function isUsernameAvailable(string calldata username)
        external
        view
        returns (bool);

    /**
     * @notice Get creator by username
     * @param username Username to lookup
     * @return address Creator's wallet address
     */
    function getCreatorByUsername(string calldata username)
        external
        view
        returns (address);
}
