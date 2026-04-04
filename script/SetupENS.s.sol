// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";

// ENS Registry interface
interface IENS {
    function owner(bytes32 node) external view returns (address);
    function setOwner(bytes32 node, address owner) external;
    function setResolver(bytes32 node, address resolver) external;
    function resolver(bytes32 node) external view returns (address);
}

/**
 * @title SetupENSScript
 * @notice Script to configure enstealth.eth for use with ENStealthRegistrar
 * @dev This transfers ownership of enstealth.eth to the registrar contract
 */
contract SetupENSScript is Script {
    // Sepolia ENS addresses
    address constant SEPOLIA_ENS_REGISTRY = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;
    address constant SEPOLIA_PUBLIC_RESOLVER = 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD;
    
    // Compute namehash for enstealth.eth
    // namehash('eth') = 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae
    // namehash('enstealth.eth') = keccak256(namehash('eth'), keccak256('enstealth'))
    bytes32 constant ETH_NODE = 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae;
    bytes32 constant ENSTEALTH_LABEL = keccak256("enstealth");
    bytes32 constant ENSTEALTH_NODE = keccak256(abi.encodePacked(ETH_NODE, ENSTEALTH_LABEL));
    
    function run() external {
        // Get registrar address from environment
        address registrarAddress = vm.envAddress("NEXT_PUBLIC_ENS_REGISTRAR_ADDRESS");
        require(registrarAddress != address(0), "Registrar address not set");
        
        // Use SEPOLIA_PRIVATE_KEY for deployment
        uint256 deployerPrivateKey = vm.envUint("SEPOLIA_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        IENS ens = IENS(SEPOLIA_ENS_REGISTRY);
        
        console.log("Setting up enstealth.eth");
        console.log("========================");
        console.log("ENS Registry:", SEPOLIA_ENS_REGISTRY);
        console.log("Root Node:", vm.toString(ENSTEALTH_NODE));
        console.log("Current Owner:", ens.owner(ENSTEALTH_NODE));
        console.log("Deployer:", deployer);
        console.log("Registrar:", registrarAddress);
        console.log("");
        
        // Check current owner
        address currentOwner = ens.owner(ENSTEALTH_NODE);
        require(currentOwner == deployer, "You must own enstealth.eth to run this script");
        
        // Step 1: Set resolver if not already set
        address currentResolver = ens.resolver(ENSTEALTH_NODE);
        if (currentResolver != SEPOLIA_PUBLIC_RESOLVER) {
            console.log("Step 1: Setting resolver to Sepolia Public Resolver...");
            ens.setResolver(ENSTEALTH_NODE, SEPOLIA_PUBLIC_RESOLVER);
            console.log("[SUCCESS] Resolver set");
        } else {
            console.log("Step 1: Resolver already set");
        }
        
        // Step 2: Transfer ownership to registrar
        console.log("");
        console.log("Step 2: Transferring ownership to registrar...");
        console.log("  WARNING: This makes subdomain registration permissionless!");
        console.log("  Anyone can register merchant.enstealth.eth subdomains");
        ens.setOwner(ENSTEALTH_NODE, registrarAddress);
        console.log("[SUCCESS] Ownership transferred");
        
        // Verify transfer
        address newOwner = ens.owner(ENSTEALTH_NODE);
        require(newOwner == registrarAddress, "Ownership transfer failed");
        
        console.log("");
        console.log("Setup Complete!");
        console.log("==============");
        console.log("enstealth.eth is now managed by:", newOwner);
        console.log("Resolver:", ens.resolver(ENSTEALTH_NODE));
        console.log("");
        console.log("Merchants can now register subdomains permissionlessly!");
        
        vm.stopBroadcast();
    }
}
