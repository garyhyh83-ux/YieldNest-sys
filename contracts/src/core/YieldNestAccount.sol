// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

/// @title YieldNestAccount
/// @notice ERC-4337 compatible smart account for enterprise users.
///
/// In production, this contract is deployed via Safe{Core} AccountFactory
/// as a Safe smart account with YieldNest-specific modules.
/// For Phase 0, this is a standalone implementation demonstrating
/// the enterprise account structure and access control patterns.
contract YieldNestAccount {
    // ===== State =====

    /// @notice Unique enterprise identifier (bytes32 hash)
    bytes32 public enterpriseId;

    /// @notice Human-readable enterprise name
    string public enterpriseName;

    /// @notice Account owners (passkey public key hashes, EOA addresses, etc.)
    address[] public owners;

    /// @notice Required signature threshold
    uint256 public threshold;

    /// @notice Mapping: owner address => is owner
    mapping(address => bool) public isOwner;

    /// @notice Number of nonce used (for replay protection)
    uint256 public nonce;

    /// @notice Daily withdrawal tracking
    mapping(uint256 => uint256) public dailyWithdrawn; // day => amount

    /// @notice Maximum daily withdrawal limit (0 = unlimited)
    uint256 public dailyLimit;

    /// @notice Mapping: whitelisted withdrawal address => is whitelisted
    mapping(address => bool) public whitelist;

    // ===== Events =====

    event EnterpriseLinked(bytes32 indexed enterpriseId, string name);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 newThreshold);
    event WhitelistUpdated(address indexed addr, bool added);
    event DailyLimitChanged(uint256 newLimit);
    event Executed(address indexed to, uint256 value, bytes data);

    // ===== Modifiers =====

    modifier onlySelf() {
        require(msg.sender == address(this), "Account: only self");
        _;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Account: not owner");
        _;
    }

    // ===== Constructor / Initializer =====

    /// @notice Initialize the account (called by factory via CREATE2)
    function initialize(
        bytes32 _enterpriseId,
        string calldata _enterpriseName,
        address[] calldata _owners,
        uint256 _threshold
    ) external {
        require(enterpriseId == bytes32(0), "Account: already initialized");
        require(_owners.length > 0, "Account: no owners");
        require(_threshold > 0 && _threshold <= _owners.length, "Account: invalid threshold");

        enterpriseId = _enterpriseId;
        enterpriseName = _enterpriseName;
        threshold = _threshold;

        for (uint256 i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Account: zero owner");
            require(!isOwner[_owners[i]], "Account: duplicate owner");
            isOwner[_owners[i]] = true;
            owners.push(_owners[i]);
            emit OwnerAdded(_owners[i]);
        }

        emit EnterpriseLinked(_enterpriseId, _enterpriseName);
    }

    // ===== Execution =====

    /// @notice Execute a transaction from this account
    /// @param to Target address
    /// @param value ETH value to send
    /// @param data Calldata
    /// @return result Return data
    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external onlyOwner returns (bytes memory result) {
        // Daily limit enforcement for ETH transfers
        if (value > 0 && dailyLimit > 0) {
            uint256 day = block.timestamp / 1 days;
            require(
                dailyWithdrawn[day] + value <= dailyLimit,
                "Account: daily limit exceeded"
            );
            dailyWithdrawn[day] += value;
        }

        nonce++;
        (bool success, bytes memory returnData) = to.call{value: value}(data);
        require(success, "Account: execution failed");

        emit Executed(to, value, data);
        return returnData;
    }

    /// @notice Execute a USDC transfer (enforces whitelist)
    /// @param usdcToken USDC token address
    /// @param to Recipient address
    /// @param amount Amount in USDC units
    function executeUsdcTransfer(
        address usdcToken,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(whitelist[to], "Account: recipient not whitelisted");

        // Daily limit enforcement
        if (dailyLimit > 0) {
            uint256 day = block.timestamp / 1 days;
            require(
                dailyWithdrawn[day] + amount <= dailyLimit,
                "Account: daily limit exceeded"
            );
            dailyWithdrawn[day] += amount;
        }

        nonce++;
        (bool success, bytes memory returnData) = usdcToken.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                to,
                amount
            )
        );
        require(success, "Account: USDC transfer failed");

        emit Executed(usdcToken, 0, returnData);
    }

    // ===== Owner Management =====

    /// @notice Add a new owner (requires threshold signatures off-chain)
    function addOwner(address newOwner) external {
        require(msg.sender == address(this), "Account: requires self-call via execute");
        require(newOwner != address(0), "Account: zero owner");
        require(!isOwner[newOwner], "Account: already owner");

        isOwner[newOwner] = true;
        owners.push(newOwner);
        emit OwnerAdded(newOwner);
    }

    /// @notice Remove an owner
    function removeOwner(address owner, uint256 newThreshold) external {
        require(msg.sender == address(this), "Account: requires self-call via execute");
        require(isOwner[owner], "Account: not owner");
        require(owners.length - 1 >= newThreshold, "Account: invalid threshold");

        isOwner[owner] = false;
        threshold = newThreshold;
        emit OwnerRemoved(owner);
        emit ThresholdChanged(newThreshold);
    }

    /// @notice Change threshold
    function changeThreshold(uint256 newThreshold) external {
        require(msg.sender == address(this), "Account: requires self-call via execute");
        require(newThreshold > 0 && newThreshold <= owners.length, "Account: invalid threshold");
        threshold = newThreshold;
        emit ThresholdChanged(newThreshold);
    }

    // ===== Whitelist Management =====

    /// @notice Add address to withdrawal whitelist
    function addToWhitelist(address addr) external {
        require(msg.sender == address(this), "Account: requires self-call via execute");
        whitelist[addr] = true;
        emit WhitelistUpdated(addr, true);
    }

    /// @notice Remove address from withdrawal whitelist
    function removeFromWhitelist(address addr) external {
        require(msg.sender == address(this), "Account: requires self-call via execute");
        whitelist[addr] = false;
        emit WhitelistUpdated(addr, false);
    }

    // ===== Admin =====

    /// @notice Set daily withdrawal limit
    function setDailyLimit(uint256 _limit) external {
        require(msg.sender == address(this), "Account: requires self-call via execute");
        dailyLimit = _limit;
        emit DailyLimitChanged(_limit);
    }

    /// @notice Get all owners
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    /// @notice Check if account can receive ETH
    receive() external payable {}
}
