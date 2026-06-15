// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

/// @notice Minimal Ondo USDY token interface.
/// USDY is a tokenized US Treasury bill fund.
/// USDC is exchanged for USDY tokens; USDY tokens accrue value.
interface IOndoUSDY {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    /// @notice Get the current USDY price in USDC (18 decimals)
    /// The price represents how much USDC 1 USDY token is worth.
    function getPrice() external view returns (uint256);
}
