// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IPaymentEscrow.sol";
import "../interfaces/ICreatorRegistry.sol";

/**
 * @title PaymentEscrow
 * @author Friendsly Team
 * @notice Secure escrow system for all platform payments
 * @dev Automatically splits payments between creators and platform
 */
contract PaymentEscrow is IPaymentEscrow, AccessControl, ReentrancyGuard, Pausable {
    /// @notice Role for administrators
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Platform fee percentage (default 10%)
    uint256 public platformFeePercentage = 10;

    /// @notice Reference to Creator Registry
    ICreatorRegistry public immutable creatorRegistry;

    /// @notice Mapping from payment ID to payment details
    mapping(bytes32 => Payment) private payments;

    /// @notice Mapping from creator to pending earnings
    mapping(address => uint256) private pendingEarnings;

    /// @notice Total platform fees collected
    uint256 private totalPlatformFees;

    /// @notice Counter for generating unique payment IDs
    uint256 private paymentCounter;

    /**
     * @notice Constructor
     * @param _creatorRegistry Address of the Creator Registry contract
     */
    constructor(address _creatorRegistry) {
        require(_creatorRegistry != address(0), "PaymentEscrow: Invalid registry");

        creatorRegistry = ICreatorRegistry(_creatorRegistry);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Process a payment
     * @param creator Address of the creator receiving payment
     * @param paymentType Type of payment (tip, subscription, etc)
     * @return paymentId Unique identifier for the payment
     */
    function processPayment(address creator, PaymentType paymentType)
        external
        payable
        override
        nonReentrant
        whenNotPaused
        returns (bytes32 paymentId)
    {
        require(msg.value > 0, "PaymentEscrow: Amount must be > 0");
        require(
            creatorRegistry.isCreator(creator),
            "PaymentEscrow: Not a registered creator"
        );
        require(msg.sender != creator, "PaymentEscrow: Cannot pay yourself");

        // Calculate fees
        uint256 platformFee = (msg.value * platformFeePercentage) / 100;
        uint256 creatorAmount = msg.value - platformFee;

        // Generate unique payment ID
        paymentId = keccak256(
            abi.encodePacked(
                msg.sender,
                creator,
                msg.value,
                block.timestamp,
                paymentCounter++
            )
        );

        // Create payment record
        payments[paymentId] = Payment({
            id: paymentId,
            payer: msg.sender,
            creator: creator,
            totalAmount: msg.value,
            creatorAmount: creatorAmount,
            platformFee: platformFee,
            paymentType: paymentType,
            status: PaymentStatus.PENDING,
            timestamp: block.timestamp,
            completedAt: 0
        });

        emit PaymentReceived(
            paymentId,
            msg.sender,
            creator,
            msg.value,
            paymentType
        );

        // Auto-complete payment
        _completePayment(paymentId);

        return paymentId;
    }

    /**
     * @notice Complete a payment and distribute funds
     * @param paymentId ID of the payment to complete
     */
    function completePayment(bytes32 paymentId) external override nonReentrant {
        _completePayment(paymentId);
    }

    /**
     * @notice Internal function to complete payment
     * @param paymentId ID of the payment to complete
     */
    function _completePayment(bytes32 paymentId) private {
        Payment storage payment = payments[paymentId];

        require(payment.id != bytes32(0), "PaymentEscrow: Payment not found");
        require(
            payment.status == PaymentStatus.PENDING,
            "PaymentEscrow: Payment not pending"
        );

        // Update payment status
        payment.status = PaymentStatus.COMPLETED;
        payment.completedAt = block.timestamp;

        // Add to creator's pending earnings
        pendingEarnings[payment.creator] += payment.creatorAmount;

        // Add to platform fees
        totalPlatformFees += payment.platformFee;

        emit PaymentCompleted(
            paymentId,
            payment.creator,
            payment.creatorAmount,
            payment.platformFee
        );
    }

    /**
     * @notice Refund a payment
     * @param paymentId ID of the payment to refund
     */
    function refundPayment(bytes32 paymentId)
        external
        override
        nonReentrant
        onlyRole(ADMIN_ROLE)
    {
        Payment storage payment = payments[paymentId];

        require(payment.id != bytes32(0), "PaymentEscrow: Payment not found");
        require(
            payment.status == PaymentStatus.PENDING ||
                payment.status == PaymentStatus.COMPLETED,
            "PaymentEscrow: Cannot refund"
        );

        // If already completed, deduct from pending earnings
        if (payment.status == PaymentStatus.COMPLETED) {
            require(
                pendingEarnings[payment.creator] >= payment.creatorAmount,
                "PaymentEscrow: Insufficient earnings"
            );
            pendingEarnings[payment.creator] -= payment.creatorAmount;
            totalPlatformFees -= payment.platformFee;
        }

        payment.status = PaymentStatus.REFUNDED;

        // Send refund to payer
        (bool success, ) = payment.payer.call{value: payment.totalAmount}("");
        require(success, "PaymentEscrow: Refund transfer failed");

        emit PaymentRefunded(paymentId, payment.payer, payment.totalAmount);
    }

    /**
     * @notice Withdraw creator earnings
     */
    function withdrawEarnings() external override nonReentrant whenNotPaused {
        uint256 amount = pendingEarnings[msg.sender];
        require(amount > 0, "PaymentEscrow: No earnings to withdraw");

        pendingEarnings[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "PaymentEscrow: Transfer failed");
    }

    /**
     * @notice Withdraw platform fees (admin only)
     * @param recipient Address to receive fees
     */
    function withdrawPlatformFees(address payable recipient)
        external
        override
        nonReentrant
        onlyRole(ADMIN_ROLE)
    {
        require(recipient != address(0), "PaymentEscrow: Invalid recipient");
        require(totalPlatformFees > 0, "PaymentEscrow: No fees to withdraw");

        uint256 amount = totalPlatformFees;
        totalPlatformFees = 0;

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "PaymentEscrow: Transfer failed");
    }

    /**
     * @notice Update platform fee percentage (admin only)
     * @param newFee New fee percentage (e.g., 10 = 10%)
     */
    function setPlatformFeePercentage(uint256 newFee)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(newFee <= 20, "PaymentEscrow: Fee too high (max 20%)");

        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = newFee;

        emit PlatformFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Get payment details
     * @param paymentId ID of the payment
     * @return Payment struct
     */
    function getPayment(bytes32 paymentId)
        external
        view
        override
        returns (Payment memory)
    {
        require(payments[paymentId].id != bytes32(0), "PaymentEscrow: Not found");
        return payments[paymentId];
    }

    /**
     * @notice Get creator's pending earnings
     * @param creator Address of the creator
     * @return uint256 Pending earnings in wei
     */
    function getPendingEarnings(address creator)
        external
        view
        override
        returns (uint256)
    {
        return pendingEarnings[creator];
    }

    /**
     * @notice Get total platform fees collected
     * @return uint256 Total fees in wei
     */
    function getTotalPlatformFees() external view override returns (uint256) {
        return totalPlatformFees;
    }

    /**
     * @notice Get current platform fee percentage
     * @return uint256 Fee percentage (e.g., 10 = 10%)
     */
    function getPlatformFeePercentage()
        external
        view
        override
        returns (uint256)
    {
        return platformFeePercentage;
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
     * @notice Receive function to accept ETH
     */
    receive() external payable {}
}
