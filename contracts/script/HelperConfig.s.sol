// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";

/// @title HelperConfig
/// @notice Provides chain-specific configuration for YieldNest deployment.
/// Addresses are for Base Sepolia testnet. Update for mainnet deployment.
contract HelperConfig is Script {
    struct NetworkConfig {
        address usdc;
        address entryPoint; // ERC-4337 EntryPoint v0.7
        address safeSingleton; // Safe{Core} Singleton v1.4.1
        address safeProxyFactory; // Safe Proxy Factory v1.4.1
        address chainlinkEthUsd; // ETH/USD price feed
    }

    NetworkConfig public activeNetworkConfig;

    mapping(uint256 => NetworkConfig) public chainConfigs;

    constructor() {
        // Base Sepolia
        chainConfigs[84532] = NetworkConfig({
            usdc: 0x036cBD53842C5426634E792954fDD89Ad4f01d6a, // USDC on Base Sepolia
            entryPoint: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789, // EntryPoint v0.7
            safeSingleton: 0x41675C099F32341bf84BFc5382aF534df5C7461a, // Safe 1.4.1
            safeProxyFactory: 0x4E1DcF7aD4E35CF935a89cb17aBD0F3c2489857e,
            chainlinkEthUsd: 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1
        });

        // Base Mainnet (placeholder — verify addresses before mainnet deploy)
        chainConfigs[8453] = NetworkConfig({
            usdc: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913,
            entryPoint: address(0), // TBD
            safeSingleton: address(0), // TBD
            safeProxyFactory: address(0), // TBD
            chainlinkEthUsd: 0x71041dddAD3595F270Ce8932D7efE18a9787ad82
        });

        // Arbitrum Sepolia
        chainConfigs[421614] = NetworkConfig({
            usdc: 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d,
            entryPoint: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789,
            safeSingleton: address(0),
            safeProxyFactory: address(0),
            chainlinkEthUsd: 0xd30E2101a97DCbAEbCBC04f0f14d007026C4cd39
        });

        activeNetworkConfig = chainConfigs[84532]; // Default to Base Sepolia
    }

    function getConfig() public view returns (NetworkConfig memory) {
        return activeNetworkConfig;
    }

    function getConfigByChain(
        uint256 chainId
    ) public view returns (NetworkConfig memory) {
        return chainConfigs[chainId];
    }

    function setActiveChain(uint256 chainId) public {
        activeNetworkConfig = chainConfigs[chainId];
    }
}
