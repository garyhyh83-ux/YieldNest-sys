// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {EthenaAdapter} from "../src/adapters/EthenaAdapter.sol";
import {MockEthenaStaking} from "./mocks/MockEthenaStaking.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract EthenaAdapterTest is Test {
    EthenaAdapter public adapter;
    MockEthenaStaking public staking;
    MockERC20 public usdc;

    address public vault = makeAddr("vault");
    uint8 constant USDC_DECIMALS = 6;

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", USDC_DECIMALS);
        staking = new MockEthenaStaking(address(usdc));
        vm.prank(vault);
        adapter = new EthenaAdapter(vault, address(usdc), address(staking));
        usdc.mint(vault, 1_000_000 * 10 ** USDC_DECIMALS);
    }

    function test_constructor() public view {
        assertEq(adapter.vault(), vault);
        assertEq(adapter.underlyingAsset(), address(usdc));
        assertEq(address(adapter.staking()), address(staking));
    }

    function test_deposit() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;
        vm.startPrank(vault);
        usdc.approve(address(adapter), amount);
        uint256 shares = adapter.deposit(amount);
        vm.stopPrank();

        assertEq(shares, amount);
        assertEq(adapter.totalDeposited(), amount);
        assertGt(adapter.totalValue(), 0);
    }

    function test_withdraw() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;
        vm.startPrank(vault);
        usdc.approve(address(adapter), amount);
        adapter.deposit(amount);

        uint256 beforeBalance = usdc.balanceOf(vault);
        adapter.withdraw(amount);
        uint256 afterBalance = usdc.balanceOf(vault);
        vm.stopPrank();

        assertGt(afterBalance, beforeBalance);
        assertEq(adapter.totalDeposited(), 0);
    }

    function test_withdraw_insufficient_reverts() public {
        vm.startPrank(vault);
        usdc.approve(address(adapter), 100 * 10 ** USDC_DECIMALS);
        adapter.deposit(100 * 10 ** USDC_DECIMALS);
        vm.expectRevert("EthenaAdapter: insufficient shares");
        adapter.withdraw(200 * 10 ** USDC_DECIMALS);
        vm.stopPrank();
    }

    function test_totalValue() public {
        vm.startPrank(vault);
        usdc.approve(address(adapter), 50_000 * 10 ** USDC_DECIMALS);
        adapter.deposit(50_000 * 10 ** USDC_DECIMALS);
        vm.stopPrank();

        assertGt(adapter.totalValue(), 0);
    }

    function test_pendingYield() public {
        assertEq(adapter.pendingYield(), 0);
    }

    function test_claimRewards() public {
        adapter.claimRewards();
    }

    function test_emergencyWithdraw() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;
        vm.startPrank(vault);
        usdc.approve(address(adapter), amount);
        adapter.deposit(amount);
        vm.stopPrank();

        uint256 recovered = adapter.emergencyWithdraw();
        assertGt(recovered, 0);
        assertEq(adapter.totalDeposited(), 0);
    }

    function test_riskScore() public view {
        assertEq(adapter.getRiskScore(), 5000);
    }

    function test_withdrawalDelay() public view {
        assertEq(adapter.getWithdrawalDelay(), 7 days);
    }

    function test_getAPY() public view {
        assertEq(adapter.getAPY(), 800); // 8%
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
