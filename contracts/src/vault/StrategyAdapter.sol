// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

/// @title StrategyAdapter
/// @notice Abstract base contract for all yield strategy adapters.
/// Each adapter wraps a specific yield protocol (Aave, Morpho, BUIDL, etc.)
/// and presents a uniform interface to the YieldNestVault.
abstract contract StrategyAdapter {
    /// @notice The YieldNestVault that owns this adapter
    address public vault;

    /// @notice The underlying asset token (e.g. USDC)
    address public underlyingAsset;

    /// @notice Total amount deposited into this strategy via the adapter
    uint256 public totalDeposited;

    /// @notice Whether this strategy is paused (e.g. by EmergencyPause)
    bool public paused;

    /// @notice The pause registry contract
    address public pauseRegistry;

    // ===== Modifiers =====

    modifier onlyVault() {
        require(msg.sender == vault, "StrategyAdapter: caller is not vault");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "StrategyAdapter: paused");
        _;
    }

    // ===== Core Strategy Interface =====

    /// @notice Deposit assets into this strategy
    /// @param amount Amount of underlying asset to deposit
    /// @return shares Number of strategy-specific shares received
    function deposit(
        uint256 amount
    ) external virtual returns (uint256 shares);

    /// @notice Withdraw assets from this strategy
    /// @param shares Number of strategy-specific shares to redeem
    /// @return amount Amount of underlying asset received
    function withdraw(
        uint256 shares
    ) external virtual returns (uint256 amount);

    /// @notice Get the total value locked in this strategy, denominated in underlying asset
    function totalValue() public view virtual returns (uint256);

    /// @notice Get the pending yield that has not yet been harvested
    function pendingYield() public view virtual returns (uint256);

    /// @notice Claim and transfer accumulated rewards to the vault
    function claimRewards() external virtual;

    /// @notice Emergency withdrawal — attempt to recover all funds
    /// @return amount Total amount recovered
    function emergencyWithdraw() external virtual returns (uint256 amount);

    // ===== Risk & Performance =====

    /// @notice Get the risk score of this strategy (0-10000, higher = riskier)
    function getRiskScore() external virtual returns (uint256);

    /// @notice Get the current APY in basis points (e.g. 450 = 4.50%)
    function getAPY() external virtual returns (uint256);

    /// @notice Get the withdrawal delay in seconds (0 = instant)
    function getWithdrawalDelay() external virtual returns (uint256);

    // ===== Admin =====

    /// @notice Set the pause state. Called by EmergencyPause contract
    function setPaused(bool _paused) external {
        require(
            msg.sender == pauseRegistry || msg.sender == vault,
            "StrategyAdapter: unauthorized"
        );
        paused = _paused;
    }

    /// @notice Set the pause registry address
    function setPauseRegistry(address _registry) external {
        require(msg.sender == vault, "StrategyAdapter: only vault");
        pauseRegistry = _registry;
    }

    // Reserve storage gap for upgradeable adapters
    uint256[50] private __gap;
}
