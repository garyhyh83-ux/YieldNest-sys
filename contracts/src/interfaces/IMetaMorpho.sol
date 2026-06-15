// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

/// @notice Minimal MetaMorpho (ERC-4626) Vault interface.
/// MetaMorpho vaults wrap Morpho Blue markets as standard ERC-4626 vaults.
interface IMetaMorpho {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function totalAssets() external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256);
    function asset() external view returns (address);
}
