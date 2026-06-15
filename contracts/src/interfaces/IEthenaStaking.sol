// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

/// @notice Minimal Ethena staking interface.
/// Ethena's USDe is a synthetic dollar. Staking USDe earns yield from
/// the delta-neutral basis trade (staked ETH + short ETH futures).
interface IEthenaStaking {
    /// @notice Stake USDe tokens to receive staking shares
    function stake(uint256 amount, address receiver) external returns (uint256 shares);

    /// @notice Unstake shares back to USDe
    function unstake(uint256 shares, address receiver, address owner) external returns (uint256 amount);

    /// @notice Total staked assets (USDe)
    function totalAssets() external view returns (uint256);

    /// @notice Convert shares to assets
    function convertToAssets(uint256 shares) external view returns (uint256);

    /// @notice Convert assets to shares
    function convertToShares(uint256 assets) external view returns (uint256);

    /// @notice Current staking APR in basis points (e.g., 800 = 8.00%)
    function getAPR() external view returns (uint256);
}
