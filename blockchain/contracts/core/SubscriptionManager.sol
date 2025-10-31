// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/ISubscriptionManager.sol";
import "../interfaces/ICreatorRegistry.sol";
import "../interfaces/IPaymentEscrow.sol";

/**
 * @title SubscriptionManager
 * @author Friendsly Team
 * @notice Manages creator subscriptions via NFTs
 * @dev Each subscription is represented by an ERC-721 NFT
 */
contract SubscriptionManager is
    ISubscriptionManager,
    ERC721Enumerable,
    AccessControl,
    ReentrancyGuard,
    Pausable
{
    /// @notice Role for administrators
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Subscription duration (30 days)
    uint256 public constant SUBSCRIPTION_DURATION = 30 days;

    /// @notice Reference to Creator Registry
    ICreatorRegistry public immutable creatorRegistry;

    /// @notice Reference to Payment Escrow
    IPaymentEscrow public immutable paymentEscrow;

    /// @notice Mapping from token ID to subscription details
    mapping(uint256 => Subscription) private subscriptions;

    /// @notice Mapping from subscriber + creator to token ID
    mapping(address => mapping(address => uint256)) private subscriberToCreatorToken;

    /// @notice Mapping from creator to list of subscriber addresses
    mapping(address => address[]) private creatorSubscribers;

    /// @notice Counter for generating unique token IDs
    uint256 private tokenIdCounter;

    /**
     * @notice Constructor
     * @param _creatorRegistry Address of the Creator Registry contract
     * @param _paymentEscrow Address of the Payment Escrow contract
     */
    constructor(address _creatorRegistry, address _paymentEscrow)
        ERC721("Friendsly Subscription", "FSUB")
    {
        require(_creatorRegistry != address(0), "SubscriptionManager: Invalid registry");
        require(_paymentEscrow != address(0), "SubscriptionManager: Invalid escrow");

        creatorRegistry = ICreatorRegistry(_creatorRegistry);
        paymentEscrow = IPaymentEscrow(_paymentEscrow);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Subscribe to a creator
     * @param creator Address of the creator to subscribe to
     * @return tokenId NFT token ID representing the subscription
     */
    function subscribe(address creator)
        external
        payable
        override
        nonReentrant
        whenNotPaused
        returns (uint256 tokenId)
    {
        require(
            creatorRegistry.isCreator(creator),
            "SubscriptionManager: Not a creator"
        );
        require(msg.sender != creator, "SubscriptionManager: Cannot subscribe to self");
        require(
            !isActiveSubscriber(msg.sender, creator),
            "SubscriptionManager: Already subscribed"
        );

        // Get creator's subscription price
        ICreatorRegistry.CreatorProfile memory profile = creatorRegistry.getCreator(
            creator
        );
        require(
            msg.value >= profile.subscriptionPrice,
            "SubscriptionManager: Insufficient payment"
        );

        // Process payment through escrow
        bytes32 paymentId = paymentEscrow.processPayment{value: msg.value}(
            creator,
            IPaymentEscrow.PaymentType.SUBSCRIPTION
        );

        // Generate new token ID
        tokenId = ++tokenIdCounter;

        // Calculate subscription end time
        uint256 endTime = block.timestamp + SUBSCRIPTION_DURATION;

        // Create subscription
        subscriptions[tokenId] = Subscription({
            tokenId: tokenId,
            subscriber: msg.sender,
            creator: creator,
            startTime: block.timestamp,
            endTime: endTime,
            price: profile.subscriptionPrice,
            active: true,
            autoRenew: true
        });

        // Store token ID mapping
        subscriberToCreatorToken[msg.sender][creator] = tokenId;

        // Add to creator's subscriber list
        creatorSubscribers[creator].push(msg.sender);

        // Mint NFT to subscriber
        _safeMint(msg.sender, tokenId);

        emit Subscribed(tokenId, msg.sender, creator, profile.subscriptionPrice, endTime);

        return tokenId;
    }

    /**
     * @notice Renew an existing subscription
     * @param tokenId Token ID of the subscription to renew
     */
    function renewSubscription(uint256 tokenId)
        external
        payable
        override
        nonReentrant
        whenNotPaused
    {
        require(_ownerOf(tokenId) != address(0), "SubscriptionManager: Invalid token");

        Subscription storage sub = subscriptions[tokenId];
        require(ownerOf(tokenId) == msg.sender, "SubscriptionManager: Not owner");
        require(sub.active, "SubscriptionManager: Subscription cancelled");

        // Get current subscription price
        ICreatorRegistry.CreatorProfile memory profile = creatorRegistry.getCreator(
            sub.creator
        );
        require(
            msg.value >= profile.subscriptionPrice,
            "SubscriptionManager: Insufficient payment"
        );

        // Process payment through escrow
        paymentEscrow.processPayment{value: msg.value}(
            sub.creator,
            IPaymentEscrow.PaymentType.SUBSCRIPTION
        );

        // Extend subscription
        uint256 newEndTime;
        if (block.timestamp > sub.endTime) {
            // Expired - start from now
            newEndTime = block.timestamp + SUBSCRIPTION_DURATION;
        } else {
            // Active - extend from current end time
            newEndTime = sub.endTime + SUBSCRIPTION_DURATION;
        }

        sub.endTime = newEndTime;
        sub.price = profile.subscriptionPrice;

        emit SubscriptionRenewed(tokenId, msg.sender, newEndTime);
    }

    /**
     * @notice Cancel a subscription
     * @param tokenId Token ID of the subscription to cancel
     */
    function cancelSubscription(uint256 tokenId) external override nonReentrant {
        require(_ownerOf(tokenId) != address(0), "SubscriptionManager: Invalid token");

        Subscription storage sub = subscriptions[tokenId];
        require(ownerOf(tokenId) == msg.sender, "SubscriptionManager: Not owner");
        require(sub.active, "SubscriptionManager: Already cancelled");

        sub.active = false;
        sub.autoRenew = false;

        emit SubscriptionCancelled(tokenId, msg.sender, block.timestamp);
    }

    /**
     * @notice Toggle auto-renewal for subscription
     * @param tokenId Token ID of the subscription
     * @param enabled True to enable auto-renew, false to disable
     */
    function setAutoRenew(uint256 tokenId, bool enabled) external override {
        require(_ownerOf(tokenId) != address(0), "SubscriptionManager: Invalid token");

        Subscription storage sub = subscriptions[tokenId];
        require(ownerOf(tokenId) == msg.sender, "SubscriptionManager: Not owner");
        require(sub.active, "SubscriptionManager: Subscription cancelled");

        sub.autoRenew = enabled;

        emit AutoRenewToggled(tokenId, msg.sender, enabled);
    }

    /**
     * @notice Check if subscription is active
     * @param tokenId Token ID of the subscription
     * @return bool True if subscription is active
     */
    function isSubscriptionActive(uint256 tokenId)
        public
        view
        override
        returns (bool)
    {
        if (_ownerOf(tokenId) == address(0)) return false;

        Subscription memory sub = subscriptions[tokenId];
        return sub.active && block.timestamp <= sub.endTime;
    }

    /**
     * @notice Check if user is subscribed to creator
     * @param subscriber Address of the subscriber
     * @param creator Address of the creator
     * @return bool True if actively subscribed
     */
    function isActiveSubscriber(address subscriber, address creator)
        public
        view
        override
        returns (bool)
    {
        uint256 tokenId = subscriberToCreatorToken[subscriber][creator];
        if (tokenId == 0) return false;

        return isSubscriptionActive(tokenId);
    }

    /**
     * @notice Get subscription details
     * @param tokenId Token ID of the subscription
     * @return Subscription struct
     */
    function getSubscription(uint256 tokenId)
        external
        view
        override
        returns (Subscription memory)
    {
        require(_ownerOf(tokenId) != address(0), "SubscriptionManager: Invalid token");
        return subscriptions[tokenId];
    }

    /**
     * @notice Get all active subscriptions for a user
     * @param subscriber Address of the subscriber
     * @return uint256[] Array of active token IDs
     */
    function getUserSubscriptions(address subscriber)
        external
        view
        override
        returns (uint256[] memory)
    {
        uint256 balance = balanceOf(subscriber);
        uint256[] memory activeTokens = new uint256[](balance);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(subscriber, i);
            if (isSubscriptionActive(tokenId)) {
                activeTokens[activeCount] = tokenId;
                activeCount++;
            }
        }

        // Resize array to active count
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeTokens[i];
        }

        return result;
    }

    /**
     * @notice Get all subscribers for a creator
     * @param creator Address of the creator
     * @return address[] Array of subscriber addresses
     */
    function getCreatorSubscribers(address creator)
        external
        view
        override
        returns (address[] memory)
    {
        address[] memory allSubscribers = creatorSubscribers[creator];
        uint256 activeCount = 0;

        // Count active subscribers
        for (uint256 i = 0; i < allSubscribers.length; i++) {
            if (isActiveSubscriber(allSubscribers[i], creator)) {
                activeCount++;
            }
        }

        // Build result array
        address[] memory result = new address[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allSubscribers.length; i++) {
            if (isActiveSubscriber(allSubscribers[i], creator)) {
                result[index] = allSubscribers[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Get subscription count for creator
     * @param creator Address of the creator
     * @return uint256 Number of active subscribers
     */
    function getSubscriberCount(address creator)
        external
        view
        override
        returns (uint256)
    {
        address[] memory allSubscribers = creatorSubscribers[creator];
        uint256 count = 0;

        for (uint256 i = 0; i < allSubscribers.length; i++) {
            if (isActiveSubscriber(allSubscribers[i], creator)) {
                count++;
            }
        }

        return count;
    }

    /**
     * @notice Override transfer to prevent transfers of active subscriptions
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting
        if (from == address(0)) {
            return super._update(to, tokenId, auth);
        }

        // Prevent transfers of active subscriptions
        require(
            !isSubscriptionActive(tokenId),
            "SubscriptionManager: Cannot transfer active subscription"
        );

        return super._update(to, tokenId, auth);
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

    /**
     * @notice Override supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
