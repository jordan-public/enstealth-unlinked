// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ENS Registry interface
interface IENS {
    function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external returns (bytes32);
    function setResolver(bytes32 node, address resolver) external;
    function owner(bytes32 node) external view returns (address);
}

// ENS Public Resolver interface
interface IPublicResolver {
    function setText(bytes32 node, string calldata key, string calldata value) external;
    function text(bytes32 node, string calldata key) external view returns (string memory);
    function setAddr(bytes32 node, address addr) external;
}

/**
 * @title ENStealthRegistrar
 * @notice Permissionless subdomain registrar for enstealth.eth
 * @dev Allows anyone to register merchant.enstealth.eth subdomains with stealth address public keys
 */
contract ENStealthRegistrar {

    IENS public immutable ens;
    IPublicResolver public immutable resolver;
    bytes32 public immutable rootNode; // namehash of "enstealth.eth"

    mapping(bytes32 => bool) public subdomainExists;
    mapping(bytes32 => address) public subdomainOwner;

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

    /**
     * @notice Constructor
     * @param _ens Address of ENS registry
     * @param _resolver Address of ENS public resolver
     * @param _rootNode Namehash of enstealth.eth domain
     */
    constructor(address _ens, address _resolver, bytes32 _rootNode) {
        ens = IENS(_ens);
        resolver = IPublicResolver(_resolver);
        rootNode = _rootNode;
    }

    /**
     * @notice Register a subdomain with stealth address public keys
     * @param label The subdomain label (e.g., "alice" for alice.enstealth.eth)
     * @param spendPublicKey The spend public key for stealth addresses (65 bytes)
     * @param viewPublicKey The view public key for stealth addresses (65 bytes)
     */
    function registerSubdomain(
        string calldata label,
        bytes calldata spendPublicKey,
        bytes calldata viewPublicKey
    ) external returns (bytes32) {
        require(bytes(label).length > 0, "Label cannot be empty");
        require(spendPublicKey.length == 65, "Invalid spend key length");
        require(viewPublicKey.length == 65, "Invalid view key length");
        require(spendPublicKey[0] == 0x04, "Spend key must be uncompressed");
        require(viewPublicKey[0] == 0x04, "View key must be uncompressed");

        bytes32 labelHash = keccak256(bytes(label));
        bytes32 subnode = keccak256(abi.encodePacked(rootNode, labelHash));

        require(!subdomainExists[subnode], "Subdomain already registered");

        // Register subdomain in ENS
        ens.setSubnodeOwner(rootNode, labelHash, address(this));
        ens.setResolver(subnode, address(resolver));

        // Store ownership
        subdomainExists[subnode] = true;
        subdomainOwner[subnode] = msg.sender;

        // Set text records for public keys (as hex strings)
        resolver.setText(subnode, "stealth:spend", bytesToString(spendPublicKey));
        resolver.setText(subnode, "stealth:view", bytesToString(viewPublicKey));

        emit SubdomainRegistered(label, subnode, msg.sender, spendPublicKey, viewPublicKey);

        return subnode;
    }

    /**
     * @notice Update public keys for an existing subdomain (only owner)
     * @param label The subdomain label
     * @param spendPublicKey The new spend public key (65 bytes)
     * @param viewPublicKey The new view public key (65 bytes)
     */
    function updatePublicKeys(
        string calldata label,
        bytes calldata spendPublicKey,
        bytes calldata viewPublicKey
    ) external {
        require(spendPublicKey.length == 65, "Invalid spend key length");
        require(viewPublicKey.length == 65, "Invalid view key length");
        require(spendPublicKey[0] == 0x04, "Spend key must be uncompressed");
        require(viewPublicKey[0] == 0x04, "View key must be uncompressed");

        bytes32 labelHash = keccak256(bytes(label));
        bytes32 subnode = keccak256(abi.encodePacked(rootNode, labelHash));

        require(subdomainExists[subnode], "Subdomain not registered");
        require(subdomainOwner[subnode] == msg.sender, "Not subdomain owner");

        // Update text records
        resolver.setText(subnode, "stealth:spend", bytesToString(spendPublicKey));
        resolver.setText(subnode, "stealth:view", bytesToString(viewPublicKey));

        emit PublicKeysUpdated(subnode, spendPublicKey, viewPublicKey);
    }

    /**
     * @notice Get public keys for a subdomain
     * @param label The subdomain label
     * @return spendKey The spend public key as a string
     * @return viewKey The view public key as a string
     */
    function getPublicKeys(string calldata label) 
        external 
        view 
        returns (string memory spendKey, string memory viewKey) 
    {
        bytes32 labelHash = keccak256(bytes(label));
        bytes32 subnode = keccak256(abi.encodePacked(rootNode, labelHash));
        
        require(subdomainExists[subnode], "Subdomain not registered");
        
        spendKey = resolver.text(subnode, "stealth:spend");
        viewKey = resolver.text(subnode, "stealth:view");
    }

    /**
     * @notice Compute the namehash for a label
     * @param label The subdomain label
     * @return The namehash node for label.enstealth.eth
     */
    function computeNode(string calldata label) external view returns (bytes32) {
        bytes32 labelHash = keccak256(bytes(label));
        return keccak256(abi.encodePacked(rootNode, labelHash));
    }

    /**
     * @notice Convert bytes to hex string with 0x prefix
     * @param data The bytes data
     * @return The hex string representation
     */
    function bytesToString(bytes calldata data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2); // 0x + 2 hex chars per byte
        str[0] = '0';
        str[1] = 'x';
        
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        
        return string(str);
    }
}
