// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/StealthPayment.sol";

contract StealthPaymentTest is Test {
    StealthPayment public stealthPayment;
    address public alice;
    address public bob;
    address public stealthAddr;

    function setUp() public {
        stealthPayment = new StealthPayment();
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        stealthAddr = makeAddr("stealthAddr");
        
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function testSendFunds() public {
        uint256 sendAmount = 1 ether;
        bytes32 ephemeralKey = keccak256("random_ephemeral_key");
        string memory ensName = "merchant.enstealth.eth";

        uint256 initialBalance = stealthAddr.balance;

        vm.prank(alice);
        
        stealthPayment.sendFunds{value: sendAmount}(
            ensName,
            ephemeralKey,
            stealthAddr
        );

        assertEq(stealthAddr.balance, initialBalance + sendAmount);
    }

    function testSendFundsRevertsWithZeroValue() public {
        bytes32 ephemeralKey = keccak256("random_ephemeral_key");
        string memory ensName = "merchant.enstealth.eth";

        vm.prank(alice);
        vm.expectRevert("Must send ETH");
        stealthPayment.sendFunds{value: 0}(
            ensName,
            ephemeralKey,
            stealthAddr
        );
    }

    function testSendFundsRevertsWithZeroAddress() public {
        bytes32 ephemeralKey = keccak256("random_ephemeral_key");
        string memory ensName = "merchant.enstealth.eth";

        vm.prank(alice);
        vm.expectRevert("Invalid stealth address");
        stealthPayment.sendFunds{value: 1 ether}(
            ensName,
            ephemeralKey,
            address(0)
        );
    }

    function testAnnounce() public {
        bytes32 ephemeralKey = keccak256("random_ephemeral_key");
        string memory ensName = "merchant.enstealth.eth";
        uint256 amount = 0.5 ether;

        vm.prank(alice);

        stealthPayment.announce(
            ensName,
            ephemeralKey,
            stealthAddr,
            amount
        );
    }

    function testComputeENSNode() public view {
        string memory name1 = "merchant.enstealth.eth";
        string memory name2 = "merchant.enstealth.eth";
        string memory name3 = "other.enstealth.eth";

        bytes32 node1 = stealthPayment.computeENSNode(name1);
        bytes32 node2 = stealthPayment.computeENSNode(name2);
        bytes32 node3 = stealthPayment.computeENSNode(name3);

        assertEq(node1, node2, "Same names should produce same hash");
        assertTrue(node1 != node3, "Different names should produce different hashes");
    }
}
