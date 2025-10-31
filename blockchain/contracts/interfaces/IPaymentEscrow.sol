// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPaymentEscrow
 * @author Friendsly Team
 * @notice Interface for secure payment escrow system
 * @dev Handles all payments with automatic fee distribution
 */
interface IPaymentEscrow {
    /// @notice Payment types
    enum PaymentType {
        TIP,
        SUBSCRIPTION,
        CONTENT_PURCHASE
    }

    /// @notice Payment status
    enum PaymentStatus {
        PENDING,
        COMPLETED,
        REFUNDED,
        DISPUTED
    }

    /// @notice Payment details structure
    struct Payment {
        bytes32 id;
        address payer;
        address creator;
        uint256 totalAmount;
        uint256 creatorAmount;
        uint256 platformFee;
        PaymentType paymentType;
        PaymentStatus status;
        uint256 timestamp;
        uint256 completedAt;
    }

    /// @notice Emitted when payment is received
    event PaymentReceived(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed creator,
        uint256 amount,
        PaymentType paymentType
    );

    /// @notice Emitted when payment is completed
    event PaymentCompleted(
        bytes32 indexed paymentId,
        address indexed creator,
        uint256 creatorAmount,
        uint256 platformFee
    );

    /// @notice Emitted when payment is refunded
    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed payer,
        uint256 amount
    );

    /// @notice Emitted when platform fee is updated
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    /**
     * @notice Process a payment
     * @param creator Address of the creator receiving payment
     * @param paymentType Type of payment (tip, subscription, etc)
     * @return paymentId Unique identifier for the payment
     */
    function processPayment(address creator, PaymentType paymentType)
        external
        payable
        returns (bytes32 paymentId);

    /**
     * @notice Complete a payment and distribute funds
     * @param paymentId ID of the payment to complete
     */
    function completePayment(bytes32 paymentId) external;

    /**
     * @notice Refund a payment
     * @param paymentId ID of the payment to refund
     */
    function refundPayment(bytes32 paymentId) external;

    /**
     * @notice Withdraw creator earnings
     */
    function withdrawEarnings() external;

    /**
     * @notice Withdraw platform fees (admin only)
     * @param recipient Address to receive fees
     */
    function withdrawPlatformFees(address payable recipient) external;

    /**
     * @notice Get payment details
     * @param paymentId ID of the payment
     * @return Payment struct
     */
    function getPayment(bytes32 paymentId)
        external
        view
        returns (Payment memory);

    /**
     * @notice Get creator's pending earnings
     * @param creator Address of the creator
     * @return uint256 Pending earnings in wei
     */
    function getPendingEarnings(address creator)
        external
        view
        returns (uint256);

    /**
     * @notice Get total platform fees collected
     * @return uint256 Total fees in wei
     */
    function getTotalPlatformFees() external view returns (uint256);

    /**
     * @notice Get current platform fee percentage
     * @return uint256 Fee percentage (e.g., 10 = 10%)
     */
    function getPlatformFeePercentage() external view returns (uint256);
}
