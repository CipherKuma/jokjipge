// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseTest} from "../utils/BaseTest.sol";
import {MarketFactory} from "../../src/MarketFactory.sol";
import {PredictionMarket} from "../../src/PredictionMarket.sol";
import {IPredictionMarket} from "../../src/interfaces/IPredictionMarket.sol";

/// @title PredictionMarketTest
/// @notice Tests for PredictionMarket contract
contract PredictionMarketTest is BaseTest {
    MarketFactory public factory;
    PredictionMarket public market;

    string constant QUESTION = "Will ETH reach $10,000?";
    string constant CATEGORY = "Crypto";
    string constant METADATA_URI = "ipfs://test-metadata-hash";
    uint256 resolutionTime;

    function setUp() public override {
        super.setUp();
        resolutionTime = block.timestamp + 30 days;

        vm.prank(DEPLOYER);
        factory = new MarketFactory();

        vm.prank(ALICE);
        (, address marketAddr) = factory.createMarket(QUESTION, CATEGORY, METADATA_URI, resolutionTime);
        market = PredictionMarket(payable(marketAddr));
    }

    // ============ Place Bet Tests ============

    function test_PlaceBet_Yes() public asUser(ALICE) {
        uint256 betAmount = 1 ether;
        market.placeBet{value: betAmount}(1);

        IPredictionMarket.Position memory pos = market.getPosition(ALICE);
        assertTrue(pos.yesShares > 0);
        assertEq(pos.noShares, 0);
        assertEq(market.totalPool(), betAmount);
    }

    function test_PlaceBet_No() public asUser(BOB) {
        uint256 betAmount = 2 ether;
        market.placeBet{value: betAmount}(0);

        IPredictionMarket.Position memory pos = market.getPosition(BOB);
        assertEq(pos.yesShares, 0);
        assertTrue(pos.noShares > 0);
    }

    function test_PlaceBet_EmitsEvent() public asUser(ALICE) {
        uint256 betAmount = 1 ether;
        uint256 expectedShares = market.calculateShares(1, betAmount);

        vm.expectEmit(true, true, true, true);
        emit IPredictionMarket.BetPlaced(ALICE, 1, betAmount, expectedShares);

        market.placeBet{value: betAmount}(1);
    }

    function test_PlaceBet_RevertsOnZeroAmount() public asUser(ALICE) {
        vm.expectRevert(IPredictionMarket.ZeroBetAmount.selector);
        market.placeBet{value: 0}(1);
    }

    function test_PlaceBet_RevertsOnInvalidOutcome() public asUser(ALICE) {
        vm.expectRevert(IPredictionMarket.InvalidOutcome.selector);
        market.placeBet{value: 1 ether}(2);
    }

    function test_PlaceBet_RevertsAfterResolutionTime() public asUser(ALICE) {
        vm.warp(resolutionTime + 1);
        vm.expectRevert(IPredictionMarket.BettingClosed.selector);
        market.placeBet{value: 1 ether}(1);
    }

    function test_PlaceBet_RevertsAfterResolved() public {
        vm.prank(DEPLOYER);
        factory.resolveMarket(0, 1);

        vm.prank(ALICE);
        vm.expectRevert(IPredictionMarket.MarketAlreadyResolved.selector);
        market.placeBet{value: 1 ether}(1);
    }

    function test_PlaceBet_RevertsOnPositionLimit() public {
        uint256 maxPosition = market.MAX_POSITION();

        // Give ALICE more funds for this test
        vm.deal(ALICE, 200 ether);

        vm.startPrank(ALICE);
        // First bet at max position should work
        market.placeBet{value: maxPosition}(1);

        // Additional bet should fail due to position limit
        vm.expectRevert(IPredictionMarket.PositionLimitExceeded.selector);
        market.placeBet{value: 1 ether}(1);
        vm.stopPrank();
    }

    // ============ Odds Tests ============

    function test_GetOdds_Initial() public view {
        (uint256 yesOdds, uint256 noOdds) = market.getOdds();
        // Initial odds should be 50/50
        assertEq(yesOdds, 5e17); // 0.5
        assertEq(noOdds, 5e17);
    }

    function test_GetOdds_AfterBets() public {
        vm.prank(ALICE);
        market.placeBet{value: 10 ether}(1); // Bet on Yes

        (uint256 yesOdds, uint256 noOdds) = market.getOdds();
        // Yes odds should decrease (more shares = lower payout)
        assertTrue(yesOdds < 5e17);
        assertTrue(noOdds > 5e17);
    }

    // ============ Claim Winnings Tests ============

    function test_ClaimWinnings() public {
        // Alice bets on Yes
        vm.prank(ALICE);
        market.placeBet{value: 5 ether}(1);

        // Bob bets on No
        vm.prank(BOB);
        market.placeBet{value: 5 ether}(0);

        // Resolve market - Yes wins
        vm.prank(DEPLOYER);
        factory.resolveMarket(0, 1);

        // Alice claims winnings
        uint256 aliceBalanceBefore = ALICE.balance;
        vm.prank(ALICE);
        market.claimWinnings();

        assertTrue(ALICE.balance > aliceBalanceBefore);
    }

    function test_ClaimWinnings_EmitsEvent() public {
        vm.prank(ALICE);
        market.placeBet{value: 5 ether}(1);

        vm.prank(DEPLOYER);
        factory.resolveMarket(0, 1);

        uint256 expectedWinnings = market.calculateWinnings(ALICE);

        vm.expectEmit(true, true, true, true);
        emit IPredictionMarket.Claimed(ALICE, expectedWinnings);

        vm.prank(ALICE);
        market.claimWinnings();
    }

    function test_ClaimWinnings_RevertsBeforeResolution() public {
        vm.prank(ALICE);
        market.placeBet{value: 1 ether}(1);

        vm.prank(ALICE);
        vm.expectRevert(IPredictionMarket.MarketNotResolved.selector);
        market.claimWinnings();
    }

    function test_ClaimWinnings_RevertsOnDoubleClaim() public {
        vm.prank(ALICE);
        market.placeBet{value: 1 ether}(1);

        vm.prank(DEPLOYER);
        factory.resolveMarket(0, 1);

        vm.startPrank(ALICE);
        market.claimWinnings();

        vm.expectRevert(IPredictionMarket.AlreadyClaimed.selector);
        market.claimWinnings();
        vm.stopPrank();
    }

    function test_ClaimWinnings_RevertsOnLosingBet() public {
        vm.prank(ALICE);
        market.placeBet{value: 1 ether}(1); // Bet on Yes

        vm.prank(DEPLOYER);
        factory.resolveMarket(0, 0); // No wins

        vm.prank(ALICE);
        vm.expectRevert(IPredictionMarket.NothingToClaim.selector);
        market.claimWinnings();
    }

    // ============ Market Info Tests ============

    function test_GetMarketInfo() public view {
        IPredictionMarket.MarketInfo memory info = market.getMarketInfo();

        assertEq(info.question, QUESTION);
        assertEq(info.category, CATEGORY);
        assertEq(info.resolutionTime, resolutionTime);
        assertFalse(info.resolved);
    }

    function test_GetTotalBets() public {
        vm.prank(ALICE);
        market.placeBet{value: 3 ether}(1);

        vm.prank(BOB);
        market.placeBet{value: 2 ether}(0);

        (uint256 yesTotal, uint256 noTotal) = market.getTotalBets();
        assertTrue(yesTotal > 0);
        assertTrue(noTotal > 0);
    }

    // ============ Resolve Tests ============

    function test_Resolve_OnlyFactory() public asUser(ALICE) {
        vm.expectRevert(IPredictionMarket.OnlyFactory.selector);
        market.resolve(1);
    }

    function test_Resolve_EmitsEvent() public {
        vm.prank(ALICE);
        market.placeBet{value: 1 ether}(1);

        vm.expectEmit(true, true, true, true);
        emit IPredictionMarket.MarketResolved(1, market.totalPool());

        vm.prank(DEPLOYER);
        factory.resolveMarket(0, 1);
    }
}
