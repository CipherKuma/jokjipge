// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ReentrancyGuard} from "@openzeppelin/utils/ReentrancyGuard.sol";
import {IPredictionMarket} from "./interfaces/IPredictionMarket.sol";

/// @title PredictionMarket
/// @notice Individual prediction market for binary outcomes (Yes/No)
/// @dev Uses constant-product AMM for odds calculation
contract PredictionMarket is IPredictionMarket, ReentrancyGuard {
    // ============ Constants ============

    /// @notice Outcome constants
    uint8 public constant OUTCOME_NO = 0;
    uint8 public constant OUTCOME_YES = 1;

    /// @notice Initial liquidity for each outcome (virtual liquidity)
    uint256 public constant INITIAL_LIQUIDITY = 1000 ether;

    /// @notice Maximum position per user (anti-sybil)
    uint256 public constant MAX_POSITION = 100 ether;

    /// @notice Precision for odds calculation
    uint256 public constant PRECISION = 1e18;

    // ============ Storage ============

    /// @notice Factory address
    address public immutable factory;

    /// @notice Market question
    string public question;

    /// @notice Market category
    string public category;

    /// @notice Resolution timestamp
    uint256 public resolutionTime;

    /// @notice Whether market is resolved
    bool public resolved;

    /// @notice Winning outcome (0 = No, 1 = Yes)
    uint8 public winningOutcome;

    /// @notice Total shares for Yes outcome
    uint256 public totalYesShares;

    /// @notice Total shares for No outcome
    uint256 public totalNoShares;

    /// @notice Total pool (sum of all bets)
    uint256 public totalPool;

    /// @notice User positions mapping
    mapping(address => Position) private _positions;

    // ============ Constructor ============

    /// @notice Initialize the prediction market
    /// @param _factory The factory contract address
    /// @param _question The market question
    /// @param _category The market category
    /// @param _resolutionTime The resolution timestamp
    constructor(
        address _factory,
        string memory _question,
        string memory _category,
        uint256 _resolutionTime
    ) {
        factory = _factory;
        question = _question;
        category = _category;
        resolutionTime = _resolutionTime;

        // Initialize with virtual liquidity for fair odds
        totalYesShares = INITIAL_LIQUIDITY;
        totalNoShares = INITIAL_LIQUIDITY;
    }

    // ============ Modifiers ============

    /// @notice Ensures caller is the factory
    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    // ============ External Functions ============

    /// @inheritdoc IPredictionMarket
    function placeBet(uint8 outcome) external payable nonReentrant {
        if (resolved) revert MarketAlreadyResolved();
        if (block.timestamp >= resolutionTime) revert BettingClosed();
        if (msg.value == 0) revert ZeroBetAmount();
        if (outcome > OUTCOME_YES) revert InvalidOutcome();

        uint256 shares = calculateShares(outcome, msg.value);
        Position storage pos = _positions[msg.sender];

        // Check position limit
        uint256 newPosition = outcome == OUTCOME_YES
            ? pos.yesShares + shares
            : pos.noShares + shares;
        if (newPosition > MAX_POSITION) revert PositionLimitExceeded();

        // Update position
        if (outcome == OUTCOME_YES) {
            pos.yesShares += shares;
            totalYesShares += shares;
        } else {
            pos.noShares += shares;
            totalNoShares += shares;
        }

        totalPool += msg.value;

        emit BetPlaced(msg.sender, outcome, msg.value, shares);
    }

    /// @inheritdoc IPredictionMarket
    function claimWinnings() external nonReentrant {
        if (!resolved) revert MarketNotResolved();

        Position storage pos = _positions[msg.sender];
        if (pos.claimed) revert AlreadyClaimed();

        uint256 winnings = _calculateWinnings(msg.sender);
        if (winnings == 0) revert NothingToClaim();

        pos.claimed = true;

        (bool success,) = payable(msg.sender).call{value: winnings}("");
        if (!success) revert TransferFailed();

        emit Claimed(msg.sender, winnings);
    }

    /// @inheritdoc IPredictionMarket
    function getOdds() external view returns (uint256 yesOdds, uint256 noOdds) {
        uint256 total = totalYesShares + totalNoShares;
        if (total == 0) return (PRECISION / 2, PRECISION / 2);

        // Odds based on share distribution (inverse - more shares = lower odds)
        yesOdds = (totalNoShares * PRECISION) / total;
        noOdds = (totalYesShares * PRECISION) / total;
    }

    /// @inheritdoc IPredictionMarket
    function getTotalBets() external view returns (uint256 yesTotal, uint256 noTotal) {
        // Return shares minus initial virtual liquidity
        yesTotal = totalYesShares > INITIAL_LIQUIDITY ? totalYesShares - INITIAL_LIQUIDITY : 0;
        noTotal = totalNoShares > INITIAL_LIQUIDITY ? totalNoShares - INITIAL_LIQUIDITY : 0;
    }

    /// @inheritdoc IPredictionMarket
    function getPosition(address user) external view returns (Position memory position) {
        return _positions[user];
    }

    /// @inheritdoc IPredictionMarket
    function getMarketInfo() external view returns (MarketInfo memory info) {
        return MarketInfo({
            question: question,
            category: category,
            resolutionTime: resolutionTime,
            resolved: resolved,
            winningOutcome: winningOutcome,
            totalYesShares: totalYesShares,
            totalNoShares: totalNoShares,
            totalPool: totalPool
        });
    }

    /// @inheritdoc IPredictionMarket
    function calculateShares(uint8 outcome, uint256 amount) public view returns (uint256 shares) {
        // Constant product AMM: x * y = k
        // For buying outcome: shares = currentShares - (k / (otherShares + amount))
        // Simplified: shares proportional to bet amount with slight discount for large bets
        uint256 currentShares = outcome == OUTCOME_YES ? totalYesShares : totalNoShares;
        uint256 otherShares = outcome == OUTCOME_YES ? totalNoShares : totalYesShares;

        // Simple linear share calculation with AMM-style pricing
        // shares = amount * otherShares / (currentShares + amount)
        shares = (amount * otherShares) / (currentShares + amount);

        // Minimum 1:1 ratio to prevent dust
        if (shares < amount) shares = amount;
    }

    /// @inheritdoc IPredictionMarket
    function calculateWinnings(address user) external view returns (uint256 winnings) {
        return _calculateWinnings(user);
    }

    /// @inheritdoc IPredictionMarket
    function resolve(uint8 _winningOutcome) external onlyFactory {
        if (resolved) revert MarketAlreadyResolved();
        if (_winningOutcome > OUTCOME_YES) revert InvalidOutcome();

        resolved = true;
        winningOutcome = _winningOutcome;

        emit MarketResolved(_winningOutcome, totalPool);
    }

    // ============ Internal Functions ============

    /// @notice Calculate winnings for a user
    /// @param user The user address
    /// @return winnings The calculated winnings
    function _calculateWinnings(address user) internal view returns (uint256 winnings) {
        if (!resolved) return 0;

        Position storage pos = _positions[user];
        if (pos.claimed) return 0;

        uint256 userShares = winningOutcome == OUTCOME_YES ? pos.yesShares : pos.noShares;
        if (userShares == 0) return 0;

        // Calculate winning shares (excluding virtual liquidity)
        uint256 totalWinningShares = winningOutcome == OUTCOME_YES
            ? totalYesShares - INITIAL_LIQUIDITY
            : totalNoShares - INITIAL_LIQUIDITY;

        if (totalWinningShares == 0) return 0;

        // Proportional share of the pool
        winnings = (userShares * totalPool) / totalWinningShares;
    }

    /// @notice Receive function to accept VERY tokens
    receive() external payable {}
}
