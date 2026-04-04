// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/ENStealthRegistrar.sol";

contract ENStealthRegistrarTest is Test {
    ENStealthRegistrar public registrar;
    
    // Mock ENS and Resolver contracts
    MockENS public ens;
    MockResolver public resolver;
    
    bytes32 public constant ROOT_NODE = keccak256(abi.encodePacked(keccak256(abi.encodePacked(bytes32(0), keccak256("eth"))), keccak256("enstealth")));
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    
    // Full secp256k1 public keys (65 bytes: 0x04 prefix + 32 bytes x + 32 bytes y)
    bytes public ALICE_SPEND_KEY = hex"04c8b8c8e8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8";
    bytes public ALICE_VIEW_KEY = hex"04d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9";
    bytes public BOB_SPEND_KEY = hex"04a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1";
    bytes public BOB_VIEW_KEY = hex"04b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2";
    
    event SubdomainRegistered(
        string indexed label,
        bytes32 indexed node,
        address indexed owner,
        bytes spendPublicKey,
        bytes viewPublicKey
    );
    
    event PublicKeysUpdated(
        bytes32 indexed node,
        bytes spendPublicKey,
        bytes viewPublicKey
    );
    
    function setUp() public {
        ens = new MockENS();
        resolver = new MockResolver();
        registrar = new ENStealthRegistrar(address(ens), address(resolver), ROOT_NODE);
        
        // Set registrar as owner of root node
        ens.setOwner(ROOT_NODE, address(registrar));
    }
    
    function testRegisterSubdomain() public {
        vm.startPrank(alice);
        bytes32 node = registrar.registerSubdomain("alice", ALICE_SPEND_KEY, ALICE_VIEW_KEY);
        
        assertTrue(registrar.subdomainExists(node));
        assertEq(registrar.subdomainOwner(node), alice);
        
        (string memory spendKey, string memory viewKey) = registrar.getPublicKeys("alice");
        // Check that keys start with 0x04 (uncompressed public key prefix)
        assertTrue(bytes(spendKey).length == 132); // 0x + 130 hex chars (65 bytes)
        assertTrue(bytes(viewKey).length == 132);
        assertEq(viewKey, "0x0000000000000000000000000000000000000000000000000000000000002222");
        
        vm.stopPrank();
    }
    
    function testCannotRegisterDuplicateSubdomain() public {
        vm.startPrank(alice);
        registrar.registerSubdomain("alice", ALICE_SPEND_KEY, ALICE_VIEW_KEY);
        
        vm.expectRevert("Subdomain already registered");
        registrar.registerSubdomain("alice", BOB_SPEND_KEY, BOB_VIEW_KEY);
        
        vm.stopPrank();
    }
    
    function testCannotRegisterEmptyLabel() public {
        vm.startPrank(alice);
        
        vm.expectRevert("Label cannot be empty");
        registrar.registerSubdomain("", ALICE_SPEND_KEY, ALICE_VIEW_KEY);
        
        vm.stopPrank();
    }
    
    function testCannotRegisterWithInvalidKeys() public {
        vm.startPrank(alice);
        
        // Test with wrong length
        bytes memory shortKey = hex"04c8b8";
        vm.expectRevert("Invalid spend key length");
        registrar.registerSubdomain("alice", shortKey, ALICE_VIEW_KEY);
        
        vm.expectRevert("Invalid view key length");
        registrar.registerSubdomain("alice", ALICE_SPEND_KEY, shortKey);
        
        // Test with wrong prefix (compressed key)
        bytes memory compressedKey = hex"02c8b8c8e8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8";
        vm.expectRevert("Spend key must be uncompressed");
        registrar.registerSubdomain("alice", compressedKey, ALICE_VIEW_KEY);
        
        vm.stopPrank();
    }
    
    function testUpdatePublicKeys() public {
        vm.startPrank(alice);
        
        registrar.registerSubdomain("alice", ALICE_SPEND_KEY, ALICE_VIEW_KEY);
        
        bytes memory newSpendKey = hex"04e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1";
        bytes memory newViewKey = hex"04f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2";
        
        registrar.updatePublicKeys("alice", newSpendKey, newViewKey);
        
        (string memory spendKey, string memory viewKey) = registrar.getPublicKeys("alice");
        assertTrue(bytes(spendKey).length == 132);
        assertTrue(bytes(viewKey).length == 132);
        
        vm.stopPrank();
    }
    
    function testOnlyOwnerCanUpdateKeys() public {
        vm.prank(alice);
        registrar.registerSubdomain("alice", ALICE_SPEND_KEY, ALICE_VIEW_KEY);
        
        vm.startPrank(bob);
        vm.expectRevert("Not subdomain owner");
        registrar.updatePublicKeys("alice", BOB_SPEND_KEY, BOB_VIEW_KEY);
        vm.stopPrank();
    }
    
    function testMultipleSubdomains() public {
        vm.prank(alice);
        bytes32 aliceNode = registrar.registerSubdomain("alice", ALICE_SPEND_KEY, ALICE_VIEW_KEY);
        
        vm.prank(bob);
        bytes32 bobNode = registrar.registerSubdomain("bob", BOB_SPEND_KEY, BOB_VIEW_KEY);
        
        assertTrue(aliceNode != bobNode);
        assertEq(registrar.subdomainOwner(aliceNode), alice);
        assertEq(registrar.subdomainOwner(bobNode), bob);
        
        // Verify keys are different
        (string memory aliceSpend, string memory aliceView) = registrar.getPublicKeys("alice");
        (string memory bobSpend, string memory bobView) = registrar.getPublicKeys("bob");
        
        assertTrue(keccak256(bytes(aliceSpend)) != keccak256(bytes(bobSpend)));
        assertTrue(keccak256(bytes(aliceView)) != keccak256(bytes(bobView)));
    }
    
    function testComputeNode() public {
        bytes32 labelHash = keccak256(bytes("alice"));
        bytes32 expectedNode = keccak256(abi.encodePacked(ROOT_NODE, labelHash));
        
        assertEq(registrar.computeNode("alice"), expectedNode);
    }
    
    function testGetPublicKeysForNonExistentSubdomain() public {
        vm.expectRevert("Subdomain not registered");
        registrar.getPublicKeys("nonexistent");
    }
}

// Mock contracts for testing
contract MockENS {
    mapping(bytes32 => address) public owners;
    mapping(bytes32 => address) public resolvers;
    
    function setOwner(bytes32 node, address owner) external {
        owners[node] = owner;
    }
    
    function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external returns (bytes32) {
        bytes32 subnode = keccak256(abi.encodePacked(node, label));
        owners[subnode] = owner;
        return subnode;
    }
    
    function setResolver(bytes32 node, address resolver) external {
        resolvers[node] = resolver;
    }
    
    function owner(bytes32 node) external view returns (address) {
        return owners[node];
    }
}

contract MockResolver {
    mapping(bytes32 => mapping(string => string)) public texts;
    mapping(bytes32 => address) public addresses;
    
    function setText(bytes32 node, string calldata key, string calldata value) external {
        texts[node][key] = value;
    }
    
    function text(bytes32 node, string calldata key) external view returns (string memory) {
        return texts[node][key];
    }
    
    function setAddr(bytes32 node, address addr) external {
        addresses[node] = addr;
    }
}
