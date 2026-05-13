// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title AccountRegistry
/// @notice Global on-chain registry mapping enterprise IDs to their smart accounts.
/// Supports multiple accounts per enterprise (one per chain).
contract AccountRegistry is AccessControl {
    // ===== Roles =====

    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ===== Structs =====

    struct AccountInfo {
        address accountAddress;
        uint256 chainId;
        uint256 deployedAt;
        bool active;
    }

    // ===== State =====

    /// @notice Mapping: enterpriseId => chainId => AccountInfo
    mapping(bytes32 => mapping(uint256 => AccountInfo)) public accounts;

    /// @notice Mapping: account address => enterpriseId
    mapping(address => bytes32) public accountToEnterprise;

    /// @notice Mapping: enterpriseId => array of chain IDs with accounts
    mapping(bytes32 => uint256[]) public enterpriseChains;

    /// @notice All registered enterprise IDs
    bytes32[] public enterpriseIds;

    /// @notice Mapping: enterpriseId => is registered
    mapping(bytes32 => bool) public isEnterprise;

    // ===== Events =====

    event AccountRegistered(
        bytes32 indexed enterpriseId,
        address indexed account,
        uint256 chainId
    );

    event AccountDeactivated(
        bytes32 indexed enterpriseId,
        address indexed account
    );

    event AccountReactivated(
        bytes32 indexed enterpriseId,
        address indexed account
    );

    // ===== Constructor =====

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ===== Factory Functions =====

    /// @notice Register a newly deployed account. Called by AccountFactory.
    function register(
        bytes32 enterpriseId,
        address account,
        uint256 chainId
    ) external onlyRole(FACTORY_ROLE) {
        require(account != address(0), "Registry: zero account");
        require(
            accounts[enterpriseId][chainId].accountAddress == address(0),
            "Registry: account exists on this chain"
        );

        accounts[enterpriseId][chainId] = AccountInfo({
            accountAddress: account,
            chainId: chainId,
            deployedAt: block.timestamp,
            active: true
        });

        accountToEnterprise[account] = enterpriseId;

        if (!isEnterprise[enterpriseId]) {
            isEnterprise[enterpriseId] = true;
            enterpriseIds.push(enterpriseId);
        }

        enterpriseChains[enterpriseId].push(chainId);

        emit AccountRegistered(enterpriseId, account, chainId);
    }

    // ===== Admin Functions =====

    /// @notice Deactivate an account (does not revoke funds)
    function deactivateAccount(
        bytes32 enterpriseId,
        uint256 chainId
    ) external onlyRole(ADMIN_ROLE) {
        AccountInfo storage info = accounts[enterpriseId][chainId];
        require(info.accountAddress != address(0), "Registry: account not found");
        require(info.active, "Registry: already inactive");
        info.active = false;
        emit AccountDeactivated(enterpriseId, info.accountAddress);
    }

    /// @notice Reactivate a deactivated account
    function reactivateAccount(
        bytes32 enterpriseId,
        uint256 chainId
    ) external onlyRole(ADMIN_ROLE) {
        AccountInfo storage info = accounts[enterpriseId][chainId];
        require(info.accountAddress != address(0), "Registry: account not found");
        require(!info.active, "Registry: already active");
        info.active = true;
        emit AccountReactivated(enterpriseId, info.accountAddress);
    }

    /// @notice Add a factory address
    function addFactory(address factory) external onlyRole(ADMIN_ROLE) {
        grantRole(FACTORY_ROLE, factory);
    }

    /// @notice Remove a factory address
    function removeFactory(address factory) external onlyRole(ADMIN_ROLE) {
        revokeRole(FACTORY_ROLE, factory);
    }

    // ===== View Functions =====

    /// @notice Look up an enterprise's account on a specific chain
    function getAccount(
        bytes32 enterpriseId,
        uint256 chainId
    ) external view returns (AccountInfo memory) {
        return accounts[enterpriseId][chainId];
    }

    /// @notice Get the enterprise ID for a given account address
    function getEnterpriseId(
        address account
    ) external view returns (bytes32) {
        return accountToEnterprise[account];
    }

    /// @notice Check if an account is registered
    function isRegistered(address account) external view returns (bool) {
        return accountToEnterprise[account] != bytes32(0);
    }

    /// @notice Check if an account is active
    function isActive(
        bytes32 enterpriseId,
        uint256 chainId
    ) external view returns (bool) {
        return accounts[enterpriseId][chainId].active;
    }

    /// @notice Get all chains where an enterprise has accounts
    function getEnterpriseChains(
        bytes32 enterpriseId
    ) external view returns (uint256[] memory) {
        return enterpriseChains[enterpriseId];
    }

    /// @notice Get the total number of registered enterprises
    function enterpriseCount() external view returns (uint256) {
        return enterpriseIds.length;
    }
}
