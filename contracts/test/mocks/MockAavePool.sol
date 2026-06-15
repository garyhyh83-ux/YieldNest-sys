// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Mock Aave V4 Pool for testing AaveV4Adapter.
/// Mimics the supply/withdraw interface with simplified accounting.
contract MockAavePool {
    using SafeERC20 for IERC20;

    mapping(address => uint256) public supplied;
    mapping(address => address) public aToken;

    uint256 public liquidityRate = 4.5e25; // 4.5% in ray (1e27)

    function setAToken(address asset, address aTokenAddr) external {
        aToken[asset] = aTokenAddr;
    }

    function setLiquidityRate(uint256 rate) external {
        liquidityRate = rate;
    }

    function supply(address asset, uint256 amount, address, uint16) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        supplied[asset] += amount;
        // In real Aave, aTokens are minted. In mock, we track supplied amount.
        if (aToken[asset] != address(0)) {
            MockAToken(aToken[asset]).mint(msg.sender, amount);
        }
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        require(supplied[asset] >= amount, "MockAavePool: insufficient");
        supplied[asset] -= amount;
        if (aToken[asset] != address(0)) {
            MockAToken(aToken[asset]).burn(msg.sender, amount);
        }
        IERC20(asset).safeTransfer(to, amount);
        return amount;
    }

    function getReserveData(
        address asset
    )
        external
        view
        returns (
            uint256,
            uint256,
            uint256 _liquidityRate,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            address _aTokenAddress,
            address,
            address,
            address,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        _liquidityRate = liquidityRate;
        _aTokenAddress = aToken[asset];
    }
}

/// @notice Mock aToken for testing
contract MockAToken {
    mapping(address => uint256) private _balances;

    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
    }

    function burn(address from, uint256 amount) external {
        require(_balances[from] >= amount, "MockAToken: insufficient");
        _balances[from] -= amount;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
}
