// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {StrategyAdapter} from "../vault/StrategyAdapter.sol";
import {IMetaMorpho} from "../interfaces/IMetaMorpho.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title MorphoAdapter
/// @notice Yield strategy adapter for Morpho Blue via MetaMorpho vault wrapper (ERC-4626).
/// Deposits USDC into a MetaMorpho vault that allocates to Morpho Blue lending markets.
contract MorphoAdapter is StrategyAdapter {
    using SafeERC20 for IERC20;

    /// @notice The MetaMorpho vault contract (ERC-4626 wrapper)
    IMetaMorpho public immutable morphoVault;

    /// @notice Default risk score for Morpho (2500 = 25.00%, higher risk due to isolated markets)
    uint256 public constant DEFAULT_RISK_SCORE = 2500;

    constructor(address _vault, address _underlyingAsset, address _morphoVault) {
        vault = _vault;
        underlyingAsset = _underlyingAsset;
        morphoVault = IMetaMorpho(_morphoVault);
    }

    /// @notice Deposit USDC into the MetaMorpho vault
    /// @param amount Amount of USDC to deposit
    /// @return shares Number of vault shares received
    function deposit(uint256 amount) external override whenNotPaused returns (uint256 shares) {
        IERC20(underlyingAsset).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(underlyingAsset).forceApprove(address(morphoVault), amount);
        shares = morphoVault.deposit(amount, address(this));
        totalDeposited += amount;
    }

    /// @notice Withdraw USDC from the MetaMorpho vault
    /// @param shares Number of adapter shares to redeem (approximated to USDC)
    /// @return amount Amount of USDC received
    function withdraw(uint256 shares) external override returns (uint256 amount) {
        require(shares <= totalDeposited, "MorphoAdapter: insufficient shares");
        uint256 vaultShares = morphoVault.convertToShares(shares);
        totalDeposited -= shares;
        // redeem vault shares for USDC, send to msg.sender (the vault)
        amount = morphoVault.redeem(vaultShares, msg.sender, address(this));
    }

    /// @notice Total USDC value of this adapter's vault position
    function totalValue() public view override returns (uint256) {
        uint256 vaultShares = IERC20(address(morphoVault)).balanceOf(address(this));
        if (vaultShares == 0) return 0;
        return morphoVault.convertToAssets(vaultShares);
    }

    /// @notice Pending yield = totalValue - totalDeposited
    function pendingYield() public view override returns (uint256) {
        uint256 tv = totalValue();
        if (tv > totalDeposited) return tv - totalDeposited;
        return 0;
    }

    /// @notice Claim rewards — MetaMorpho auto-compounds, rewards accumulate as increased vault share value
    function claimRewards() external override {
        // Morpho/MetaMorpho yields auto-compound. No separate harvest step needed.
    }

    /// @notice Emergency withdrawal — redeem all vault shares and send USDC to vault
    function emergencyWithdraw() external override returns (uint256 amount) {
        uint256 vaultShares = IERC20(address(morphoVault)).balanceOf(address(this));
        if (vaultShares > 0) {
            amount = morphoVault.redeem(vaultShares, vault, address(this));
        }
        totalDeposited = 0;
    }

    /// @notice Morpho risk score: 2500 (25%, isolated market risk)
    function getRiskScore() external view override returns (uint256) {
        return DEFAULT_RISK_SCORE;
    }

    /// @notice APY in basis points, estimated from vault performance.
    /// MetaMorpho doesn't expose rate directly; returns 0 for real-time query.
    /// Off-chain oracles should be used for APY display.
    function getAPY() external pure override returns (uint256) {
        return 0; // Off-chain data recommended for MetaMorpho APY
    }

    /// @notice Morpho withdrawals are instant for liquid markets
    function getWithdrawalDelay() external pure override returns (uint256) {
        return 0;
    }
}
