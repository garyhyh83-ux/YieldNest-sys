// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {YieldNestVault} from "../src/vault/YieldNestVault.sol";
import {AccountFactory} from "../src/core/AccountFactory.sol";
import {AccountRegistry} from "../src/core/AccountRegistry.sol";
import {YieldNestPaymaster} from "../src/paymaster/YieldNestPaymaster.sol";
import {EmergencyPause} from "../src/governance/EmergencyPause.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

/// @title DeployYieldNest
/// @notice Full deployment script for YieldNest protocol on a target chain.
/// Usage:
///   forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast --verify
contract Deploy is Script {
    // Deployed contract addresses
    EmergencyPause public emergencyPause;
    AccountRegistry public registry;
    AccountFactory public factory;
    YieldNestVault public vault;
    YieldNestPaymaster public paymaster;

    // Deployment parameters
    uint256 constant PLATFORM_FEE_BPS = 30; // 0.3%
    uint256 constant MIN_DEPOSIT = 10 * 10 ** 6; // 10 USDC (6 decimals)
    uint256 constant USDC_PER_GAS = 10; // 0.000010 USDC per gas unit
    uint256 constant MAX_GAS_PER_OP = 1_000_000;
    uint256 constant PLATFORM_MULTISIG_THRESHOLD = 3; // 3-of-5

    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory config = helperConfig.getConfig();

        // Multi-sig signers (replace with actual addresses for production)
        address[] memory multiSigSigners = new address[](5);
        multiSigSigners[0] = vm.envAddress("MULTISIG_1");
        multiSigSigners[1] = vm.envAddress("MULTISIG_2");
        multiSigSigners[2] = vm.envAddress("MULTISIG_3");
        multiSigSigners[3] = vm.envAddress("MULTISIG_4");
        multiSigSigners[4] = vm.envAddress("MULTISIG_5");

        address platformOwner = multiSigSigners[0];
        address allocEngine = vm.envAddress("ALLOCATION_ENGINE");

        vm.startBroadcast();

        // 1. Deploy EmergencyPause
        emergencyPause = new EmergencyPause(platformOwner);
        console.log("EmergencyPause deployed at:", address(emergencyPause));

        // 2. Deploy AccountRegistry
        registry = new AccountRegistry();
        console.log("AccountRegistry deployed at:", address(registry));

        // 3. Deploy AccountFactory
        factory = new AccountFactory(address(registry));
        // Grant factory role
        registry.grantRole(registry.FACTORY_ROLE(), address(factory));
        console.log("AccountFactory deployed at:", address(factory));

        // 4. Deploy YieldNestVault
        vault = new YieldNestVault(
            config.usdc,
            platformOwner,
            PLATFORM_FEE_BPS,
            MIN_DEPOSIT
        );
        // Order matters: setPauseRegistry first (caller is still allocationEngine from constructor),
        // then transfer allocationEngine to the designated address.
        vault.setPauseRegistry(address(emergencyPause));
        vault.setAllocationEngine(allocEngine);
        console.log("YieldNestVault deployed at:", address(vault));

        // 5. Deploy YieldNestPaymaster
        paymaster = new YieldNestPaymaster(
            config.usdc,
            platformOwner,
            USDC_PER_GAS,
            MAX_GAS_PER_OP
        );
        console.log("YieldNestPaymaster deployed at:", address(paymaster));

        // 6. Register contracts in EmergencyPause
        emergencyPause.addControlledContract(address(vault));
        emergencyPause.addControlledContract(address(paymaster));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== YieldNest Deployment Summary ===");
        console.log("Chain ID:          ", block.chainid);
        console.log("USDC:              ", config.usdc);
        console.log("EmergencyPause:    ", address(emergencyPause));
        console.log("AccountRegistry:   ", address(registry));
        console.log("AccountFactory:    ", address(factory));
        console.log("YieldNestVault:    ", address(vault));
        console.log("YieldNestPaymaster:", address(paymaster));
        console.log("Platform Owner:    ", platformOwner);
        console.log("Alloc Engine:      ", allocEngine);
    }
}
