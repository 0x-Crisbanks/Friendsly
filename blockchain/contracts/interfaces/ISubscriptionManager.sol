// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ISubscriptionManager
 * @author Friendsly Team
 * @notice Interface for managing creator subscriptions via NFTs
 * @dev Each subscription is represented by an ERC-721 NFT
 */
interface ISubscriptionManager {
    /// @notice Subscription details structure
    struct Subscription {
        uint256 tokenId;
        address subscriber;
        address creator;
        uint256 startTime;
        uint256 endTime;
        uint256 price;
        bool active;
        bool autoRenew;
    }

    /// @notice Emitted when new subscription is created
    event Subscribed(
        uint256 indexed tokenId,
        address indexed subscriber,
        address indexed creator,
        uint256 price,
        uint256 endTime
    );

    /// @notice Emitted when subscription is renewed
    event SubscriptionRenewed(
        uint256 indexed tokenId,
        address indexed subscriber,
        uint256 newEndTime
    );

    /// @notice Emitted when subscription is cancelled
    event SubscriptionCancelled(
        uint256 indexed tokenId,
        address indexed subscriber,
        uint256 timestamp
    );

    /// @notice Emitted when auto-renew is toggled
    event AutoRenewToggled(
        uint256 indexed tokenId,
        address indexed subscriber,
        bool autoRenew
    );

    /**
     * @notice Subscribe to a creator
     * @param creator Address of the creator to subscribe to
     * @return tokenId NFT token ID representing the subscription
     */
    function subscribe(address creator) external payable returns (uint256 tokenId);

    /**
     * @notice Renew an existing subscription
     * @param tokenId Token ID of the subscription to renew
     */
    function renewSubscription(uint256 tokenId) external payable;

    /**
     * @notice Cancel a subscription
     * @param tokenId Token ID of the subscription to cancel
     */
    function cancelSubscription(uint256 tokenId) external;

    /**
     * @notice Toggle auto-renewal for subscription
     * @param tokenId Token ID of the subscription
     * @param enabled True to enable auto-renew, false to disable
     */
    function setAutoRenew(uint256 tokenId, bool enabled) external;

    /**
     * @notice Check if subscription is active
     * @param tokenId Token ID of the subscription
     * @return bool True if subscription is active
     */
    function isSubscriptionActive(uint256 tokenId) external view returns (bool);

    /**
     * @notice Check if user is subscribed to creator
     * @param subscriber Address of the subscriber
     * @param creator Address of the creator
     * @return bool True if actively subscribed
     */
    function isActiveSubscriber(address subscriber, address creator)
        external
        view
        returns (bool);

    /**
     * @notice Get subscription details
     * @param tokenId Token ID of the subscription
     * @return Subscription struct
     */
    function getSubscription(uint256 tokenId)
        external
        view
        returns (Subscription memory);

    /**
     * @notice Get all active subscriptions for a user
     * @param subscriber Address of the subscriber
     * @return uint256[] Array of active token IDs
     */
    function getUserSubscriptions(address subscriber)
        external
        view
        returns (uint256[] memory);

    /**
     * @notice Get all subscribers for a creator
     * @param creator Address of the creator
     * @return address[] Array of subscriber addresses
     */
    function getCreatorSubscribers(address creator)
        external
        view
        returns (address[] memory);

    /**
     * @notice Get subscription count for creator
     * @param creator Address of the creator
     * @return uint256 Number of active subscribers
     */
    function getSubscriberCount(address creator) external view returns (uint256);
}
