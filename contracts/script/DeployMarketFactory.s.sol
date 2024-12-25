// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {MarketFactory} from "../src/MarketFactory.sol";

/// @title DeployMarketFactory
/// @notice Deploy MarketFactory to Polygon Amoy
contract DeployMarketFactory is Script {
    function run() public returns (MarketFactory factory) {
        string memory pkString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(string.concat("0x", pkString));

        vm.startBroadcast(deployerPrivateKey);

        factory = new MarketFactory();

        vm.stopBroadcast();

        console2.log("MarketFactory deployed to:", address(factory));
        console2.log("Owner:", factory.owner());

        return factory;
    }
}
