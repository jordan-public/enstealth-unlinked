// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/StealthPayment.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        StealthPayment stealthPayment = new StealthPayment();
        
        console.log("StealthPayment deployed at:", address(stealthPayment));

        vm.stopBroadcast();
    }
}
