// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseScript} from "./Base.s.sol";
import {MarketFactory} from "@/MarketFactory.sol";
import {console2} from "forge-std/console2.sol";

/// @title DeployScript
/// @notice Main deployment script for MarketFactory
contract DeployScript is BaseScript {
    /// @notice Main deployment function
    function run() public returns (MarketFactory factory) {
        // Start deployment
        DeploymentConfig memory config = startDeployment();

        // Deploy MarketFactory
        factory = deployMarketFactory();
        saveDeployment("MarketFactory", address(factory));

        // End deployment
        endDeployment();

        // Log summary
        console2.log("\n=== DEPLOYMENT COMPLETE ===");
        console2.log("MarketFactory:", address(factory));
        console2.log("Chain ID:", block.chainid);
        console2.log("Owner:", factory.owner());

        return factory;
    }

    /// @notice Deploy MarketFactory
    function deployMarketFactory() internal returns (MarketFactory) {
        console2.log("\nDeploying MarketFactory...");

        MarketFactory factory = new MarketFactory();

        console2.log("MarketFactory deployed to:", address(factory));
        console2.log("MarketFactory owner:", factory.owner());

        return factory;
    }
}
