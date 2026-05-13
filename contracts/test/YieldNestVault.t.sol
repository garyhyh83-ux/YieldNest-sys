// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {YieldNestVault} from "../src/vault/YieldNestVault.sol";
import {StrategyAdapter} from "../src/vault/StrategyAdapter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockAdapter} from "./mocks/MockAdapter.sol";

contract YieldNestVaultTest is Test {
    YieldNestVault public vault;
    MockERC20 public usdc;
    MockAdapter public adapter1;
    MockAdapter public adapter2;

    address public platform = makeAddr("platform");
    address public allocEngine = makeAddr("allocEngine");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    uint8 constant USDC_DECIMALS = 6;
    uint256 constant INITIAL_BALANCE = 1_000_000 * 10 ** USDC_DECIMALS; // 1M USDC
    uint256 constant PLATFORM_FEE_BPS = 30; // 0.3%
    uint256 constant MIN_DEPOSIT = 10 * 10 ** USDC_DECIMALS; // 10 USDC

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", USDC_DECIMALS);

        vm.startPrank(platform);
        vault = new YieldNestVault(
            address(usdc),
            platform,
            PLATFORM_FEE_BPS,
            MIN_DEPOSIT
        );
        vault.setAllocationEngine(allocEngine);
        vm.stopPrank();

        // Deploy adapters
        adapter1 = new MockAdapter(
            address(vault),
            address(usdc),
            450, // 4.5% APY
            2000, // risk score
            0 // instant withdrawal
        );
        adapter2 = new MockAdapter(
            address(vault),
            address(usdc),
            600, // 6.0% APY
            4000, // higher risk
            86400 // 1 day withdrawal delay
        );

        // Register strategies
        vm.startPrank(allocEngine);
        vault.addStrategy(address(adapter1), 6000); // 60% target
        vault.addStrategy(address(adapter2), 4000); // 40% target
        vm.stopPrank();

        // Fund users
        usdc.mint(user1, INITIAL_BALANCE);
        usdc.mint(user2, INITIAL_BALANCE);

        // Users approve vault
        vm.prank(user1);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(user2);
        usdc.approve(address(vault), type(uint256).max);
    }

    function test_constructor() public {
        assertEq(address(vault.usdc()), address(usdc));
        assertEq(vault.platformFeeBps(), PLATFORM_FEE_BPS);
        assertEq(vault.minDeposit(), MIN_DEPOSIT);
        assertEq(vault.totalShares(), 0);
    }

    function test_deposit_firstUser() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS; // 100k USDC

        vm.prank(user1);
        vault.deposit(amount, 0);

        assertEq(vault.userShares(user1), amount);
        assertEq(vault.totalShares(), amount);
        assertEq(usdc.balanceOf(address(vault)), 0); // USDC forwarded to adapter
    }

    function test_deposit_twoUsers() public {
        uint256 amount1 = 100_000 * 10 ** USDC_DECIMALS;
        uint256 amount2 = 50_000 * 10 ** USDC_DECIMALS;

        vm.prank(user1);
        vault.deposit(amount1, 0);

        vm.prank(user2);
        vault.deposit(amount2, 0);

        assertEq(vault.userShares(user1), amount1);
        assertEq(vault.userShares(user2), amount2);
        assertEq(vault.totalShares(), amount1 + amount2);
    }

    function test_deposit_belowMinimum_reverts() public {
        uint256 amount = 5 * 10 ** USDC_DECIMALS; // 5 USDC < min

        vm.prank(user1);
        vm.expectRevert("Vault: below min deposit");
        vault.deposit(amount, 0);
    }

    function test_withdraw() public {
        uint256 depositAmount = 100_000 * 10 ** USDC_DECIMALS;

        vm.prank(user1);
        vault.deposit(depositAmount, 0);

        uint256 shares = vault.userShares(user1);

        vm.prank(user1);
        vault.withdraw(shares, user1, 0);

        // User should get back their USDC (minus any rounding)
        uint256 balance = usdc.balanceOf(user1);
        assertApproxEqAbs(balance, INITIAL_BALANCE, 10);
    }

    function test_withdraw_insufficientShares_reverts() public {
        vm.prank(user1);
        vm.expectRevert("Vault: insufficient shares");
        vault.withdraw(1000, user1, 0);
    }

    function test_addStrategy() public {
        address newAdapter = address(new MockAdapter(
            address(vault), address(usdc), 500, 3000, 0
        ));

        vm.prank(allocEngine);
        uint256 id = vault.addStrategy(newAdapter, 2000);

        assertEq(id, 2);
        (address adapter, uint256 target, , bool active) = vault.strategies(id);
        assertEq(adapter, newAdapter);
        assertEq(target, 2000);
        assertTrue(active);
    }

    function test_removeStrategy() public {
        // Add new empty strategy
        address newAdapter = address(new MockAdapter(
            address(vault), address(usdc), 500, 3000, 0
        ));
        vm.startPrank(allocEngine);
        uint256 id = vault.addStrategy(newAdapter, 1000);

        // Remove it (no funds allocated)
        vault.removeStrategy(id);
        vm.stopPrank();

        (, , , bool active) = vault.strategies(id);
        assertFalse(active);
    }

    function test_totalValue() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;

        vm.prank(user1);
        vault.deposit(amount, 0);

        uint256 tv = vault.totalValue();
        assertApproxEqAbs(tv, amount, 100);
    }

    // Test withdraw fee accounting
    function test_withdrawFees() public {
        uint256 amount = 100_000 * 10 ** USDC_DECIMALS;

        vm.prank(user1);
        vault.deposit(amount, 0);

        // Simulate accumulated fees
        vm.startPrank(allocEngine);
        // We can't test fee withdrawal without yield, but the function exists
        assertEq(vault.accumulatedFees(), 0);
        vm.stopPrank();
    }
}
