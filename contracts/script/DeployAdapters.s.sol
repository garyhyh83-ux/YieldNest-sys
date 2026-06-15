// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {AaveV4Adapter} from "../src/adapters/AaveV4Adapter.sol";
import {MorphoAdapter} from "../src/adapters/MorphoAdapter.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

/// @title DeployAdapters
/// @notice Deploys AaveV4Adapter and MorphoAdapter and outputs addresses for vault registration.
contract DeployAdapters is Script {
    function run() external {
        HelperConfig config = new HelperConfig();
        HelperConfig.NetworkConfig memory netCfg = config.getConfig();

        // Get vault address from env or deploy output
        address vault = vm.envOr("VAULT_ADDRESS", address(0));

        // Aave V4 Pool and Morpho Vault addresses on Base Sepolia need to be set as env vars
        address aaveV4Pool = vm.envOr("AAVE_V4_POOL", address(0));
        address morphoVault = vm.envOr("MORPHO_VAULT", address(0));

        vm.startBroadcast();

        AaveV4Adapter aaveAdapter;
        if (aaveV4Pool != address(0)) {
            aaveAdapter = new AaveV4Adapter(vault, netCfg.usdc, aaveV4Pool);
            console.log("AaveV4Adapter deployed at:", address(aaveAdapter));
        } else {
            console.log("AAVE_V4_POOL not set, skipping AaveV4Adapter");
        }

        MorphoAdapter morphoAdapter;
        if (morphoVault != address(0)) {
            morphoAdapter = new MorphoAdapter(vault, netCfg.usdc, morphoVault);
            console.log("MorphoAdapter deployed at:", address(morphoAdapter));
        } else {
            console.log("MORPHO_VAULT not set, skipping MorphoAdapter");
        }

        vm.stopBroadcast();
    }
}
