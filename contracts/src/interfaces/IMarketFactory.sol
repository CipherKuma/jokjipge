// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IMarketFactory
/// @notice Interface for the Prediction Market Factory contract
/// @dev Creates and manages prediction markets
interface IMarketFactory {
    // ============ Events ============

    /// @notice Emitted when a new prediction market is created
    /// @param marketId The unique identifier for the market
    /// @param market The address of the created prediction market contract
    /// @param creator The address that created the market
    /// @param question The market question
    /// @param category The market category
    /// @param resolutionTime The timestamp when the market can be resolved
    /// @param metadataUri IPFS URI for extended metadata (images, descriptions)
    event MarketCreated(
        uint256 indexed marketId,
        address indexed market,
        address indexed creator,
        string question,
        string category,
        uint256 resolutionTime,
        string metadataUri
    );

    /// @notice Emitted when a market is resolved
    /// @param marketId The unique identifier for the market
    /// @param market The address of the resolved market
    /// @param winningOutcome The winning outcome index
    event MarketResolved(
        uint256 indexed marketId,
        address indexed market,
        uint8 winningOutcome
    );

    // ============ Errors ============

    /// @notice Thrown when market does not exist
    error MarketNotFound();

    /// @notice Thrown when market is already resolved
    error MarketAlreadyResolved();

    /// @notice Thrown when resolution time is in the past
    error InvalidResolutionTime();

    /// @notice Thrown when question is empty
    error EmptyQuestion();

    /// @notice Thrown when caller is not authorized
    error Unauthorized();

    // ============ Structs ============

    /// @notice Market metadata stored in factory
    struct MarketInfo {
        address marketAddress;
        address creator;
        string question;
        string category;
        string metadataUri;
        uint256 resolutionTime;
        bool resolved;
        uint8 winningOutcome;
    }

    // ============ Functions ============

    /// @notice Create a new binary prediction market
    /// @param question The market question
    /// @param category The market category
    /// @param metadataUri IPFS URI for extended metadata (images, descriptions)
    /// @param resolutionTime The timestamp when the market can be resolved
    /// @return marketId The unique identifier for the created market
    /// @return market The address of the created market contract
    function createMarket(
        string calldata question,
        string calldata category,
        string calldata metadataUri,
        uint256 resolutionTime
    ) external returns (uint256 marketId, address market);

    /// @notice Get market info by ID
    /// @param marketId The unique identifier for the market
    /// @return info The market information
    function getMarket(uint256 marketId) external view returns (MarketInfo memory info);

    /// @notice Get all market IDs
    /// @return marketIds Array of all market IDs
    function getAllMarkets() external view returns (uint256[] memory marketIds);

    /// @notice Get markets created by a specific address
    /// @param creator The address to query
    /// @return marketIds Array of market IDs created by the address
    function getMarketsByCreator(address creator) external view returns (uint256[] memory marketIds);

    /// @notice Resolve a market with the winning outcome
    /// @param marketId The unique identifier for the market
    /// @param winningOutcome The winning outcome (0 = No, 1 = Yes)
    function resolveMarket(uint256 marketId, uint8 winningOutcome) external;

    /// @notice Get the total number of markets created
    /// @return count The total number of markets
    function getMarketCount() external view returns (uint256 count);
}
