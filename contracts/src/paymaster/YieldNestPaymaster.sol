// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title YieldNestPaymaster
/// @notice ERC-4337 Paymaster contract that sponsors gas fees for YieldNest users.
///
/// Supports three sponsor modes:
/// - USDC: User pays gas in USDC at spot rate
/// - Subsidized: Gas is fully sponsored (promotional period)
/// - Monthly billing: Gas tracked and billed at end of month
///
/// Production implementation wraps Pimlico/Stackup Paymaster with ERC-4337 EntryPoint v0.7.
/// Phase 0 demonstrates the core gas sponsorship logic.
contract YieldNestPaymaster is AccessControl {
    using SafeERC20 for IERC20;

    // ===== Roles =====

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ===== Enums =====

    enum SponsorMode {
        USDC, // User pays gas in USDC at spot rate
        SUBSIDIZED, // Platform fully sponsors gas
        MONTHLY_BILLING // Gas tracked, billed end of month
    }

    // ===== Structs =====

    struct GasUsage {
        uint256 totalGasUsed;
        uint256 totalUsdcCharged;
        uint256 lastBilledAt;
    }

    // ===== State Variables =====

    /// @notice The USDC token
    IERC20 public immutable usdc;

    /// @notice The native gas token (ETH on Ethereum, etc.)
    address public constant NATIVE_TOKEN = address(0);

    /// @notice Platform owner who can withdraw accumulated gas fees
    address public platformOwner;

    /// @notice Mapping: account => whether it's whitelisted for paymaster
    mapping(address => bool) public whitelistedAccounts;

    /// @notice Mapping: account => sponsor mode
    mapping(address => SponsorMode) public sponsorModes;

    /// @notice Mapping: account => gas usage tracking
    mapping(address => GasUsage) public gasUsage;

    /// @notice USDC amount per unit of gas (e.g. 0.000001 USDC per gas)
    uint256 public usdcPerGas;

    /// @notice ETH amount to top up this contract for gas sponsorship
    uint256 public accumulatedEth;

    /// @notice Maximum gas per UserOperation
    uint256 public maxGasPerOp;

    // ===== Events =====

    event AccountWhitelisted(address indexed account, SponsorMode mode);
    event AccountRemoved(address indexed account);
    event SponsorModeChanged(address indexed account, SponsorMode newMode);
    event GasSponsored(
        address indexed account,
        uint256 gasUsed,
        uint256 usdcCharged,
        uint256 ethPaid
    );
    event EthDeposited(address indexed from, uint256 amount);
    event EthWithdrawn(address indexed to, uint256 amount);
    event MonthlyBillSettled(address indexed account, uint256 usdcAmount);

    // ===== Constructor =====

    constructor(
        address _usdc,
        address _platformOwner,
        uint256 _usdcPerGas,
        uint256 _maxGasPerOp
    ) {
        require(_usdc != address(0), "Paymaster: zero USDC");
        require(_platformOwner != address(0), "Paymaster: zero owner");
        require(_usdcPerGas > 0, "Paymaster: zero gas rate");

        usdc = IERC20(_usdc);
        platformOwner = _platformOwner;
        usdcPerGas = _usdcPerGas;
        maxGasPerOp = _maxGasPerOp;

        _grantRole(DEFAULT_ADMIN_ROLE, _platformOwner);
        _grantRole(OPERATOR_ROLE, _platformOwner);
    }

    // ===== Account Management =====

    /// @notice Whitelist an account for gas sponsorship
    function whitelistAccount(
        address account,
        SponsorMode mode
    ) external onlyRole(OPERATOR_ROLE) {
        require(account != address(0), "Paymaster: zero account");
        whitelistedAccounts[account] = true;
        sponsorModes[account] = mode;
        emit AccountWhitelisted(account, mode);
    }

    /// @notice Remove an account from whitelist
    function removeAccount(address account) external onlyRole(OPERATOR_ROLE) {
        whitelistedAccounts[account] = false;
        emit AccountRemoved(account);
    }

    /// @notice Change sponsor mode for an account
    function setSponsorMode(
        address account,
        SponsorMode mode
    ) external onlyRole(OPERATOR_ROLE) {
        require(whitelistedAccounts[account], "Paymaster: not whitelisted");
        sponsorModes[account] = mode;
        emit SponsorModeChanged(account, mode);
    }

    // ===== Gas Sponsorship =====

    /// @notice Called by the ERC-4337 bundler before executing a UserOp.
    /// In production, this is called by the EntryPoint contract.
    /// @param account The smart account executing the UserOp
    /// @param gasLimit Gas limit for this UserOp
    /// @return canSponsor Whether gas can be sponsored
    /// @return usdcCost Amount of USDC to charge (0 if subsidized)
    function validateSponsorship(
        address account,
        uint256 gasLimit
    ) external onlyRole(OPERATOR_ROLE) returns (bool canSponsor, uint256 usdcCost) {
        require(whitelistedAccounts[account], "Paymaster: account not whitelisted");
        require(gasLimit <= maxGasPerOp, "Paymaster: gas limit exceeded");

        SponsorMode mode = sponsorModes[account];
        if (mode == SponsorMode.SUBSIDIZED) {
            usdcCost = 0;
        } else {
            // USDC or MONTHLY_BILLING: calculate USDC cost
            usdcCost = gasLimit * usdcPerGas;

            if (mode == SponsorMode.USDC) {
                // Verify user has sufficient USDC allowance
                require(
                    usdc.allowance(account, address(this)) >= usdcCost,
                    "Paymaster: insufficient USDC allowance"
                );
            }
            // MONTHLY_BILLING: accumulates, settled end of month
        }

        canSponsor = true;
    }

    /// @notice Settle gas payment after successful UserOp execution
    function settleGas(
        address account,
        uint256 gasUsed,
        uint256 ethSpent
    ) external onlyRole(OPERATOR_ROLE) {
        SponsorMode mode = sponsorModes[account];
        uint256 usdcCost = gasUsed * usdcPerGas;

        if (mode == SponsorMode.USDC) {
            // Charge user's USDC
            usdc.safeTransferFrom(account, platformOwner, usdcCost);
        } else if (mode == SponsorMode.SUBSIDIZED) {
            // Platform absorbs cost — track for analytics
        } else if (mode == SponsorMode.MONTHLY_BILLING) {
            // Accumulate for end-of-month billing
        }

        // Track gas usage
        gasUsage[account].totalGasUsed += gasUsed;
        gasUsage[account].totalUsdcCharged += usdcCost;

        emit GasSponsored(account, gasUsed, usdcCost, ethSpent);
    }

    /// @notice Settle monthly bill for a monthly-billing account
    function settleMonthlyBill(
        address account
    ) external onlyRole(OPERATOR_ROLE) returns (uint256 usdcAmount) {
        require(
            sponsorModes[account] == SponsorMode.MONTHLY_BILLING,
            "Paymaster: not monthly billing"
        );
        GasUsage storage usage = gasUsage[account];
        usdcAmount = usage.totalUsdcCharged;

        if (usdcAmount > 0) {
            usdc.safeTransferFrom(account, platformOwner, usdcAmount);
            usage.totalUsdcCharged = 0;
            usage.lastBilledAt = block.timestamp;
        }

        emit MonthlyBillSettled(account, usdcAmount);
    }

    // ===== ETH Management =====

    /// @notice Deposit ETH to fund gas sponsorship
    function depositEth() external payable {
        accumulatedEth += msg.value;
        emit EthDeposited(msg.sender, msg.value);
    }

    /// @notice Withdraw accumulated ETH (platform owner only)
    function withdrawEth(
        address to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount <= accumulatedEth, "Paymaster: insufficient ETH");
        accumulatedEth -= amount;
        (bool success, ) = to.call{value: amount}("");
        require(success, "Paymaster: ETH transfer failed");
        emit EthWithdrawn(to, amount);
    }

    // ===== Configuration =====

    /// @notice Update USDC per gas rate
    function setUsdcPerGas(
        uint256 _usdcPerGas
    ) external onlyRole(OPERATOR_ROLE) {
        require(_usdcPerGas > 0, "Paymaster: zero rate");
        usdcPerGas = _usdcPerGas;
    }

    /// @notice Update max gas per operation
    function setMaxGasPerOp(
        uint256 _maxGasPerOp
    ) external onlyRole(OPERATOR_ROLE) {
        maxGasPerOp = _maxGasPerOp;
    }

    // ===== View Functions =====

    /// @notice Get the estimated USDC cost for a gas limit
    function estimateUsdcCost(
        uint256 gasLimit
    ) external view returns (uint256) {
        return gasLimit * usdcPerGas;
    }

    /// @notice Get gas usage stats for an account
    function getGasUsage(
        address account
    ) external view returns (GasUsage memory) {
        return gasUsage[account];
    }

    /// @notice Allow receiving ETH
    receive() external payable {
        accumulatedEth += msg.value;
        emit EthDeposited(msg.sender, msg.value);
    }
}
