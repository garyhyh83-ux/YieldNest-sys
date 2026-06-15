// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {StrategyAdapter} from "../vault/StrategyAdapter.sol";
import {IEthenaStaking} from "../interfaces/IEthenaStaking.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title EthenaAdapter
/// @notice Yield strategy adapter for Ethena USDe — delta-neutral basis trade yield.
/// Stakes USDe via Ethena's staking contract to earn yield from the basis trade.
contract EthenaAdapter is StrategyAdapter {
    using SafeERC20 for IERC20;

    /// @notice The Ethena staking contract
    IEthenaStaking public immutable staking;

    /// @notice Default risk score for Ethena (5000 = 50.00%, medium risk)
    uint256 public constant DEFAULT_RISK_SCORE = 5000;

    /// @notice Maximum withdrawal delay: up to 7 days (Ethena cooldown)
    uint256 public constant DEFAULT_WITHDRAWAL_DELAY = 7 days;

    constructor(address _vault, address _underlyingAsset, address _staking) {
        vault = _vault;
        underlyingAsset = _underlyingAsset;
        staking = IEthenaStaking(_staking);
    }

    /// @notice Deposit USDC — assumed to be USDe or pre-swapped to USDe.
    /// Stakes into Ethena's staking contract.
    function deposit(uint256 amount) external override whenNotPaused returns (uint256) {
        IERC20(underlyingAsset).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(underlyingAsset).forceApprove(address(staking), amount);
        staking.stake(amount, address(this));
        totalDeposited += amount;
        return amount;
    }

    /// @notice Withdraw by unstaking from Ethena
    function withdraw(uint256 shares) external override returns (uint256 amount) {
        require(shares <= totalDeposited, "EthenaAdapter: insufficient shares");
        totalDeposited -= shares;
        // Convert deposit shares to staking shares
        uint256 vaultShares = IERC20(address(staking)).balanceOf(address(this));
        uint256 stakingShares = (shares * vaultShares) / (totalDeposited + shares);
        amount = staking.unstake(stakingShares, msg.sender, address(this));
    }

    /// @notice Total USDe value of the staked position
    function totalValue() public view override returns (uint256) {
        uint256 vaultShares = IERC20(address(staking)).balanceOf(address(this));
        if (vaultShares == 0) return 0;
        return staking.convertToAssets(vaultShares);
    }

    /// @notice Pending yield = totalValue - totalDeposited
    function pendingYield() public view override returns (uint256) {
        uint256 tv = totalValue();
        if (tv > totalDeposited) return tv - totalDeposited;
        return 0;
    }

    /// @notice Ethena yield auto-compounds into staking share value.
    function claimRewards() external override {}

    /// @notice Emergency withdrawal — unstake all and send to vault
    function emergencyWithdraw() external override returns (uint256 amount) {
        uint256 vaultShares = IERC20(address(staking)).balanceOf(address(this));
        if (vaultShares > 0) {
            amount = staking.unstake(vaultShares, vault, address(this));
        }
        totalDeposited = 0;
    }

    /// @notice Ethena risk score: 5000 (50%)
    function getRiskScore() external view override returns (uint256) {
        return DEFAULT_RISK_SCORE;
    }

    /// @notice Current staking APR from Ethena, in basis points
    function getAPY() external view override returns (uint256) {
        return staking.getAPR();
    }

    /// @notice Ethena withdrawals may have up to 7-day cooldown
    function getWithdrawalDelay() external pure override returns (uint256) {
        return DEFAULT_WITHDRAWAL_DELAY;
    }
}
