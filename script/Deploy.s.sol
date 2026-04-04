// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/StealthPayment.sol";
import "../contracts/ENStealthRegistrar.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy StealthPayment contract
        StealthPayment stealthPayment = new StealthPayment();
        console.log("StealthPayment deployed at:", address(stealthPayment));

        // ENS contract addresses
        address ensRegistry;
        address ensResolver;
        bytes32 rootNode;
        
        // Check which network we're on
        uint256 chainId = block.chainid;
        
        if (chainId == 11155111) {
            // Sepolia
            ensRegistry = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;
            ensResolver = 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD;
            // namehash("enstealth.eth") - you'll need to register this domain first
            rootNode = keccak256(abi.encodePacked(keccak256(abi.encodePacked(bytes32(0), keccak256("eth"))), keccak256("enstealth")));
            
            console.log("Deploying ENStealthRegistrar for Sepolia...");
        } else if (chainId == 1) {
            // Mainnet
            ensRegistry = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;
            ensResolver = 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63;
            rootNode = keccak256(abi.encodePacked(keccak256(abi.encodePacked(bytes32(0), keccak256("eth"))), keccak256("enstealth")));
            
            console.log("Deploying ENStealthRegistrar for Mainnet...");
        } else {
            // Local/Anvil - deploy mock ENS contracts
            console.log("Deploying mock ENS contracts for local testing...");
            MockENS mockEns = new MockENS();
            MockResolver mockResolver = new MockResolver();
            
            ensRegistry = address(mockEns);
            ensResolver = address(mockResolver);
            rootNode = keccak256(abi.encodePacked(keccak256(abi.encodePacked(bytes32(0), keccak256("eth"))), keccak256("enstealth")));
            
            // Set deployer as owner of root node
            mockEns.setOwner(rootNode, msg.sender);
            
            console.log("MockENS deployed at:", ensRegistry);
            console.log("MockResolver deployed at:", ensResolver);
        }
        
        // Deploy ENStealthRegistrar
        ENStealthRegistrar registrar = new ENStealthRegistrar(
            ensRegistry,
            ensResolver,
            rootNode
        );
        
        console.log("ENStealthRegistrar deployed at:", address(registrar));
        console.log("");
        console.log("IMPORTANT: Update your .env with:");
        console.log("NEXT_PUBLIC_STEALTH_PAYMENT_ADDRESS=", address(stealthPayment));
        console.log("NEXT_PUBLIC_ENS_REGISTRAR_ADDRESS=", address(registrar));

        vm.stopBroadcast();
    }
}

// Mock contracts for local testing
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

