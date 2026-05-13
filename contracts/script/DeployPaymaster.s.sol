// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {YieldNestPaymaster} from "../src/paymaster/YieldNestPaymaster.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployPaymaster is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory config = helperConfig.getConfig();

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address platformOwner = vm.envAddress("PLATFORM_OWNER");
        uint256 usdcPerGas = 10;
        uint256 maxGasPerOp = 1_000_000;

        vm.startBroadcast(deployerPrivateKey);

        YieldNestPaymaster paymaster = new YieldNestPaymaster(
            config.usdc,
            platformOwner,
            usdcPerGas,
            maxGasPerOp
        );

        console.log("Paymaster deployed at:", address(paymaster));
        console.log("USDC:", config.usdc);
        console.log("Platform Owner:", platformOwner);

        vm.stopBroadcast();
    }
}
