// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseTest} from "../utils/BaseTest.sol";
import {MarketFactory} from "../../src/MarketFactory.sol";
import {PredictionMarket} from "../../src/PredictionMarket.sol";
import {IMarketFactory} from "../../src/interfaces/IMarketFactory.sol";

/// @title MarketFactoryTest
/// @notice Tests for MarketFactory contract
contract MarketFactoryTest is BaseTest {
    MarketFactory public factory;

    string constant QUESTION = "Will ETH reach $10,000 by end of 2025?";
    string constant CATEGORY = "Crypto";
    string constant METADATA_URI = "ipfs://test-metadata-hash";
    uint256 resolutionTime;

    function setUp() public override {
        super.setUp();
        vm.prank(DEPLOYER);
        factory = new MarketFactory();
        resolutionTime = block.timestamp + 30 days;
    }

    // ============ Create Market Tests ============

    function test_CreateMarket() public asUser(ALICE) {
        (uint256 marketId, address market) = factory.createMarket(QUESTION, CATEGORY, METADATA_URI, resolutionTime);

        assertEq(marketId, 0);
        assertTrue(market != address(0));
        assertEq(factory.getMarketCount(), 1);
    }

    function test_CreateMarket_EmitsEvent() public asUser(ALICE) {
        // Check indexed params: marketId, market (skip), creator
        // Don't check non-indexed data since we can't predict market address
        vm.expectEmit(true, false, true, false);
        emit IMarketFactory.MarketCreated(0, address(0), ALICE, "", "", 0, "");

        factory.createMarket(QUESTION, CATEGORY, METADATA_URI, resolutionTime);
    }

    function test_CreateMarket_RevertsOnEmptyQuestion() public asUser(ALICE) {
        vm.expectRevert(IMarketFactory.EmptyQuestion.selector);
        factory.createMarket("", CATEGORY, METADATA_URI, resolutionTime);
    }

    function test_CreateMarket_RevertsOnPastResolutionTime() public asUser(ALICE) {
        vm.expectRevert(IMarketFactory.InvalidResolutionTime.selector);
        factory.createMarket(QUESTION, CATEGORY, METADATA_URI, block.timestamp - 1);
    }

    function test_CreateMultipleMarkets() public asUser(ALICE) {
        factory.createMarket(QUESTION, CATEGORY, METADATA_URI, resolutionTime);
        factory.createMarket("Second question?", "Sports", "ipfs://second-hash", resolutionTime + 1 days);

        assertEq(factory.getMarketCount(), 2);

        uint256[] memory markets = factory.getAllMarkets();
        assertEq(markets.length, 2);
    }

    // ============ Get Market Tests ============

    function test_GetMarket() public asUser(ALICE) {
        (uint256 marketId,) = factory.createMarket(QUESTION, CATEGORY, METADATA_URI, resolutionTime);

        IMarketFactory.MarketInfo memory info = factory.getMarket(marketId);
        assertEq(info.question, QUESTION);
        assertEq(info.category, CATEGORY);
        assertEq(info.metadataUri, METADATA_URI);
        assertEq(info.creator, ALICE);
        assertEq(info.resolutionTime, resolutionTime);
        assertFalse(info.resolved);
    }

    function test_GetMarket_RevertsOnInvalidId() public {
        vm.expectRevert(IMarketFactory.MarketNotFound.selector);
        factory.getMarket(999);
    }

    function test_GetMarketsByCreator() public {
        vm.prank(ALICE);
        factory.createMarket(QUESTION, CATEGORY, METADATA_URI, resolutionTime);

        vm.prank(BOB);
        factory.createMarket("Bob's question?", CATEGORY, "ipfs://bob-hash", resolutionTime);

        vm.prank(ALICE);
        factory.createMarket("Alice's second?", CATEGORY, "ipfs://alice2-hash", resolutionTime);

        uint256[] memory aliceMarkets = factory.getMarketsByCreator(ALICE);
        uint256[] memory bobMarkets = factory.getMarketsByCreator(BOB);

        assertEq(aliceMarkets.length, 2);
        assertEq(bobMarkets.length, 1);
    }

    // ============ Resolve Market Tests ============

    function test_ResolveMarket() public {
        vm.prank(ALICE);
        (uint256 marketId, address market) = factory.createMarket(QUESTION, CATEGORY, METADATA_URI, resolutionTime);

        vm.prank(DEPLOYER);
        factory.resolveMarket(marketId, 1);

        IMarketFactory.MarketInfo memory info = factory.getMarket(marketId);
        assertTrue(info.resolved);
        assertEq(info.winningOutcome, 1);

        // Check that the PredictionMarket is also resolved
        assertTrue(PredictionMarket(payable(market)).resolved());
    }

    function test_ResolveMarket_EmitsEvent() public {
        vm.prank(ALICE);
        (uint256 marketId, address market) = factory.createMarket(QUESTION, CATEGORY, METADATA_URI, resolutionTime);

        vm.expectEmit(true, true, true, true);
        emit IMarketFactory.MarketResolved(marketId, market, 1);

        vm.prank(DEPLOYER);
        factory.resolveMarket(marketId, 1);
    }

    function test_ResolveMarket_RevertsOnNonOwner() public asUser(ALICE) {
        (uint256 marketId,) = factory.createMarket(QUESTION, CATEGORY, METADATA_URI, resolutionTime);

        vm.expectRevert();
        factory.resolveMarket(marketId, 1);
    }

    function test_ResolveMarket_RevertsOnAlreadyResolved() public {
        vm.prank(ALICE);
        (uint256 marketId,) = factory.createMarket(QUESTION, CATEGORY, METADATA_URI, resolutionTime);

        vm.startPrank(DEPLOYER);
        factory.resolveMarket(marketId, 1);

        vm.expectRevert(IMarketFactory.MarketAlreadyResolved.selector);
        factory.resolveMarket(marketId, 0);
        vm.stopPrank();
    }

    function test_ResolveMarket_RevertsOnInvalidMarket() public asUser(DEPLOYER) {
        vm.expectRevert(IMarketFactory.MarketNotFound.selector);
        factory.resolveMarket(999, 1);
    }
}
