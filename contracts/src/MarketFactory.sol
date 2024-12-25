// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/access/Ownable.sol";
import {IMarketFactory} from "./interfaces/IMarketFactory.sol";
import {PredictionMarket} from "./PredictionMarket.sol";

/// @title MarketFactory
/// @notice Factory contract for creating and managing prediction markets
/// @dev Creates PredictionMarket contracts and tracks all markets
contract MarketFactory is IMarketFactory, Ownable {
    // ============ Storage ============

    /// @notice Counter for market IDs
    uint256 private _nextMarketId;

    /// @notice Mapping of market ID to market info
    mapping(uint256 => MarketInfo) private _markets;

    /// @notice Mapping of creator address to their market IDs
    mapping(address => uint256[]) private _creatorMarkets;

    /// @notice Array of all market IDs
    uint256[] private _allMarketIds;

    // ============ Constructor ============

    /// @notice Initialize the factory with the deployer as owner
    constructor() Ownable(msg.sender) {}

    // ============ External Functions ============

    /// @inheritdoc IMarketFactory
    function createMarket(
        string calldata question,
        string calldata category,
        string calldata metadataUri,
        uint256 resolutionTime
    ) external returns (uint256 marketId, address market) {
        if (bytes(question).length == 0) revert EmptyQuestion();
        if (resolutionTime <= block.timestamp) revert InvalidResolutionTime();

        marketId = _nextMarketId++;

        // Deploy new PredictionMarket contract
        PredictionMarket newMarket = new PredictionMarket(
            address(this),
            question,
            category,
            resolutionTime
        );
        market = address(newMarket);

        // Store market info
        _markets[marketId] = MarketInfo({
            marketAddress: market,
            creator: msg.sender,
            question: question,
            category: category,
            metadataUri: metadataUri,
            resolutionTime: resolutionTime,
            resolved: false,
            winningOutcome: 0
        });

        // Track market by creator
        _creatorMarkets[msg.sender].push(marketId);
        _allMarketIds.push(marketId);

        emit MarketCreated(
            marketId,
            market,
            msg.sender,
            question,
            category,
            resolutionTime,
            metadataUri
        );
    }

    /// @inheritdoc IMarketFactory
    function getMarket(uint256 marketId) external view returns (MarketInfo memory info) {
        info = _markets[marketId];
        if (info.marketAddress == address(0)) revert MarketNotFound();
    }

    /// @inheritdoc IMarketFactory
    function getAllMarkets() external view returns (uint256[] memory marketIds) {
        return _allMarketIds;
    }

    /// @inheritdoc IMarketFactory
    function getMarketsByCreator(address creator) external view returns (uint256[] memory marketIds) {
        return _creatorMarkets[creator];
    }

    /// @inheritdoc IMarketFactory
    function resolveMarket(uint256 marketId, uint8 winningOutcome) external onlyOwner {
        MarketInfo storage info = _markets[marketId];
        if (info.marketAddress == address(0)) revert MarketNotFound();
        if (info.resolved) revert MarketAlreadyResolved();
        if (winningOutcome > 1) revert();

        info.resolved = true;
        info.winningOutcome = winningOutcome;

        // Resolve the prediction market contract
        PredictionMarket(payable(info.marketAddress)).resolve(winningOutcome);

        emit MarketResolved(marketId, info.marketAddress, winningOutcome);
    }

    /// @inheritdoc IMarketFactory
    function getMarketCount() external view returns (uint256 count) {
        return _nextMarketId;
    }
}
