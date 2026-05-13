// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {StrategyAdapter} from "./StrategyAdapter.sol";

/// @title YieldNestVault
/// @notice Main vault contract for the YieldNest protocol.
/// Receives enterprise user funds and allocates them across strategy adapters.
/// Uses a share-based accounting system — users hold vault shares representing
/// their proportional claim on the vault's total assets.
contract YieldNestVault is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ===== Structs =====

    struct Strategy {
        address adapter; // StrategyAdapter contract
        uint256 targetWeight; // Target allocation weight in basis points (e.g. 6000 = 60%)
        uint256 currentWeight; // Current actual weight in basis points
        bool active;
    }

    struct UserPosition {
        uint256 shares; // Vault shares held
        uint256 lastClaimedYield; // Accumulated yield at last claim (for fee calc)
    }

    // ===== State Variables =====

    /// @notice The USDC token contract
    IERC20 public immutable usdc;

    /// @notice Mapping: user address => shares
    mapping(address => uint256) public userShares;

    /// @notice Mapping: user address => position metadata
    mapping(address => UserPosition) public userPositions;

    /// @notice Total vault shares in circulation
    uint256 public totalShares;

    /// @notice Array of strategy IDs for iteration
    uint256[] public strategyIds;

    /// @notice Mapping: strategyId => Strategy
    mapping(uint256 => Strategy) public strategies;

    /// @notice Next strategy ID counter
    uint256 public nextStrategyId;

    /// @notice Address that can call rebalance
    address public allocationEngine;

    /// @notice Platform fee recipient
    address public platformFeeRecipient;

    /// @notice Platform fee in basis points (e.g. 30 = 0.3%)
    uint256 public platformFeeBps;

    /// @notice Total accumulated platform fees available for withdrawal
    uint256 public accumulatedFees;

    /// @notice Minimum deposit amount
    uint256 public minDeposit;

    /// @notice Emergency pause registry
    address public pauseRegistry;

    // ===== Events =====

    event Deposited(
        address indexed user,
        address indexed asset,
        uint256 amount,
        uint256 shares,
        uint256 strategyId
    );

    event Withdrawn(
        address indexed user,
        address indexed asset,
        uint256 amount,
        uint256 shares
    );

    event StrategyAdded(
        uint256 indexed strategyId,
        address adapter,
        uint256 targetWeight
    );

    event StrategyUpdated(
        uint256 indexed strategyId,
        uint256 targetWeight,
        bool active
    );

    event StrategyRemoved(uint256 indexed strategyId);

    event Rebalanced(
        address indexed caller,
        uint256 indexed strategyId,
        uint256 previousWeight,
        uint256 newWeight
    );

    event YieldClaimed(address indexed user, uint256 grossYield, uint256 fee, uint256 netYield);

    event FeesWithdrawn(address indexed to, uint256 amount);

    event AllocationEngineUpdated(address indexed newEngine);

    // ===== Constructor =====

    constructor(
        address _usdc,
        address _platformFeeRecipient,
        uint256 _platformFeeBps,
        uint256 _minDeposit
    ) {
        require(_usdc != address(0), "Vault: zero USDC address");
        require(_platformFeeRecipient != address(0), "Vault: zero fee recipient");
        require(_platformFeeBps <= 1000, "Vault: fee too high"); // max 10%
        require(_minDeposit > 0, "Vault: zero min deposit");

        usdc = IERC20(_usdc);
        platformFeeRecipient = _platformFeeRecipient;
        platformFeeBps = _platformFeeBps;
        minDeposit = _minDeposit;
        allocationEngine = msg.sender;
    }

    // ===== Modifiers =====

    modifier onlyAllocationEngine() {
        require(msg.sender == allocationEngine, "Vault: not allocation engine");
        _;
    }

    // ===== Core User Functions =====

    /// @notice Deposit USDC into the vault and allocate to a strategy
    /// @param amount Amount of USDC to deposit
    /// @param strategyId The strategy to deposit into
    /// @return shares Number of vault shares minted
    function deposit(
        uint256 amount,
        uint256 strategyId
    ) external nonReentrant whenNotPaused returns (uint256 shares) {
        require(amount >= minDeposit, "Vault: below min deposit");

        Strategy storage strategy = strategies[strategyId];
        require(strategy.active, "Vault: strategy not active");

        // Calculate shares to mint
        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalValue();
        }
        require(shares > 0, "Vault: zero shares");

        // Transfer USDC from user
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Approve and deposit into strategy
        usdc.safeIncreaseAllowance(strategy.adapter, amount);
        StrategyAdapter(strategy.adapter).deposit(amount);

        // Update state
        userShares[msg.sender] += shares;
        totalShares += shares;
        strategy.currentWeight = _calculateWeight(strategyId);

        emit Deposited(msg.sender, address(usdc), amount, shares, strategyId);
    }

    /// @notice Withdraw USDC by burning vault shares
    /// @param shares Number of vault shares to burn
    /// @param recipient Address to receive the USDC
    /// @param strategyId Strategy to withdraw from
    /// @return amount Amount of USDC received
    function withdraw(
        uint256 shares,
        address recipient,
        uint256 strategyId
    ) external nonReentrant returns (uint256 amount) {
        require(shares > 0, "Vault: zero shares");
        require(userShares[msg.sender] >= shares, "Vault: insufficient shares");
        require(recipient != address(0), "Vault: zero recipient");

        Strategy storage strategy = strategies[strategyId];
        require(strategy.active, "Vault: strategy not active");

        // Calculate USDC value of shares
        amount = (shares * totalValue()) / totalShares;
        require(amount > 0, "Vault: zero withdrawal amount");

        // Burn shares first (checks-effects)
        userShares[msg.sender] -= shares;
        totalShares -= shares;

        // Withdraw from strategy
        StrategyAdapter adapter = StrategyAdapter(strategy.adapter);
        uint256 adapterShares;
        if (totalShares == 0) {
            // Last withdrawal — withdraw everything from adapter
            adapterShares = adapter.totalDeposited();
        } else {
            adapterShares = (shares * adapter.totalDeposited()) / (totalShares + shares);
        }
        adapter.withdraw(adapterShares);

        // Transfer USDC to recipient
        usdc.safeTransfer(recipient, amount);

        strategy.currentWeight = _calculateWeight(strategyId);

        emit Withdrawn(msg.sender, address(usdc), amount, shares);
    }

    // ===== Yield Functions =====

    /// @notice Claim accumulated yield for the caller
    function claimYield() external nonReentrant returns (uint256 netYield) {
        uint256 shares = userShares[msg.sender];
        require(shares > 0, "Vault: no shares");

        // Harvest from all strategies first
        _harvestAll();

        // Calculate user's share of accumulated fees
        uint256 totalValue_ = totalValue();
        uint256 userValue = (shares * totalValue_) / totalShares;

        // Fee calculation based on yield since last claim
        UserPosition storage pos = userPositions[msg.sender];
        uint256 grossYield = userValue > pos.lastClaimedYield
            ? userValue - pos.lastClaimedYield
            : 0;

        if (grossYield > 0) {
            uint256 fee = (grossYield * platformFeeBps) / 10000;
            netYield = grossYield - fee;
            accumulatedFees += fee;
            pos.lastClaimedYield = userValue;

            if (netYield > 0) {
                usdc.safeTransfer(msg.sender, netYield);
            }
        }

        emit YieldClaimed(msg.sender, grossYield, grossYield - netYield, netYield);
    }

    // ===== Admin Functions =====

    /// @notice Add a new strategy
    function addStrategy(
        address adapter,
        uint256 targetWeight
    ) external onlyAllocationEngine returns (uint256 strategyId) {
        require(adapter != address(0), "Vault: zero adapter");
        require(targetWeight <= 10000, "Vault: weight exceeds 100%");

        strategyId = nextStrategyId++;
        strategies[strategyId] = Strategy({
            adapter: adapter,
            targetWeight: targetWeight,
            currentWeight: 0,
            active: true
        });
        strategyIds.push(strategyId);

        emit StrategyAdded(strategyId, adapter, targetWeight);
    }

    /// @notice Update strategy parameters
    function updateStrategy(
        uint256 strategyId,
        uint256 targetWeight,
        bool active
    ) external onlyAllocationEngine {
        require(strategyId < nextStrategyId, "Vault: invalid strategy");
        require(targetWeight <= 10000, "Vault: weight exceeds 100%");

        Strategy storage strategy = strategies[strategyId];
        strategy.targetWeight = targetWeight;
        strategy.active = active;

        emit StrategyUpdated(strategyId, targetWeight, active);
    }

    /// @notice Remove a strategy (sets inactive, cannot delete from array)
    function removeStrategy(uint256 strategyId) external onlyAllocationEngine {
        require(strategyId < nextStrategyId, "Vault: invalid strategy");
        require(
            strategies[strategyId].currentWeight == 0 ||
                strategies[strategyId].currentWeight < 100,
            "Vault: strategy has funds"
        );

        strategies[strategyId].active = false;
        strategies[strategyId].targetWeight = 0;

        emit StrategyRemoved(strategyId);
    }

    /// @notice Set the allocation engine address
    function setAllocationEngine(address _engine) external onlyAllocationEngine {
        require(_engine != address(0), "Vault: zero engine");
        allocationEngine = _engine;
        emit AllocationEngineUpdated(_engine);
    }

    /// @notice Set the pause registry
    function setPauseRegistry(address _registry) external onlyAllocationEngine {
        pauseRegistry = _registry;
    }

    /// @notice Withdraw accumulated platform fees
    function withdrawFees() external {
        require(
            msg.sender == platformFeeRecipient,
            "Vault: not fee recipient"
        );
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        usdc.safeTransfer(platformFeeRecipient, amount);
        emit FeesWithdrawn(platformFeeRecipient, amount);
    }

    /// @notice Update platform fee in basis points
    function setPlatformFeeBps(uint256 _feeBps) external {
        require(msg.sender == platformFeeRecipient, "Vault: not fee recipient");
        require(_feeBps <= 1000, "Vault: fee too high");
        platformFeeBps = _feeBps;
    }

    // ===== View Functions =====

    /// @notice Get the total value of the vault in USDC
    function totalValue() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < strategyIds.length; i++) {
            uint256 sid = strategyIds[i];
            if (strategies[sid].active) {
                total += StrategyAdapter(strategies[sid].adapter).totalValue();
            }
        }
        return total;
    }

    /// @notice Get the number of active strategies
    function strategyCount() external view returns (uint256) {
        return strategyIds.length;
    }

    /// @notice Get all strategy IDs
    function getStrategyIds() external view returns (uint256[] memory) {
        return strategyIds;
    }

    // ===== Internal Functions =====

    /// @notice Harvest yield from all active strategies
    function _harvestAll() internal {
        for (uint256 i = 0; i < strategyIds.length; i++) {
            uint256 sid = strategyIds[i];
            if (strategies[sid].active) {
                try StrategyAdapter(strategies[sid].adapter).claimRewards() {
                    // Success
                } catch {
                    // Strategy claim failed — continue to next
                }
            }
        }
    }

    /// @notice Calculate current weight for a strategy
    function _calculateWeight(
        uint256 strategyId
    ) internal view returns (uint256) {
        uint256 total = totalValue();
        if (total == 0) return 0;
        uint256 strategyValue = StrategyAdapter(strategies[strategyId].adapter)
            .totalValue();
        return (strategyValue * 10000) / total;
    }
}
