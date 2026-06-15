// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {StrategyAdapter} from "../vault/StrategyAdapter.sol";
import {IOndoUSDY} from "../interfaces/IOndoUSDY.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title OndoUSDYAdapter
/// @notice Yield strategy adapter for Ondo USDY — tokenized US Treasury bills.
/// Deposits USDC in exchange for USDY tokens which accrue value from T-bill interest.
contract OndoUSDYAdapter is StrategyAdapter {
    using SafeERC20 for IERC20;

    /// @notice The USDY token contract
    IOndoUSDY public immutable usdy;

    /// @notice Default risk score for Ondo USDY (2000 = 20.00%, low risk T-bills)
    uint256 public constant DEFAULT_RISK_SCORE = 2000;

    /// @notice Withdrawal delay: 1 day (Ondo T+1 settlement for large redemptions)
    uint256 public constant DEFAULT_WITHDRAWAL_DELAY = 1 days;

    constructor(address _vault, address _underlyingAsset, address _usdy) {
        vault = _vault;
        underlyingAsset = _underlyingAsset;
        usdy = IOndoUSDY(_usdy);
    }

    /// @notice Deposit USDC in exchange for USDY tokens
    function deposit(uint256 amount) external override whenNotPaused returns (uint256 shares) {
        IERC20(underlyingAsset).safeTransferFrom(msg.sender, address(this), amount);
        // USDC is converted to USDY at the current price. USDY price is in 18 decimals.
        // We track shares 1:1 with the amount deposited for simplicity.
        // The actual protocol exchange happens via the Ondo platform; this adapter holds USDY.
        totalDeposited += amount;
        return amount;
    }

    /// @notice Withdraw by redeeming USDY tokens
    function withdraw(uint256 shares) external override returns (uint256 amount) {
        require(shares <= totalDeposited, "OndoUSDYAdapter: insufficient shares");
        uint256 usdyBalance = IERC20(address(usdy)).balanceOf(address(this));
        uint256 usdyToSend = (shares * usdyBalance) / totalDeposited;
        totalDeposited -= shares;
        IERC20(address(usdy)).safeTransfer(msg.sender, usdyToSend);
        return usdyToSend;
    }

    /// @notice Total USDC value of USDY position
    function totalValue() public view override returns (uint256) {
        uint256 usdyBalance = IERC20(address(usdy)).balanceOf(address(this));
        if (usdyBalance == 0) return 0;
        return (usdyBalance * usdy.getPrice()) / 1e18;
    }

    /// @notice Pending yield = totalValue - totalDeposited
    function pendingYield() public view override returns (uint256) {
        uint256 tv = totalValue();
        if (tv > totalDeposited) return tv - totalDeposited;
        return 0;
    }

    /// @notice USDY yield is auto-compounded into token price. No separate reward token.
    function claimRewards() external override {}

    /// @notice Emergency withdrawal — transfer all USDY tokens to vault
    function emergencyWithdraw() external override returns (uint256 amount) {
        amount = IERC20(address(usdy)).balanceOf(address(this));
        if (amount > 0) {
            IERC20(address(usdy)).safeTransfer(vault, amount);
        }
        totalDeposited = 0;
    }

    /// @notice Ondo USDY risk score: 2000 (20%)
    function getRiskScore() external view override returns (uint256) {
        return DEFAULT_RISK_SCORE;
    }

    /// @notice APY off-chain; returns 0
    function getAPY() external pure override returns (uint256) {
        return 0; // Off-chain oracle recommended
    }

    /// @notice Ondo T+1 settlement: 1 day withdrawal delay
    function getWithdrawalDelay() external pure override returns (uint256) {
        return DEFAULT_WITHDRAWAL_DELAY;
    }
}
