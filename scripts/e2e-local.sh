#!/bin/bash
# ===== YieldNest M0 E2E Test (Local Anvil) =====
# Tests the full flow: approve USDC -> deposit -> check position -> withdraw
# Requires: Anvil running on localhost:8545, contracts deployed

set -e

RPC=${RPC_URL:-http://localhost:8545}
KEY=${DEPLOYER_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}
DEPLOYER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Contract addresses from deployments/localhost.json
USDC=0x610178dA211FEF7D417bC0e6FeD39F05609AD788
VAULT=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

echo "===== YieldNest M0 E2E Test ====="
echo "RPC: $RPC"
echo "User: $DEPLOYER"
echo ""

# Step 1: Check initial balances
echo "[1/7] Checking initial USDC balance..."
BAL=$(cast call $USDC "balanceOf(address)(uint256)" $DEPLOYER --rpc-url $RPC)
echo "  USDC Balance: $BAL"

echo "[2/7] Checking initial vault state..."
TV=$(cast call $VAULT "totalValue()(uint256)" --rpc-url $RPC)
TS=$(cast call $VAULT "totalShares()(uint256)" --rpc-url $RPC)
USER_SHARES=$(cast call $VAULT "userShares(address)(uint256)" $DEPLOYER --rpc-url $RPC)
echo "  Total Value:  $TV"
echo "  Total Shares: $TS"
echo "  User Shares:  $USER_SHARES"

# Step 2: Approve USDC for vault
echo ""
echo "[3/7] Approving USDC spend..."
cast send $USDC "approve(address,uint256)" $VAULT 1000000000000 --rpc-url $RPC --private-key $KEY > /dev/null
echo "  Approved 1,000,000 USDC for vault"

# Step 3: Deposit USDC into vault (strategy 0)
echo ""
echo "[4/7] Depositing 1000 USDC into vault..."
cast send $VAULT "deposit(uint256,uint256)" 1000000000000 0 --rpc-url $RPC --private-key $KEY > /dev/null
echo "  Deposit sent"

# Step 4: Check updated position
echo ""
echo "[5/7] Checking updated position..."
sleep 2
TV=$(cast call $VAULT "totalValue()(uint256)" --rpc-url $RPC)
USER_SHARES=$(cast call $VAULT "userShares(address)(uint256)" $DEPLOYER --rpc-url $RPC)
SC=$(cast call $VAULT "strategyCount()(uint256)" --rpc-url $RPC)
echo "  Total Value:  $TV"
echo "  User Shares:  $USER_SHARES"
echo "  Strategy Count: $SC"

# Step 5: Check strategy info
echo ""
echo "[6/7] Checking strategy info..."
STRAT=$(cast call $VAULT "strategies(uint256)(address,uint256,uint256,bool)" 0 --rpc-url $RPC)
echo "  Strategy 0: $STRAT"

# Step 6: Withdraw
echo ""
echo "[7/7] Withdrawing all shares..."
cast send $VAULT "withdraw(uint256,address,uint256)" $USER_SHARES $DEPLOYER 0 --rpc-url $RPC --private-key $KEY > /dev/null
echo "  Withdrawal sent"

sleep 2
FINAL_BAL=$(cast call $USDC "balanceOf(address)(uint256)" $DEPLOYER --rpc-url $RPC)
echo ""
echo "===== E2E Test Complete ====="
echo "Final USDC balance: $FINAL_BAL"
echo "ALL STEPS PASSED"
