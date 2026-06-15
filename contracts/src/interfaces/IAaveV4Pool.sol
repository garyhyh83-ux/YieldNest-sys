// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

/// @notice Minimal Aave V4 Pool interface for supply/withdraw operations.
/// Only the subset of IAaveV4Pool needed by YieldNest adapters.
interface IAaveV4Pool {
    /// @notice Supplies an asset into the Aave pool
    /// @param asset The address of the asset to supply
    /// @param amount The amount to supply
    /// @param onBehalfOf The address that will receive the aTokens
    /// @param referralCode Referral code (0 for none)
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;

    /// @notice Withdraws an asset from the Aave pool
    /// @param asset The address of the asset to withdraw
    /// @param amount The amount to withdraw
    /// @param to The address that will receive the underlying asset
    /// @return The final amount withdrawn
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);

    /// @notice Gets the reserve data for an asset
    /// @param asset The address of the asset
    /// @return configuration Reserve configuration bitmap
    /// @return liquidityIndex The liquidity index
    /// @return currentLiquidityRate Current supply rate in ray (1e27)
    /// @return variableBorrowIndex Variable borrow index
    /// @return currentVariableBorrowRate Current variable borrow rate in ray
    /// @return currentStableBorrowRate Current stable borrow rate in ray
    /// @return lastUpdateTimestamp Timestamp of last update
    /// @return id Reserve id
    /// @return aTokenAddress Address of the aToken
    /// @return stableDebtTokenAddress Address of the stable debt token
    /// @return variableDebtTokenAddress Address of the variable debt token
    /// @return interestRateStrategyAddress Address of the interest rate strategy
    /// @return accruedToTreasury Accrued to treasury
    /// @return unbacked Unbacked amount
    /// @return isolationModeTotalDebt Total debt in isolation mode
    /// @return virtualAccounting Virtual accounting
    function getReserveData(
        address asset
    )
        external
        view
        returns (
            uint256 configuration,
            uint256 liquidityIndex,
            uint256 currentLiquidityRate,
            uint256 variableBorrowIndex,
            uint256 currentVariableBorrowRate,
            uint256 currentStableBorrowRate,
            uint256 lastUpdateTimestamp,
            uint256 id,
            address aTokenAddress,
            address stableDebtTokenAddress,
            address variableDebtTokenAddress,
            address interestRateStrategyAddress,
            uint256 accruedToTreasury,
            uint256 unbacked,
            uint256 isolationModeTotalDebt,
            uint256 virtualAccounting
        );
}
