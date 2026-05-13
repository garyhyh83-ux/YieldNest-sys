// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {AccountFactory} from "../src/core/AccountFactory.sol";
import {AccountRegistry} from "../src/core/AccountRegistry.sol";
import {YieldNestAccount} from "../src/core/YieldNestAccount.sol";

contract AccountFactoryTest is Test {
    AccountFactory public factory;
    AccountRegistry public registry;

    bytes32 constant ENTERPRISE_ID = bytes32(uint256(1));
    string constant ENTERPRISE_NAME = "Acme Corp";
    bytes32 constant SALT = bytes32(uint256(42));

    address[] owners;
    uint256 threshold = 1;

    function setUp() public {
        // Deploy registry
        registry = new AccountRegistry();

        // Grant factory role to ourselves for registering
        // (factory will get role when deployed)
        vm.startPrank(address(this));
        factory = new AccountFactory(address(registry));

        // Grant factory role
        registry.grantRole(registry.FACTORY_ROLE(), address(factory));
        vm.stopPrank();

        owners = new address[](2);
        owners[0] = makeAddr("owner1");
        owners[1] = makeAddr("owner2");
    }

    function test_deployAccount() public {
        address predicted = factory.predictAddress(SALT);

        address account = factory.deployAccount(
            ENTERPRISE_ID,
            ENTERPRISE_NAME,
            owners,
            2,
            8453,
            SALT
        );

        assertTrue(account != address(0));
        assertEq(account, predicted);

        // Verify account initialization
        YieldNestAccount acc = YieldNestAccount(payable(account));
        assertEq(acc.enterpriseId(), ENTERPRISE_ID);
        assertEq(acc.enterpriseName(), ENTERPRISE_NAME);
        assertEq(acc.threshold(), 2);
        assertTrue(acc.isOwner(owners[0]));
        assertTrue(acc.isOwner(owners[1]));

        // Verify registry
        AccountRegistry.AccountInfo memory info = registry.getAccount(
            ENTERPRISE_ID,
            8453
        );
        assertEq(info.accountAddress, account);
        assertTrue(info.active);
        assertEq(registry.accountToEnterprise(account), ENTERPRISE_ID);
    }

    function test_deployAccount_duplicateSalt_reverts() public {
        factory.deployAccount(
            ENTERPRISE_ID,
            ENTERPRISE_NAME,
            owners,
            1,
            8453,
            SALT
        );

        // Try same salt again
        vm.expectRevert("Factory: salt already used");
        factory.deployAccount(
            ENTERPRISE_ID,
            "Other Corp",
            owners,
            1,
            8453,
            SALT
        );
    }

    function test_predictAddress() public {
        address predicted = factory.predictAddress(SALT);
        assertTrue(predicted != address(0));
    }

    function test_deployMultipleAccountsPerEnterprise() public {
        // Same enterprise, different chains
        address account1 = factory.deployAccount(
            ENTERPRISE_ID,
            ENTERPRISE_NAME,
            owners,
            1,
            8453, // Base
            bytes32(uint256(1))
        );

        address account2 = factory.deployAccount(
            ENTERPRISE_ID,
            ENTERPRISE_NAME,
            owners,
            1,
            42161, // Arbitrum
            bytes32(uint256(2))
        );

        assertTrue(account1 != account2);
        assertTrue(registry.isRegistered(account1));
        assertTrue(registry.isRegistered(account2));

        uint256[] memory chains = registry.getEnterpriseChains(ENTERPRISE_ID);
        assertEq(chains.length, 2);
    }
}
