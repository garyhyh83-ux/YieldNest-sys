// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {StrategyAdapter} from "../src/vault/StrategyAdapter.sol";
import {MockAdapter} from "./mocks/MockAdapter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract StrategyAdapterTest is Test {
    MockAdapter public adapter;
    MockERC20 public usdc;

    address public vault = makeAddr("vault");
    uint8 constant USDC_DECIMALS = 6;

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", USDC_DECIMALS);
        adapter = new MockAdapter(vault, address(usdc), 450, 2000, 0);

        // Fund vault address
        usdc.mint(vault, 1_000_000 * 10 ** USDC_DECIMALS);
    }

    function test_deposit() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;

        vm.prank(vault);
        usdc.approve(address(adapter), amount);

        vm.prank(vault);
        uint256 shares = adapter.deposit(amount);

        assertEq(shares, amount);
        assertEq(adapter.totalDeposited(), amount);
    }

    function test_withdraw() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;

        vm.prank(vault);
        usdc.approve(address(adapter), amount);
        vm.prank(vault);
        adapter.deposit(amount);

        vm.prank(vault);
        uint256 withdrawn = adapter.withdraw(amount);

        assertEq(withdrawn, amount);
        assertEq(adapter.totalDeposited(), 0);
    }

    function test_setPaused() public {
        vm.prank(vault);
        adapter.setPaused(true);
        assertTrue(adapter.paused());

        // Deposit should revert when paused
        vm.prank(vault);
        usdc.approve(address(adapter), 1000);
        vm.prank(vault);
        vm.expectRevert("StrategyAdapter: paused");
        adapter.deposit(1000);
    }

    function test_onlyVault_canSetPaused() public {
        vm.prank(makeAddr("stranger"));
        vm.expectRevert("StrategyAdapter: unauthorized");
        adapter.setPaused(true);
    }
}
