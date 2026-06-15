// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Mock MetaMorpho (ERC-4626) vault for testing MorphoAdapter.
contract MockMorphoVault {
    using SafeERC20 for IERC20;

    struct VaultState {
        uint256 totalAssets;
        uint256 totalShares;
        mapping(address => uint256) balances;
    }

    address private _asset;
    VaultState private state;

    constructor(address asset_) {
        _asset = asset_;
        // Start with a virtual 1e6 offset to avoid division by zero
        // and make the remainder negligible for test assertions
        state.totalShares = 1e6;
        state.totalAssets = 1e6;
    }

    function asset() external view returns (address) {
        return _asset;
    }

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), assets);
        shares = convertToShares(assets);
        state.totalAssets += assets;
        state.totalShares += shares;
        state.balances[receiver] += shares;
    }

    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets) {
        require(state.balances[owner] >= shares, "MockMorpho: insufficient shares");
        assets = convertToAssets(shares);
        state.balances[owner] -= shares;
        state.totalShares -= shares;
        state.totalAssets -= assets;
        IERC20(_asset).safeTransfer(receiver, assets);
    }

    function totalAssets() external view returns (uint256) {
        return state.totalAssets;
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        return (shares * state.totalAssets) / state.totalShares;
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        return (assets * state.totalShares) / state.totalAssets;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return state.balances[owner];
    }
}
