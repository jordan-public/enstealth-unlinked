// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title StealthPayment
 * @notice Enables private payments using stealth addresses
 * @dev Emits ephemeral public keys to allow recipients to discover payments
 */
contract StealthPayment {
    /// @notice Emitted when a stealth payment is made
    /// @param ensNode The ENS node hash of the recipient
    /// @param ephemeralPubKey The ephemeral public key (R = rG) used for derivation
    /// @param stealthAddress The derived stealth address that received the payment
    /// @param amount The amount of ETH sent
    /// @param sender The address of the sender (for WalletConnect flows)
    event StealthAnnouncement(
        bytes32 indexed ensNode,
        bytes32 ephemeralPubKey,
        address indexed stealthAddress,
        uint256 amount,
        address indexed sender
    );

    /// @notice Send funds to a stealth address
    /// @param ensName The ENS name of the recipient (e.g., "merchant.enstealth.eth")
    /// @param ephemeralPubKey The ephemeral public key R (32 bytes x-coordinate)
    /// @param stealthAddress The computed stealth address
    function sendFunds(
        string calldata ensName,
        bytes32 ephemeralPubKey,
        address stealthAddress
    ) external payable {
        require(msg.value > 0, "Must send ETH");
        require(stealthAddress != address(0), "Invalid stealth address");

        // Compute ENS node
        bytes32 ensNode = computeENSNode(ensName);

        // Transfer ETH to stealth address
        (bool success, ) = stealthAddress.call{value: msg.value}("");
        require(success, "Transfer failed");

        // Emit announcement for recipient to discover
        emit StealthAnnouncement(
            ensNode,
            ephemeralPubKey,
            stealthAddress,
            msg.value,
            msg.sender
        );
    }

    /// @notice Announce a stealth payment made outside this contract (e.g., via Unlink)
    /// @param ensName The ENS name of the recipient
    /// @param ephemeralPubKey The ephemeral public key R
    /// @param stealthAddress The stealth address that received payment
    /// @param amount The amount sent (for record-keeping)
    function announce(
        string calldata ensName,
        bytes32 ephemeralPubKey,
        address stealthAddress,
        uint256 amount
    ) external {
        bytes32 ensNode = computeENSNode(ensName);

        emit StealthAnnouncement(
            ensNode,
            ephemeralPubKey,
            stealthAddress,
            amount,
            msg.sender
        );
    }

    /// @notice Compute ENS node hash from name
    /// @dev Simplified - in production use ENS namehash library
    /// @param name The ENS name
    /// @return The namehash of the ENS name
    function computeENSNode(string calldata name) public pure returns (bytes32) {
        // Simplified namehash for hackathon
        // In production, use proper ENS namehash algorithm
        return keccak256(abi.encodePacked(name));
    }

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}
