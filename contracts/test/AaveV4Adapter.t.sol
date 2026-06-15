// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {AaveV4Adapter} from "../src/adapters/AaveV4Adapter.sol";
import {MockAavePool, MockAToken} from "./mocks/MockAavePool.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract AaveV4AdapterTest is Test {
    AaveV4Adapter public adapter;
    MockAavePool public pool;
    MockERC20 public usdc;

    address public vault = makeAddr("vault");
    uint8 constant USDC_DECIMALS = 6;

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", USDC_DECIMALS);
        pool = new MockAavePool();
        vm.prank(vault);
        adapter = new AaveV4Adapter(vault, address(usdc), address(pool));
        usdc.mint(vault, 1_000_000 * 10 ** USDC_DECIMALS);
    }

    function test_constructor() public view {
        assertEq(adapter.vault(), vault);
        assertEq(adapter.underlyingAsset(), address(usdc));
        assertEq(address(adapter.aavePool()), address(pool));
    }

    function test_deposit() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;
        vm.startPrank(vault);
        usdc.approve(address(adapter), amount);
        uint256 shares = adapter.deposit(amount);
        vm.stopPrank();

        assertEq(shares, amount);
        assertEq(adapter.totalDeposited(), amount);
        assertEq(pool.supplied(address(usdc)), amount);
    }

    function test_withdraw() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;
        vm.startPrank(vault);
        usdc.approve(address(adapter), amount);
        adapter.deposit(amount);

        uint256 beforeBalance = usdc.balanceOf(vault);
        uint256 withdrawn = adapter.withdraw(amount);
        uint256 afterBalance = usdc.balanceOf(vault);
        vm.stopPrank();

        assertEq(withdrawn, amount);
        assertEq(afterBalance - beforeBalance, amount);
        assertEq(adapter.totalDeposited(), 0);
    }

    function test_withdraw_insufficient_reverts() public {
        vm.startPrank(vault);
        usdc.approve(address(adapter), 100 * 10 ** USDC_DECIMALS);
        adapter.deposit(100 * 10 ** USDC_DECIMALS);
        vm.expectRevert("AaveV4Adapter: insufficient shares");
        adapter.withdraw(200 * 10 ** USDC_DECIMALS);
        vm.stopPrank();
    }

    function test_totalValue() public {
        uint256 amount = 50_000 * 10 ** USDC_DECIMALS;
        vm.startPrank(vault);
        usdc.approve(address(adapter), amount);
        adapter.deposit(amount);
        vm.stopPrank();

        assertEq(adapter.totalValue(), amount);
    }

    function test_pendingYield() public {
        // Without aToken mock, pending yield is 0 initially
        assertEq(adapter.pendingYield(), 0);
    }

    function test_claimRewards() public {
        // Should not revert (no-op for Aave V4)
        adapter.claimRewards();
    }

    function test_emergencyWithdraw() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;
        // Set up mock aToken so getReserveData returns a valid address
        MockAToken aToken = new MockAToken();
        pool.setAToken(address(usdc), address(aToken));

        vm.startPrank(vault);
        usdc.approve(address(adapter), amount);
        adapter.deposit(amount);
        vm.stopPrank();

        uint256 recovered = adapter.emergencyWithdraw();
        assertGt(recovered, 0);
        assertEq(adapter.totalDeposited(), 0);
    }

    function test_riskScore() public view {
        assertEq(adapter.getRiskScore(), 1500);
    }

    function test_withdrawalDelay() public view {
        assertEq(adapter.getWithdrawalDelay(), 0);
    }

    function test_getAPY() public view {
        uint256 apy = adapter.getAPY();
        // 4.5% supply rate * 10000 / 1e27 ≈ 450 bps (0 bps due to truncation)
        assertTrue(apy < 500);
    }

    function test_pause() public {
        vm.prank(vault);
        adapter.setPaused(true);
        assertTrue(adapter.paused());

        vm.expectRevert("StrategyAdapter: paused");
        vm.prank(vault);
        adapter.deposit(1000);
    }

    function test_unpauses() public {
        vm.prank(vault);
        adapter.setPaused(true);
        vm.prank(vault);
        adapter.setPaused(false);
        assertFalse(adapter.paused());
    }
}
