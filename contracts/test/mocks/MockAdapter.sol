// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {StrategyAdapter} from "../../src/vault/StrategyAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockAdapter is StrategyAdapter {
    using SafeERC20 for IERC20;

    uint256 private _totalValue;
    uint256 private _pendingYield;
    uint256 private _apy;
    uint256 private _riskScore;
    uint256 private _withdrawalDelay;

    constructor(
        address _vault,
        address _underlyingAsset,
        uint256 apy,
        uint256 riskScore,
        uint256 withdrawalDelay
    ) {
        vault = _vault;
        underlyingAsset = _underlyingAsset;
        _apy = apy;
        _riskScore = riskScore;
        _withdrawalDelay = withdrawalDelay;
    }

    function deposit(
        uint256 amount
    ) external override whenNotPaused returns (uint256 shares) {
        IERC20(underlyingAsset).safeTransferFrom(msg.sender, address(this), amount);
        totalDeposited += amount;
        _totalValue += amount;
        return amount;
    }

    function withdraw(
        uint256 shares
    ) external override returns (uint256 amount) {
        require(shares <= totalDeposited, "MockAdapter: insufficient");
        totalDeposited -= shares;
        _totalValue -= shares;
        IERC20(underlyingAsset).safeTransfer(msg.sender, shares);
        return shares;
    }

    function totalValue() public view override returns (uint256) {
        return _totalValue;
    }

    function pendingYield() public view override returns (uint256) {
        return _pendingYield;
    }

    function claimRewards() external override {
        if (_pendingYield > 0) {
            IERC20(underlyingAsset).safeTransfer(vault, _pendingYield);
            _totalValue += _pendingYield;
            _pendingYield = 0;
        }
    }

    function emergencyWithdraw() external override returns (uint256 amount) {
        amount = _totalValue;
        totalDeposited = 0;
        _totalValue = 0;
        _pendingYield = 0;
        IERC20(underlyingAsset).safeTransfer(vault, amount);
    }

    function getRiskScore() external view override returns (uint256) {
        return _riskScore;
    }

    function getAPY() external view override returns (uint256) {
        return _apy;
    }

    function getWithdrawalDelay() external view override returns (uint256) {
        return _withdrawalDelay;
    }

    // Test helpers
    function setPendingYield(uint256 amount) external {
        _pendingYield = amount;
    }

    function setTotalValue(uint256 value) external {
        _totalValue = value;
    }
}
