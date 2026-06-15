// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {OndoUSDYAdapter} from "../src/adapters/OndoUSDYAdapter.sol";
import {MockUSDY} from "./mocks/MockUSDY.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract OndoUSDYAdapterTest is Test {
    OndoUSDYAdapter public adapter;
    MockUSDY public usdy;
    MockERC20 public usdc;

    address public vault = makeAddr("vault");
    uint8 constant USDC_DECIMALS = 6;

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", USDC_DECIMALS);
        usdy = new MockUSDY();
        vm.prank(vault);
        adapter = new OndoUSDYAdapter(vault, address(usdc), address(usdy));
        usdc.mint(vault, 1_000_000 * 10 ** USDC_DECIMALS);
    }

    function test_constructor() public view {
        assertEq(adapter.vault(), vault);
        assertEq(adapter.underlyingAsset(), address(usdc));
        assertEq(address(adapter.usdy()), address(usdy));
    }

    function test_deposit() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;
        vm.startPrank(vault);
        usdc.approve(address(adapter), amount);
        uint256 shares = adapter.deposit(amount);
        vm.stopPrank();

        assertEq(shares, amount);
        assertEq(adapter.totalDeposited(), amount);
    }

    function test_withdraw() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;
        // Need USDY in the adapter for withdraw to work
        usdy.mint(address(adapter), amount);

        vm.startPrank(vault);
        usdc.approve(address(adapter), amount);
        adapter.deposit(amount);
        uint256 withdrawn = adapter.withdraw(amount);
        vm.stopPrank();

        assertGt(withdrawn, 0);
        assertEq(adapter.totalDeposited(), 0);
    }

    function test_withdraw_insufficient_reverts() public {
        vm.startPrank(vault);
        usdc.approve(address(adapter), 100 * 10 ** USDC_DECIMALS);
        adapter.deposit(100 * 10 ** USDC_DECIMALS);
        vm.expectRevert("OndoUSDYAdapter: insufficient shares");
        adapter.withdraw(200 * 10 ** USDC_DECIMALS);
        vm.stopPrank();
    }

    function test_totalValue() public {
        uint256 amount = 50_000 * 10 ** USDC_DECIMALS;
        usdy.mint(address(adapter), amount);

        uint256 tv = adapter.totalValue();
        // USDY price is 1e18, balance * price / 1e18 = balance
        assertEq(tv, amount);
    }

    function test_pendingYield() public {
        assertEq(adapter.pendingYield(), 0);
    }

    function test_claimRewards() public {
        adapter.claimRewards();
    }

    function test_emergencyWithdraw() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;
        usdy.mint(address(adapter), amount);

        uint256 recovered = adapter.emergencyWithdraw();
        assertEq(recovered, amount);
        assertEq(adapter.totalDeposited(), 0);
    }

    function test_riskScore() public view {
        assertEq(adapter.getRiskScore(), 2000);
    }

    function test_withdrawalDelay() public view {
        assertEq(adapter.getWithdrawalDelay(), 1 days);
    }

    function test_getAPY_returnsZero() public view {
        assertEq(adapter.getAPY(), 0);
    }

    function test_pause() public {
        vm.prank(vault);
        adapter.setPaused(true);
        assertTrue(adapter.paused());

        vm.expectRevert("StrategyAdapter: paused");
        vm.prank(vault);
        adapter.deposit(1000);
    }

    function test_unpause() public {
        vm.prank(vault);
        adapter.setPaused(true);
        vm.prank(vault);
        adapter.setPaused(false);
        assertFalse(adapter.paused());
    }
}
