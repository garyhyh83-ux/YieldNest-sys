// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Mock Ethena staking contract for testing EthenaAdapter.
contract MockEthenaStaking {
    using SafeERC20 for IERC20;

    address private _asset;
    uint256 private _totalAssets;
    uint256 private _totalShares = 1e6; // Virtual offset
    uint256 private _apr = 800; // 8% APR default
    mapping(address => uint256) private _shares;

    event Staked(address indexed user, uint256 amount, uint256 shares);
    event Unstaked(address indexed user, uint256 shares, uint256 amount);

    constructor(address asset_) {
        _asset = asset_;
        _totalAssets = 1e6;
    }

    function stake(uint256 amount, address receiver) external returns (uint256 shares) {
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), amount);
        shares = convertToShares(amount);
        _totalAssets += amount;
        _totalShares += shares;
        _shares[receiver] += shares;
        emit Staked(receiver, amount, shares);
    }

    function unstake(uint256 shares, address receiver, address owner) external returns (uint256 amount) {
        require(_shares[owner] >= shares, "insufficient shares");
        amount = convertToAssets(shares);
        _shares[owner] -= shares;
        _totalShares -= shares;
        _totalAssets -= amount;
        IERC20(_asset).safeTransfer(receiver, amount);
        emit Unstaked(owner, shares, amount);
    }

    function totalAssets() external view returns (uint256) {
        return _totalAssets;
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        return (shares * _totalAssets) / _totalShares;
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        return (assets * _totalShares) / _totalAssets;
    }

    function getAPR() external view returns (uint256) {
        return _apr;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _shares[owner];
    }

    function setAPR(uint256 apr) external {
        _apr = apr;
    }
}
