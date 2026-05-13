// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title EmergencyPause
/// @notice Three-tier circuit breaker for YieldNest protocol.
///
/// Levels:
/// - NONE: Normal operation
/// - YELLOW: No new deposits into affected strategies, normal withdrawals
/// - ORANGE: No new deposits, accelerate existing position exits
/// - RED: Global pause — all operations halted
contract EmergencyPause is AccessControl {
    // ===== Roles =====

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ===== Enums =====

    enum PauseLevel {
        NONE,
        YELLOW,
        ORANGE,
        RED
    }

    // ===== Structs =====

    struct PauseState {
        PauseLevel level;
        uint256 setAt;
        address setBy;
        string reason;
    }

    // ===== State Variables =====

    /// @notice Current pause level
    PauseLevel public currentLevel;

    /// @notice Timestamp when current level was set
    uint256 public levelSetAt;

    /// @notice Address that set the current level
    address public levelSetBy;

    /// @notice Reason for current pause level
    string public pauseReason;

    /// @notice List of contracts controlled by this pause module
    address[] public controlledContracts;

    /// @notice Mapping: address => is controlled
    mapping(address => bool) public isControlled;

    /// @notice History of pause events
    PauseState[] public pauseHistory;

    /// @notice Whether RED level requires multi-sig to reset (enhanced security)
    bool public redRequiresMultiSig;

    /// @notice Multi-sig address for RED level reset
    address public multiSigAdmin;

    // ===== Events =====

    event PauseLevelChanged(
        PauseLevel previousLevel,
        PauseLevel newLevel,
        address indexed setBy,
        string reason
    );

    event ControlledContractAdded(address indexed contractAddress);
    event ControlledContractRemoved(address indexed contractAddress);
    event EmergencyShutdown(address indexed triggeredBy);

    // ===== Constructor =====

    constructor(address _multiSigAdmin) {
        require(_multiSigAdmin != address(0), "Pause: zero multi-sig");
        multiSigAdmin = _multiSigAdmin;
        redRequiresMultiSig = true;

        _grantRole(DEFAULT_ADMIN_ROLE, _multiSigAdmin);
        _grantRole(PAUSER_ROLE, _multiSigAdmin);

        currentLevel = PauseLevel.NONE;
        levelSetAt = block.timestamp;
    }

    // ===== Pause Control =====

    /// @notice Set the pause level
    /// @param level New pause level
    /// @param reason Human-readable reason for the change
    function setPauseLevel(
        PauseLevel level,
        string calldata reason
    ) external onlyRole(PAUSER_ROLE) {
        // RED level requires multi-sig or existing RED escalation
        if (level == PauseLevel.RED && redRequiresMultiSig) {
            require(
                msg.sender == multiSigAdmin ||
                    currentLevel == PauseLevel.RED, // staying at RED
                "Pause: RED requires multi-sig"
            );
        }

        // Cannot downgrade from RED without multi-sig
        if (currentLevel == PauseLevel.RED && level != PauseLevel.RED) {
            require(
                msg.sender == multiSigAdmin,
                "Pause: RED downgrade requires multi-sig"
            );
        }

        PauseLevel previous = currentLevel;
        currentLevel = level;
        levelSetAt = block.timestamp;
        levelSetBy = msg.sender;
        pauseReason = reason;

        // Record history
        pauseHistory.push(
            PauseState({
                level: level,
                setAt: block.timestamp,
                setBy: msg.sender,
                reason: reason
            })
        );

        // Notify all controlled contracts
        for (uint256 i = 0; i < controlledContracts.length; i++) {
            _notifyContract(controlledContracts[i], level);
        }

        emit PauseLevelChanged(previous, level, msg.sender, reason);
    }

    /// @notice Trigger full emergency shutdown (RED level)
    function emergencyShutdown(
        string calldata reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        PauseLevel previous = currentLevel;
        currentLevel = PauseLevel.RED;
        levelSetAt = block.timestamp;
        levelSetBy = msg.sender;
        pauseReason = reason;

        pauseHistory.push(
            PauseState({
                level: PauseLevel.RED,
                setAt: block.timestamp,
                setBy: msg.sender,
                reason: reason
            })
        );

        for (uint256 i = 0; i < controlledContracts.length; i++) {
            _notifyContract(controlledContracts[i], PauseLevel.RED);
        }

        emit EmergencyShutdown(msg.sender);
        emit PauseLevelChanged(previous, PauseLevel.RED, msg.sender, reason);
    }

    // ===== Controlled Contract Management =====

    /// @notice Add a contract to the controlled list
    function addControlledContract(
        address contractAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(contractAddress != address(0), "Pause: zero address");
        require(!isControlled[contractAddress], "Pause: already controlled");

        isControlled[contractAddress] = true;
        controlledContracts.push(contractAddress);

        emit ControlledContractAdded(contractAddress);
    }

    /// @notice Remove a contract from the controlled list
    function removeControlledContract(
        address contractAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isControlled[contractAddress], "Pause: not controlled");
        isControlled[contractAddress] = false;

        emit ControlledContractRemoved(contractAddress);
    }

    // ===== Configuration =====

    /// @notice Enable/disable multi-sig requirement for RED level
    function setRedRequiresMultiSig(
        bool _enabled
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        redRequiresMultiSig = _enabled;
    }

    /// @notice Update multi-sig admin address
    function setMultiSigAdmin(
        address _admin
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_admin != address(0), "Pause: zero admin");
        multiSigAdmin = _admin;
    }

    // ===== View Functions =====

    /// @notice Check if operations are allowed at current level
    function canDeposit() external view returns (bool) {
        return currentLevel == PauseLevel.NONE;
    }

    /// @notice Check if withdrawals are allowed at current level
    function canWithdraw() external view returns (bool) {
        return currentLevel != PauseLevel.RED;
    }

    /// @notice Get the number of controlled contracts
    function controlledContractCount() external view returns (uint256) {
        return controlledContracts.length;
    }

    /// @notice Get all controlled contracts
    function getControlledContracts()
        external
        view
        returns (address[] memory)
    {
        return controlledContracts;
    }

    /// @notice Get pause history length
    function pauseHistoryLength() external view returns (uint256) {
        return pauseHistory.length;
    }

    // ===== Internal =====

    /// @notice Attempt to notify a controlled contract of pause level change
    /// Best-effort — failure to notify one contract does not block the rest
    function _notifyContract(
        address target,
        PauseLevel level
    ) internal {
        // Contracts implement setPaused(bool) from StrategyAdapter pattern
        // or their own pause-aware logic
        if (level >= PauseLevel.RED) {
            try this._callSetPaused(target, true) {} catch {}
        } else if (level == PauseLevel.NONE) {
            try this._callSetPaused(target, false) {} catch {}
        }
        // YELLOW/ORANGE: contracts check level via registry directly
    }

    /// @notice External helper for calling setPaused on a target
    function _callSetPaused(address target, bool p) external {
        require(msg.sender == address(this), "Pause: internal only");
        (bool success, ) = target.call(
            abi.encodeWithSignature("setPaused(bool)", p)
        );
        if (!success) {
            // Contract may not implement setPaused — that's OK
        }
    }
}
