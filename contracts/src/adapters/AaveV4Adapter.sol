// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {StrategyAdapter} from "../vault/StrategyAdapter.sol";
import {IAaveV4Pool} from "../interfaces/IAaveV4Pool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title AaveV4Adapter
/// @notice Yield strategy adapter for Aave V4 USDC lending pool.
/// Deposits USDC into Aave V4 to earn supply interest.
contract AaveV4Adapter is StrategyAdapter {
    using SafeERC20 for IERC20;

    /// @notice The Aave V4 Pool contract
    IAaveV4Pool public immutable aavePool;

    /// @notice Default risk score for Aave V4 (1500 = 15.00%)
    uint256 public constant DEFAULT_RISK_SCORE = 1500;

    constructor(address _vault, address _underlyingAsset, address _aavePool) {
        vault = _vault;
        underlyingAsset = _underlyingAsset;
        aavePool = IAaveV4Pool(_aavePool);
    }

    /// @notice Deposit USDC into Aave V4
    function deposit(uint256 amount) external override whenNotPaused returns (uint256 shares) {
        IERC20(underlyingAsset).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(underlyingAsset).forceApprove(address(aavePool), amount);
        aavePool.supply(underlyingAsset, amount, address(this), 0);
        totalDeposited += amount;
        return amount;
    }

    /// @notice Withdraw USDC from Aave V4
    function withdraw(uint256 shares) external override returns (uint256 amount) {
        require(shares <= totalDeposited, "AaveV4Adapter: insufficient shares");
        totalDeposited -= shares;
        amount = aavePool.withdraw(underlyingAsset, shares, msg.sender);
    }

    /// @notice Get the aToken address for the underlying asset
    function _getAToken() internal view returns (address aTokenAddress) {
        (, , , , , , , , aTokenAddress, , , , , , , ) = aavePool.getReserveData(
            underlyingAsset
        );
    }

    /// @notice Total USDC value including accrued interest
    function totalValue() public view override returns (uint256) {
        address aTokenAddress = _getAToken();
        if (aTokenAddress == address(0)) return totalDeposited;
        return IERC20(aTokenAddress).balanceOf(address(this));
    }

    /// @notice Pending yield = totalValue - totalDeposited
    function pendingYield() public view override returns (uint256) {
        uint256 tv = totalValue();
        if (tv > totalDeposited) return tv - totalDeposited;
        return 0;
    }

    /// @notice Claim rewards — Aave V4 interest accrues into aToken value.
    /// No separate reward token to harvest.
    function claimRewards() external override {}

    /// @notice Emergency withdrawal — withdraw all USDC from Aave and send to vault
    function emergencyWithdraw() external override returns (uint256 amount) {
        address aTokenAddress = _getAToken();
        if (aTokenAddress != address(0)) {
            uint256 aTokenBalance = IERC20(aTokenAddress).balanceOf(address(this));
            if (aTokenBalance > 0) {
                amount = aavePool.withdraw(underlyingAsset, aTokenBalance, vault);
            }
        }
        totalDeposited = 0;
    }

    /// @notice Aave V4 risk score: 1500 (15%)
    function getRiskScore() external view override returns (uint256) {
        return DEFAULT_RISK_SCORE;
    }

    /// @notice Current Aave V4 supply APY in basis points
    function getAPY() external view override returns (uint256) {
        (, , uint256 liquidityRate, , , , , , , , , , , , , ) = aavePool.getReserveData(
            underlyingAsset
        );
        return (liquidityRate * 10000) / 1e27;
    }

    /// @notice Aave V4 withdrawals are instant
    function getWithdrawalDelay() external pure override returns (uint256) {
        return 0;
    }
}
