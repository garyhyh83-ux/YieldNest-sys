# YieldNest-sys

企业级稳定币收益聚合平台 —— 零门槛链接传统中小企业与链上国债收益。

## 产品定位

YieldNest 将 BlackRock BUIDL、Ondo USDY、Aave、Morpho 等链上收益协议封装为「企业版余额宝」体验——用户无需理解私钥、Gas 费或 DeFi 协议，即可将企业闲置资金（USDC/USDT）存入并获得 4-5% 年化收益。

| 传统银行现金管理 | YieldNest |
|---|---|
| 0.01-0.5% 年化收益 | 4-5% 年化净收益 |
| 开户 2-4 周 | 线上入驻 15 分钟 |
| 仅限本国银行 | 全球资金统一管理 |
| 企业网银体验 | 现代 SaaS Dashboard |
| 无收益透明性 | 链上可验证、实时审计 |

## 核心特性

- **Gasless Experience** — ERC-4337 Paymaster 代付 Gas，用户使用 USDC 统一支付费用
- **Self-Custody with Safety Net** — 基于 Safe{Core} 的智能账户，用户始终拥有资产所有权
- **Passkey 认证** — WebAuthn 生物识别，防钓鱼、无需助记词
- **企业审批流** — 可配置的多级多签审批策略引擎
- **多链架构** — Base 链首发，架构预留 Arbitrum / Ethereum 多链扩展
- **合规优先** — KYB/AML 内建，所有操作生成可审计报告
- **API-First** — RESTful API + Webhook，支持与企业 ERP/财资系统对接

## 技术栈

| 层级 | 技术 |
|---|---|
| **智能合约** | Solidity 0.8.26, Foundry, Safe{Core} 5.x, ERC-4337 |
| **前端** | Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui |
| **后端服务** | Go (Account), Node.js (Auth/Approval) |
| **数据库** | PostgreSQL 16, Redis 7 |
| **基础设施** | Docker Compose, GitHub Actions CI/CD |
| **Web3** | Wagmi v3, Viem v2 |

## 项目结构

```
stablecoin/
├── contracts/                  # Solidity 智能合约 (Foundry)
│   ├── src/
│   │   ├── core/               # YieldNestAccount, AccountFactory, AccountRegistry
│   │   ├── vault/              # YieldNestVault, StrategyAdapter
│   │   ├── paymaster/          # YieldNestPaymaster (Gas 代付)
│   │   └── governance/         # EmergencyPause (熔断)
│   ├── script/                 # 部署脚本
│   └── test/                   # Foundry 测试
├── apps/web/                   # Next.js 前端应用
│   └── src/
│       ├── app/                # App Router 页面
│       ├── components/         # UI 组件 (shadcn/ui)
│       └── lib/                # API 客户端 & 工具
├── packages/shared-types/      # 共享 TypeScript 类型
├── services/
│   ├── account/                # Go 账户服务 (REST API + 数据库迁移)
│   └── auth/                   # Node.js 认证服务 (Passkey + JWT)
├── docker/                     # Docker Compose (PostgreSQL + Redis)
├── scripts/                    # 开发辅助脚本
└── pnpm-workspace.yaml         # pnpm monorepo 配置
```

## 快速开始

### 环境要求

- Node.js >= 22
- pnpm >= 9
- Go >= 1.22 (account service)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (智能合约开发)
- Docker Desktop

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动基础设施

```bash
pnpm docker:up
```

### 3. 运行数据库迁移

```bash
pnpm db:migrate
```

### 4. 启动开发服务

```bash
pnpm dev
```

启动后：
- 前端: http://localhost:3000
- Auth 服务: http://localhost:4000
- Account 服务: http://localhost:8080

### 5. 智能合约开发

```bash
# 编译合约
pnpm build:contracts

# 运行测试
pnpm test:contracts
```

## 收益策略

| 策略 | 底层协议 | 风险等级 | 预期 APY |
|---|---|---|---|
| Treasury Core | BlackRock BUIDL (短期美债) | 极低 | 4.2-4.8% |
| Treasury Plus | Ondo USDY | 低 | 4.5-5.2% |
| DeFi Prime | Aave V4 USDC | 低 | 3.5-6% |
| Morpho Optimizer | Morpho Blue Vaults | 低-中 | 4-7% |
| Basis Trade | Ethena USDe | 中 | 6-12% |

## 开发路线图

### Phase 0 — 基础建设 (M1-M2)
核心智能合约开发 (Vault + AccountFactory + Paymaster)，Auth Service + Account Service，测试网部署。

### Phase 1 — MVP (M3-M4)
前端核心页面，BUIDL 策略适配器，Passkey 认证，KYB 集成，封闭 Alpha 测试。

### Phase 2 — 增强 (M5-M6)
多签审批流，Aave + Morpho 适配器，报表系统，外部安全审计。

### Phase 3 — 规模化 (M7-M12)
多链扩展，企业 API + Webhook，移动端 App，正式版 GA。

## 安全

- 智能合约: Trail of Bits + Spearbit 审计，Certora 形式化验证
- Bug Bounty: Immunefi ($50K-$500K)
- 合约保险: Nexus Mutual
- 平台密钥: AWS KMS + HSM
- 用户密钥: WebAuthn Passkey (客户端签名，永不接触服务器)

详细系统设计见 [yieldnest-system-spec.md](./yieldnest-system-spec.md)
