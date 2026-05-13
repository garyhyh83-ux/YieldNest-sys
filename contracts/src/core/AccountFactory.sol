// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {YieldNestAccount} from "./YieldNestAccount.sol";
import {AccountRegistry} from "./AccountRegistry.sol";

/// @title AccountFactory
/// @notice Factory contract for deploying YieldNest smart accounts using CREATE2.
/// In production, this wraps Safe{Core} SafeProxyFactory for ERC-4337 compatible accounts.
/// For Phase 0, it deploys standalone YieldNestAccount contracts.
contract AccountFactory {
    /// @notice The account implementation (logic contract)
    address public immutable accountImplementation;

    /// @notice The global account registry
    AccountRegistry public immutable registry;

    /// @notice Mapping: salt => whether deployed (prevents replay)
    mapping(bytes32 => bool) public deployed;

    // ===== Events =====

    event AccountDeployed(
        bytes32 indexed enterpriseId,
        address indexed account,
        uint256 indexed chainId,
        bytes32 salt
    );

    event ImplementationUpdated(address indexed newImplementation);

    // ===== Constructor =====

    constructor(address _registry) {
        require(_registry != address(0), "Factory: zero registry");
        registry = AccountRegistry(_registry);

        // Deploy a template implementation to clone from
        accountImplementation = address(new YieldNestAccount());
    }

    // ===== Core Function =====

    /// @notice Deploy a new YieldNestAccount for an enterprise
    /// @param enterpriseId Unique enterprise identifier
    /// @param enterpriseName Human-readable name
    /// @param owners Initial owner addresses
    /// @param threshold Required signature threshold
    /// @param chainId Chain ID where the account is being deployed
    /// @param salt Unique salt for CREATE2 (prevents same-address collisions)
    /// @return account Address of the deployed account
    function deployAccount(
        bytes32 enterpriseId,
        string calldata enterpriseName,
        address[] calldata owners,
        uint256 threshold,
        uint256 chainId,
        bytes32 salt
    ) external returns (address account) {
        require(!deployed[salt], "Factory: salt already used");
        require(bytes(enterpriseName).length > 0, "Factory: empty name");
        require(owners.length > 0, "Factory: no owners");

        // CREATE2 deployment of the account contract
        bytes memory bytecode = type(YieldNestAccount).creationCode;

        assembly {
            account := create2(
                0,
                add(bytecode, 0x20),
                mload(bytecode),
                salt
            )
        }
        require(account != address(0), "Factory: deployment failed");

        // Initialize the deployed account
        YieldNestAccount(payable(account)).initialize(
            enterpriseId,
            enterpriseName,
            owners,
            threshold
        );

        deployed[salt] = true;

        // Register in global registry
        registry.register(enterpriseId, account, chainId);

        emit AccountDeployed(enterpriseId, account, chainId, salt);
    }

    /// @notice Predict the address of an account before deployment
    /// @param salt CREATE2 salt
    /// @return predicted The predicted deployment address
    function predictAddress(
        bytes32 salt
    ) external view returns (address predicted) {
        bytes memory bytecode = type(YieldNestAccount).creationCode;

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );
        predicted = address(uint160(uint256(hash)));
    }
}
