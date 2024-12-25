// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IPredictionMarket
/// @notice Interface for individual prediction market contracts
/// @dev Handles betting, odds calculation, and winnings distribution
interface IPredictionMarket {
    // ============ Events ============

    /// @notice Emitted when a bet is placed
    /// @param bettor The address placing the bet
    /// @param outcome The outcome being bet on (0 = No, 1 = Yes)
    /// @param amount The amount of VERY tokens bet
    /// @param shares The number of shares received
    event BetPlaced(
        address indexed bettor,
        uint8 indexed outcome,
        uint256 amount,
        uint256 shares
    );

    /// @notice Emitted when winnings are claimed
    /// @param claimer The address claiming winnings
    /// @param amount The amount of VERY tokens claimed
    event Claimed(address indexed claimer, uint256 amount);

    /// @notice Emitted when the market is resolved
    /// @param winningOutcome The winning outcome (0 = No, 1 = Yes)
    /// @param totalPayout The total amount to be paid out
    event MarketResolved(uint8 indexed winningOutcome, uint256 totalPayout);

    // ============ Errors ============

    /// @notice Thrown when market is already resolved
    error MarketAlreadyResolved();

    /// @notice Thrown when market is not yet resolved
    error MarketNotResolved();

    /// @notice Thrown when betting period has ended
    error BettingClosed();

    /// @notice Thrown when bet amount is zero
    error ZeroBetAmount();

    /// @notice Thrown when invalid outcome is specified
    error InvalidOutcome();

    /// @notice Thrown when user has no winnings to claim
    error NothingToClaim();

    /// @notice Thrown when user has already claimed
    error AlreadyClaimed();

    /// @notice Thrown when caller is not the factory
    error OnlyFactory();

    /// @notice Thrown when position limit is exceeded
    error PositionLimitExceeded();

    /// @notice Thrown when transfer fails
    error TransferFailed();

    // ============ Structs ============

    /// @notice Market information
    struct MarketInfo {
        string question;
        string category;
        uint256 resolutionTime;
        bool resolved;
        uint8 winningOutcome;
        uint256 totalYesShares;
        uint256 totalNoShares;
        uint256 totalPool;
    }

    /// @notice User position in the market
    struct Position {
        uint256 yesShares;
        uint256 noShares;
        bool claimed;
    }

    // ============ Functions ============

    /// @notice Place a bet on an outcome
    /// @param outcome The outcome to bet on (0 = No, 1 = Yes)
    function placeBet(uint8 outcome) external payable;

    /// @notice Claim winnings after market resolution
    function claimWinnings() external;

    /// @notice Get current odds for each outcome
    /// @return yesOdds The odds for Yes outcome (scaled by 1e18)
    /// @return noOdds The odds for No outcome (scaled by 1e18)
    function getOdds() external view returns (uint256 yesOdds, uint256 noOdds);

    /// @notice Get total bets for each outcome
    /// @return yesTotal Total shares for Yes outcome
    /// @return noTotal Total shares for No outcome
    function getTotalBets() external view returns (uint256 yesTotal, uint256 noTotal);

    /// @notice Get user's position in the market
    /// @param user The address to query
    /// @return position The user's position
    function getPosition(address user) external view returns (Position memory position);

    /// @notice Get market information
    /// @return info The market information
    function getMarketInfo() external view returns (MarketInfo memory info);

    /// @notice Calculate potential shares for a bet amount
    /// @param outcome The outcome to bet on (0 = No, 1 = Yes)
    /// @param amount The bet amount
    /// @return shares The number of shares that would be received
    function calculateShares(uint8 outcome, uint256 amount) external view returns (uint256 shares);

    /// @notice Calculate potential winnings for a user
    /// @param user The address to calculate winnings for
    /// @return winnings The potential winnings (0 if market not resolved or lost)
    function calculateWinnings(address user) external view returns (uint256 winnings);

    /// @notice Resolve the market (only callable by factory)
    /// @param winningOutcome The winning outcome (0 = No, 1 = Yes)
    function resolve(uint8 winningOutcome) external;
}
