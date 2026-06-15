## 手动

  1. 安装缺失的工具链

  # Foundry (Solidity 合约编译/测试) —
  上次网络问题没装成，再试一次
  curl -L https://foundry.paradigm.xyz | bash
  foundryup

  # Go 1.22+ (Account Service) — 用官方安装器
  # 下载 https://go.dev/dl/go1.22.windows-amd64.msi 安装      

  2. 生成 JWT 密钥对

  mkdir keys
  openssl genpkey -algorithm RSA -out keys/jwt-private.pem    
  -pkeyopt rsa_keygen_bits:2048
  openssl rsa -pubout -in keys/jwt-private.pem -out
  keys/jwt-public.pem

  3. 启动基础设施 + 迁移数据库

  docker compose -f docker/compose.yaml up -d
  # 等 PostgreSQL ready 后安装 Go 的话运行：
  cd services/account && go run cmd/migrate/main.go up        

  4. 安装依赖 + 启动全栈

  pnpm install
  pnpm dev
  # Auth: :3100 | Account: :3200 | Web: :3000

  5. 验证合约

  cd contracts && forge test --gas-report