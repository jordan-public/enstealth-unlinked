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
    
    bytes32 public constant ALICE_SPEND_KEY = bytes32(uint256(0x1111));
    bytes32 public constant ALICE_VIEW_KEY = bytes32(uint256(0x2222));
    bytes32 public constant BOB_SPEND_KEY = bytes32(uint256(0x3333));
    bytes32 public constant BOB_VIEW_KEY = bytes32(uint256(0x4444));
    
    event SubdomainRegistered(
        string indexed label,
        bytes32 indexed node,
        address indexed owner,
        bytes32 spendPublicKey,
        bytes32 viewPublicKey
    );
    
    event PublicKeysUpdated(
        bytes32 indexed node,
        bytes32 spendPublicKey,
        bytes32 viewPublicKey
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
        
        vm.expectEmit(true, true, true, true);
        emit SubdomainRegistered("alice", registrar.computeNode("alice"), alice, ALICE_SPEND_KEY, ALICE_VIEW_KEY);
        
        bytes32 node = registrar.registerSubdomain("alice", ALICE_SPEND_KEY, ALICE_VIEW_KEY);
        
        assertTrue(registrar.subdomainExists(node));
        assertEq(registrar.subdomainOwner(node), alice);
        
        (string memory spendKey, string memory viewKey) = registrar.getPublicKeys("alice");
        assertEq(spendKey, "0x0000000000000000000000000000000000000000000000000000000000001111");
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
    
    function testCannotRegisterWithZeroKeys() public {
        vm.startPrank(alice);
        
        vm.expectRevert("Invalid spend key");
        registrar.registerSubdomain("alice", bytes32(0), ALICE_VIEW_KEY);
        
        vm.expectRevert("Invalid view key");
        registrar.registerSubdomain("alice", ALICE_SPEND_KEY, bytes32(0));
        
        vm.stopPrank();
    }
    
    function testUpdatePublicKeys() public {
        vm.startPrank(alice);
        
        registrar.registerSubdomain("alice", ALICE_SPEND_KEY, ALICE_VIEW_KEY);
        
        bytes32 newSpendKey = bytes32(uint256(0x5555));
        bytes32 newViewKey = bytes32(uint256(0x6666));
        
        bytes32 node = registrar.computeNode("alice");
        vm.expectEmit(true, true, true, true);
        emit PublicKeysUpdated(node, newSpendKey, newViewKey);
        
        registrar.updatePublicKeys("alice", newSpendKey, newViewKey);
        
        (string memory spendKey, string memory viewKey) = registrar.getPublicKeys("alice");
        assertEq(spendKey, "0x0000000000000000000000000000000000000000000000000000000000005555");
        assertEq(viewKey, "0x0000000000000000000000000000000000000000000000000000000000006666");
        
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
