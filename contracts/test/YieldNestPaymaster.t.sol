// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {YieldNestPaymaster} from "../src/paymaster/YieldNestPaymaster.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract YieldNestPaymasterTest is Test {
    YieldNestPaymaster public paymaster;
    MockERC20 public usdc;

    address public platformOwner = makeAddr("platformOwner");
    address public operator = makeAddr("operator");
    address public userAccount = makeAddr("userAccount");

    uint8 constant USDC_DECIMALS = 6;
    uint256 constant USDC_PER_GAS = 10; // 0.000010 USDC per gas (adjusted for test)
    uint256 constant MAX_GAS_PER_OP = 1_000_000;

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", USDC_DECIMALS);

        paymaster = new YieldNestPaymaster(
            address(usdc),
            address(this),
            USDC_PER_GAS,
            MAX_GAS_PER_OP
        );

        paymaster.grantRole(paymaster.OPERATOR_ROLE(), operator);

        // Setup user account with USDC
        usdc.mint(userAccount, 1_000_000 * 10 ** USDC_DECIMALS);
    }

    function test_constructor() public {
        assertEq(address(paymaster.usdc()), address(usdc));
        assertEq(paymaster.platformOwner(), address(this));
        assertEq(paymaster.usdcPerGas(), USDC_PER_GAS);
        assertEq(paymaster.maxGasPerOp(), MAX_GAS_PER_OP);
    }

    function test_whitelistAccount_usdcMode() public {
        vm.prank(operator);
        paymaster.whitelistAccount(userAccount, YieldNestPaymaster.SponsorMode.USDC);

        assertTrue(paymaster.whitelistedAccounts(userAccount));
        assertEq(
            uint256(paymaster.sponsorModes(userAccount)),
            uint256(YieldNestPaymaster.SponsorMode.USDC)
        );
    }

    function test_whitelistAccount_subsidizedMode() public {
        vm.prank(operator);
        paymaster.whitelistAccount(
            userAccount,
            YieldNestPaymaster.SponsorMode.SUBSIDIZED
        );

        assertTrue(paymaster.whitelistedAccounts(userAccount));
        assertEq(
            uint256(paymaster.sponsorModes(userAccount)),
            uint256(YieldNestPaymaster.SponsorMode.SUBSIDIZED)
        );
    }

    function test_removeAccount() public {
        vm.startPrank(operator);
        paymaster.whitelistAccount(userAccount, YieldNestPaymaster.SponsorMode.SUBSIDIZED);
        paymaster.removeAccount(userAccount);
        vm.stopPrank();

        assertFalse(paymaster.whitelistedAccounts(userAccount));
    }

    function test_changeSponsorMode() public {
        vm.startPrank(operator);
        paymaster.whitelistAccount(userAccount, YieldNestPaymaster.SponsorMode.USDC);
        paymaster.setSponsorMode(userAccount, YieldNestPaymaster.SponsorMode.MONTHLY_BILLING);
        vm.stopPrank();

        assertEq(
            uint256(paymaster.sponsorModes(userAccount)),
            uint256(YieldNestPaymaster.SponsorMode.MONTHLY_BILLING)
        );
    }

    function test_validateSponsorship_subsidized() public {
        vm.prank(operator);
        paymaster.whitelistAccount(
            userAccount,
            YieldNestPaymaster.SponsorMode.SUBSIDIZED
        );

        vm.prank(operator);
        (bool canSponsor, uint256 usdcCost) = paymaster.validateSponsorship(
            userAccount,
            500_000
        );

        assertTrue(canSponsor);
        assertEq(usdcCost, 0); // Subsidized = free
    }

    function test_validateSponsorship_usdc() public {
        vm.prank(operator);
        paymaster.whitelistAccount(userAccount, YieldNestPaymaster.SponsorMode.USDC);

        // Approve paymaster to spend user's USDC
        uint256 gasLimit = 500_000;
        uint256 expectedCost = gasLimit * USDC_PER_GAS;

        vm.prank(userAccount);
        usdc.approve(address(paymaster), expectedCost);

        vm.prank(operator);
        (bool canSponsor, uint256 usdcCost) = paymaster.validateSponsorship(
            userAccount,
            gasLimit
        );

        assertTrue(canSponsor);
        assertEq(usdcCost, expectedCost);
    }

    function test_validateSponsorship_insufficientAllowance() public {
        vm.prank(operator);
        paymaster.whitelistAccount(userAccount, YieldNestPaymaster.SponsorMode.USDC);

        // No USDC approval given

        vm.prank(operator);
        vm.expectRevert("Paymaster: insufficient USDC allowance");
        paymaster.validateSponsorship(userAccount, 500_000);
    }

    function test_validateSponsorship_notWhitelisted_reverts() public {
        vm.prank(operator);
        vm.expectRevert("Paymaster: account not whitelisted");
        paymaster.validateSponsorship(userAccount, 500_000);
    }

    function test_validateSponsorship_gasLimitExceeded_reverts() public {
        vm.prank(operator);
        paymaster.whitelistAccount(
            userAccount,
            YieldNestPaymaster.SponsorMode.SUBSIDIZED
        );

        vm.prank(operator);
        vm.expectRevert("Paymaster: gas limit exceeded");
        paymaster.validateSponsorship(userAccount, MAX_GAS_PER_OP + 1);
    }

    function test_estimateUsdcCost() public {
        uint256 gasLimit = 500_000;
        uint256 expectedCost = gasLimit * USDC_PER_GAS;
        assertEq(paymaster.estimateUsdcCost(gasLimit), expectedCost);
    }

    function test_depositEth() public {
        uint256 amount = 1 ether;
        vm.deal(address(this), amount);

        paymaster.depositEth{value: amount}();
        assertEq(paymaster.accumulatedEth(), amount);
    }

    function test_withdrawEth() public {
        uint256 amount = 1 ether;
        address payable recipient = payable(makeAddr("recipient"));
        vm.deal(address(this), amount);
        paymaster.depositEth{value: amount}();

        paymaster.withdrawEth(recipient, amount);

        assertEq(paymaster.accumulatedEth(), 0);
        assertEq(address(recipient).balance, amount);
    }
}
