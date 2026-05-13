# YieldNest 系统功能说明书及架构设计

> **版本**: v1.0  
> **日期**: 2026-05-11  
> **状态**: 详细设计阶段  
> **目标**: 企业级稳定币收益聚合器 — 零门槛链接传统中小企业与链上国债收益  

---

## 目录

1. [产品概述](#1-产品概述)
2. [用户角色与画像](#2-用户角色与画像)
3. [功能模块详述](#3-功能模块详述)
   - 3.1 [企业入驻与 KYB](#31-企业入驻与-kyb)
   - 3.2 [智能账户系统](#32-智能账户系统)
   - 3.3 [入金与出金](#33-入金与出金)
   - 3.4 [收益策略引擎](#34-收益策略引擎)
   - 3.5 [多签审批流](#35-多签审批流)
   - 3.6 [仪表盘与报表](#36-仪表盘与报表)
   - 3.7 [风险管控](#37-风险管控)
   - 3.8 [合规审计追踪](#38-合规审计追踪)
4. [系统架构](#4-系统架构)
   - 4.1 [总体架构概览](#41-总体架构概览)
   - 4.2 [前端架构](#42-前端架构)
   - 4.3 [后端微服务架构](#43-后端微服务架构)
   - 4.4 [区块链交互层](#44-区块链交互层)
   - 4.5 [数据层设计](#45-数据层设计)
5. [智能合约设计](#5-智能合约设计)
6. [API 接口设计](#6-api-接口设计)
7. [安全架构设计](#7-安全架构设计)
8. [部署与运维架构](#8-部署与运维架构)
9. [开发路线图](#9-开发路线图)

---

## 1. 产品概述

### 1.1 产品定位

YieldNest 是一个**面向企业用户的链上稳定币收益聚合平台**。它将 BlackRock BUIDL、Ondo USDY、Aave、Morpho 等链上收益协议封装为「企业版余额宝」体验——用户无需理解私钥、Gas 费或 DeFi 协议，即可将企业闲置资金（USDC/USDT）存入并获得 4-5% 年化收益。

### 1.2 核心价值主张

| 传统银行现金管理 | YieldNest |
|---|---|
| 0.01-0.5% 年化收益 | 4-5% 年化净收益 |
| 开户 2-4 周 | 线上入驻 15 分钟 |
| 仅限本国银行 | 全球资金统一管理 |
| 企业网银体验 | 现代 SaaS Dashboard |
| 无收益透明性 | 链上可验证、实时审计 |

### 1.3 技术设计原则

- **Gasless Experience**: 用户所有链上操作均通过 Paymaster 代付 Gas，用户使用 USDC 统一支付费用
- **Self-Custody with Safety Net**: ERC-4337 智能账户，用户始终拥有资产所有权，同时提供社交恢复和企业审批流
- **Multi-Chain by Default**: 初始部署 Base 链，架构预留 Arbitrum / Ethereum / Solana 多链扩展能力
- **Compliance First**: KYB/AML 内建，所有链上操作生成可审计的合规报告
- **API-First**: 所有功能均提供 RESTful API，支持企业与现有 ERP/财资系统对接

---

## 2. 用户角色与画像

### 2.1 角色定义

| 角色 | 描述 | 核心需求 |
|---|---|---|
| **企业管理员 (Company Admin)** | 中小企业 CFO / 财务主管 | 注册企业、管理团队成员、设置权限策略、审批大额交易 |
| **财务操作员 (Treasury Operator)** | 企业财务人员 | 执行日常存/取操作、查看收益报表、导出会计凭证 |
| **审批人 (Approver)** | 按审批策略指定的高级管理人员 | 审批超出阈值的交易、确认策略变更 |
| **只读审计员 (Auditor)** | 外部审计师 / 合规官 | 查看所有交易记录、导出审计报告、验证链上数据 |
| **平台运营 (Platform Operator)** | YieldNest 内部运营 | 处理 KYB 复审、监控异常交易、管理收益策略参数 |
| **平台管理员 (Platform Admin)** | YieldNest 技术管理员 | 系统配置、合约升级（多签）、紧急暂停 |

### 2.2 目标客户画像

```
企业规模:     50-500 人
年营收:       $5M - $200M
闲置现金:     $100K - $5M
行业:         跨境电商、SaaS、贸易公司、加密基金财库、DAO 财库
痛点:         银行利息过低、希望多样化现金管理、已持有 USDC/USDT 但不了解 DeFi
决策人:       CFO / 财务总监
决策周期:     2-8 周
```

---

## 3. 功能模块详述

### 3.1 企业入驻与 KYB

#### 3.1.1 入驻流程

```
[注册邮箱] → [邮箱验证] → [填写企业信息] → [上传证件] → [法人代表人脸识别]
→ [自动 KYB 初审 (5分钟)] → [人工复审 (最多1个工作日)] → [开通企业账户]
```

#### 3.1.2 KYB 数据采集

| 字段 | 类型 | 说明 |
|---|---|---|
| 企业法定名称 | 文本 | 与工商注册一致 |
| 注册号/统一社会信用代码 | 文本 | 支持全球主要司法管辖区格式 |
| 注册地 | 下拉选择 | ISO 3166 国家/地区 |
| 企业类型 | 枚举 | LLC / Corp / Partnership / Foundation / DAO |
| 经营证明文件 | 文件上传 | 营业执照 / Certificate of Incorporation |
| 股权结构 | 结构化数据 | 持股 ≥25% 的最终受益人 (UBO) |
| UBO 身份信息 | 个人 KYC | 每个 UBO 需完成独立身份验证 |
| 资金来源声明 | 枚举 + 文件 | 经营收入 / 投资收入 / 其他 |
| 钱包地址白名单 | 地址列表 | 企业自有钱包地址（出金白名单） |

#### 3.1.3 KYB 提供商集成

- **主供应商**: Persona / Sumsub（企业版）
- **区块链分析**: Chainalysis KYT / TRM Labs（钱包风险评分）
- **制裁名单筛查**: ComplyAdvantage / Refinitiv World-Check
- **法人代表人脸识别**: Onfido / Jumio

#### 3.1.4 功能规格

| 需求编号 | 功能 | 优先级 |
|---|---|---|
| F-KYB-01 | 企业信息在线填写与证件上传 | P0 |
| F-KYB-02 | UBO 声明（≥25% 受益人）及个人 KYC | P0 |
| F-KYB-03 | 自动 KYB 初审（OCR + API 交叉验证） | P0 |
| F-KYB-04 | 人工复审后台（运营端） | P0 |
| F-KYB-05 | 钱包地址白名单管理（添加/删除/审批） | P0 |
| F-KYB-06 | 制裁名单实时筛查 | P0 |
| F-KYB-07 | 入驻状态追踪与通知（邮件/短信） | P1 |
| F-KYB-08 | 证件到期提醒与更新 | P1 |
| F-KYB-09 | 多企业关联管理（集团客户） | P2 |
| F-KYB-10 | KYB 数据定期复核（年度） | P1 |

---

### 3.2 智能账户系统

YieldNest 基于 **ERC-4337 智能账户 (Account Abstraction)** 构建企业级账户体系，替代传统 EOA 钱包。

#### 3.2.1 账户架构

```
┌──────────────────────────────────────┐
│         YieldNest Smart Account      │
│  (基于 Safe{Core} 协议扩展)          │
├──────────────────────────────────────┤
│  ┌──────────────┐ ┌───────────────┐  │
│  │  所有权模块   │ │  权限策略模块  │  │
│  │              │ │               │  │
│  │ · Email 恢复 │ │ · 角色权限    │  │
│  │ · 社交恢复   │ │ · 多签规则    │  │
│  │ · 硬件密钥   │ │ · 额度限制    │  │
│  └──────────────┘ └───────────────┘  │
│  ┌──────────────┐ ┌───────────────┐  │
│  │  执行模块     │ │   Hook 模块   │  │
│  │              │ │               │  │
│  │ · 批量交易   │ │ · 事前检查    │  │
│  │ · 委托调用   │ │ · 事后通知    │  │
│  │ · Paymaster  │ │ · 合规拦截    │  │
│  └──────────────┘ └───────────────┘  │
└──────────────────────────────────────┘
```

#### 3.2.2 账户创建流程

```
1. 企业完成 KYB 后，系统自动为企业在 Base 链部署智能账户
2. 部署基于 Safe{Core} Account Factory，使用 CREATE2 确定性地址
3. 初始所有者设为:
   - 企业管理员邮箱绑定的 Passkey (WebAuthn)
   - 平台应急恢复密钥（平台级多签控制，仅用于紧急情况）
4. 账户地址注册到 YieldNest 链上注册表
5. 企业可后续添加更多所有者和调整阈值
```

#### 3.2.3 密钥管理方案

| 密钥类型 | 技术实现 | 用途 | 安全等级 |
|---|---|---|---|
| **Passkey (WebAuthn)** | 设备生物识别 (Face ID / Touch ID / Windows Hello) | 日常操作签名 | 高 |
| **Email Magic Link** | OTP + 限时链接 | 新设备授权 / 恢复 | 中 |
| **硬件安全密钥** | YubiKey / Ledger | 大额审批 / 管理员操作 | 极高 |
| **平台应急密钥** | 平台 3-of-5 多签 | 紧急账户恢复 / 合规冻结 | 极高（仅限极端情况）|
| **备份助记词** | BIP-39 (可选) | 灾难恢复 | 高（离线保管）|

#### 3.2.4 Gas 费抽象 (Paymaster)

```
用户发起操作 → UserOp 构建 → Paymaster 验证
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
               USDC 支付     月度账单       平台补贴
               (默认)        (大客户)      (推广期)

实现: 基于 Pimlico / Stackup Paymaster 服务,
      用户使用 USDC 按即时汇率支付 Gas,
      YieldNest 后端批量向 Paymaster 充值 ETH。
```

#### 3.2.5 功能规格

| 需求编号 | 功能 | 优先级 |
|---|---|---|
| F-AA-01 | 基于 WebAuthn 的 Passkey 创建与导入 | P0 |
| F-AA-02 | ERC-4337 智能账户部署 (Safe 5.x) | P0 |
| F-AA-03 | USDC 支付 Gas (Paymaster) | P0 |
| F-AA-04 | Email Magic Link 恢复流程 | P0 |
| F-AA-05 | 多所有者管理 (添加/移除/阈值) | P1 |
| F-AA-06 | 硬件安全密钥集成 (YubiKey / Ledger) | P1 |
| F-AA-07 | 社交恢复（信任联系人/团队管理员） | P2 |
| F-AA-08 | 账户活动实时通知 | P1 |
| F-AA-09 | 多链智能账户同步部署 | P2 |
| F-AA-10 | 批量交易 (multicall) 支持 | P1 |

---

### 3.3 入金与出金

#### 3.3.1 入金通道

| 通道 | 支持币种 | 到账时间 | 限额 | 费用 |
|---|---|---|---|---|
| **链上转账** | USDC, USDT | ~1分钟 | 无上限 | 仅网络 Gas |
| **银行电汇 (Wire)** | USD → USDC | 1-2 工作日 | $10K-$5M | 0.1% |
| **ACH 转账** | USD → USDC | 1-3 工作日 | $1K-$250K | 0.05% |
| **信用卡/借记卡** | USD → USDC | 即时 | $500-$25K/日 | 2.5% |

#### 3.3.2 入金流程（链上转账）

```
1. 用户点击「入金」, 系统展示专属智能账户地址 (QR + 文本)
2. 用户从外部钱包发送 USDC 到该地址
3. 后端监听链上 Transfer 事件 (USDC Contract)
4. 确认后 (Base: 6区块 / ~12秒), 前端显示「已到账」
5. 资金自动进入收益策略 (默认策略: BUIDL-USDC Vault)
6. 用户收到入金确认邮件 + 链上 TX Hash
```

#### 3.3.3 出金流程

```
1. 用户点击「出金」, 输入金额和目的地址
2. 系统检查:
   a. 目的地址是否在白名单中
   b. 金额是否超过用户权限额度
   c. 是否需要多签审批
3. 如果需要审批 → 触发审批流 (见 3.5)
4. 审批通过后:
   a. 从收益策略中赎回 USDC (如赎回有延迟, 显示预计到账时间)
   b. 构建 UserOp → Paymaster 支付 Gas → 链上执行
5. 发送 USDC 到目的地址
6. 用户收到出金确认邮件 + 链上 TX Hash
```

> **赎回延迟说明**: BUIDL 在银行营业时间内赎回几乎是即时的（<5分钟），但非营业时间需等到下一个银行工作日。前端需明确展示预期到账时间。

#### 3.3.4 功能规格

| 需求编号 | 功能 | 优先级 |
|---|---|---|
| F-INOUT-01 | 链上 USDC/USDT 入金 (监听 + 确认) | P0 |
| F-INOUT-02 | 链上 USDC/USDT 出金 (白名单 + 审批) | P0 |
| F-INOUT-03 | 银行电汇入金 (USD → USDC) | P0 |
| F-INOUT-04 | ACH 入金 | P1 |
| F-INOUT-05 | 入金/出金历史与状态追踪 | P0 |
| F-INOUT-06 | 出金白名单管理 | P0 |
| F-INOUT-07 | 交易限额配置 (日限/单笔/角色) | P0 |
| F-INOUT-08 | 批量出金 (多笔→单笔 UserOp) | P1 |
| F-INOUT-09 | 周期性自动入金 (从银行账户) | P2 |
| F-INOUT-10 | 出金撤销 (未上链前) | P1 |

---

### 3.4 收益策略引擎

#### 3.4.1 底层收益源 (Vaults)

| 策略名称 | 底层协议 | 底层资产 | 预期 APY | 风险等级 | 赎回延迟 | 最低金额 |
|---|---|---|---|---|---|---|
| **Treasury Core** | BlackRock BUIDL | 短期美债+回购 | 4.2-4.8% | 极低 | 0-1 工作日 | $10K |
| **Treasury Plus** | Ondo USDY | 短期美债 | 4.5-5.2% | 低 | 0-1 工作日 | $5K |
| **DeFi Prime** | Aave V4 USDC | 超额抵押借贷 | 3.5-6% | 低 | 即时 | $1K |
| **Morpho Optimizer** | Morpho Blue Vaults | 优化借贷市场 | 4-7% | 低-中 | 即时 | $1K |
| **Basis Trade** | Ethena USDe | Delta 中性基差 | 6-12% | 中 | 0-7 天 | $10K |
| **Composite** | 多策略自动分配 | 以上混合 | 4-6% | 低-中 | 部分即时 | $10K |

#### 3.4.2 智能分配引擎

```
                    ┌─────────────┐
                    │  用户资金    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  分配引擎    │
                    │             │
                    │ · 风险评分  │
                    │ · 流动性需求│
                    │ · 收益率排序│
                    │ · 合规约束  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  ┌──────────┐      ┌──────────┐      ┌──────────┐
  │ Treasury │      │  DeFi    │      │  Basis   │
  │  Core 60%│      │ Prime 25%│      │ Trade 15%│
  └──────────┘      └──────────┘      └──────────┘
```

**分配策略配置参数**:

| 参数 | 说明 | 默认值 |
|---|---|---|
| `risk_profile` | 风险偏好 (conservative / moderate / aggressive) | conservative |
| `liquidity_ratio` | 保持即时可赎回的比例 | 30% |
| `max_single_exposure` | 单一策略最大占比 | 60% |
| `rebalance_threshold` | 触发再平衡的偏离阈值 | 5% |
| `min_yield_differential` | 切换策略的最小收益差 | 1% |
| `compound_frequency` | 收益复投频率 | daily |

#### 3.4.3 收益计算与分发

```
每日 00:00 UTC:
  1. 快照每个用户的策略份额
  2. 查询各底层协议的当日应计收益
  3. 扣除管理费 (年化 0.3-0.5%, 按日计提)
  4. 计算每个用户的净收益
  5. 更新用户余额 (如果策略是自动复投) 或 累积到待领取余额
  6. 生成日收益报告
```

#### 3.4.4 再平衡策略

- **定时再平衡**: 每周日 00:00 UTC 检查分配偏离
- **阈值再平衡**: 任一策略占比偏离 >5% 触发再平衡
- **再平衡执行**:
  1. 计算目标分配 vs 当前分配
  2. 生成操作列表 (从策略A赎回、存入策略B)
  3. 批量构建 UserOp
  4. 通过 Paymaster 提交
  5. 记录再平衡事件到审计日志

#### 3.4.5 功能规格

| 需求编号 | 功能 | 优先级 |
|---|---|---|
| F-YIELD-01 | 预定义风险策略模板 (保守/均衡/进取) | P0 |
| F-YIELD-02 | 自动分配与再平衡 | P0 |
| F-YIELD-03 | BUIDL 国债策略接入 | P0 |
| F-YIELD-04 | Aave V4 策略接入 | P0 |
| F-YIELD-05 | 日收益计算与展示 | P0 |
| F-YIELD-06 | Ondo USDY 策略接入 | P1 |
| F-YIELD-07 | Morpho Blue 策略接入 | P1 |
| F-YIELD-08 | Ethena USDe 策略接入 | P1 |
| F-YIELD-09 | 自定义分配比例配置 | P1 |
| F-YIELD-10 | 收益模拟计算器 (输入金额→预估收益) | P1 |
| F-YIELD-11 | 策略表现对比图表 | P2 |
| F-YIELD-12 | 自动复投开关 | P0 |

---

### 3.5 多签审批流

#### 3.5.1 审批触发条件

| 触发条件 | 默认阈值 | 可配置 |
|---|---|---|
| 单笔出金超过限额 | >$10,000 | ✅ |
| 日累计出金超过限额 | >$50,000 | ✅ |
| 白名单地址变更 | 任何变更 | ✅ |
| 风险策略变更 | 任何变更 | ✅ |
| 团队成员权限变更 | 任何变更 | ✅ |
| 账户恢复操作 | 任何恢复请求 | ✅ |

#### 3.5.2 审批流程

```
[操作员发起] → [审批请求创建] → [通知审批人 (邮件+App Push)]
    → [审批人1 审核] → [审批人2 审核 (如果m-of-n)] → [链上执行]
                                                        ↓
                                    [超时自动取消 (24h)] [审批拒绝 → 通知操作员]
```

#### 3.5.3 审批策略配置

```json
{
  "enterprise_id": "ent_abc123",
  "policies": [
    {
      "type": "withdrawal",
      "rules": [
        {
          "condition": "amount <= 10000",
          "approval_type": "auto",
          "quorum": null
        },
        {
          "condition": "amount > 10000 AND amount <= 100000",
          "approval_type": "single",
          "quorum": 1,
          "eligible_approvers": ["role:treasury_manager"]
        },
        {
          "condition": "amount > 100000",
          "approval_type": "multi",
          "quorum": 2,
          "eligible_approvers": ["role:cfo", "role:ceo"],
          "required_approvers": ["role:cfo"]
        }
      ]
    },
    {
      "type": "whitelist_change",
      "rules": [
        {
          "condition": "operation == 'add' OR operation == 'remove'",
          "approval_type": "multi",
          "quorum": 2,
          "eligible_approvers": ["role:cfo", "role:ceo"]
        }
      ]
    }
  ]
}
```

#### 3.5.4 功能规格

| 需求编号 | 功能 | 优先级 |
|---|---|---|
| F-APPROVAL-01 | 可配置的多级审批策略引擎 | P0 |
| F-APPROVAL-02 | m-of-n 多签审批 | P0 |
| F-APPROVAL-03 | 审批通知（邮件 + 应用内 + Webhook） | P0 |
| F-APPROVAL-04 | 审批操作界面（通过/拒绝 + 备注） | P0 |
| F-APPROVAL-05 | 审批历史与审计追踪 | P0 |
| F-APPROVAL-06 | 审批超时自动取消 | P1 |
| F-APPROVAL-07 | 紧急审批加速（电话确认通道） | P2 |
| F-APPROVAL-08 | 移动端审批 | P1 |

---

### 3.6 仪表盘与报表

#### 3.6.1 企业仪表盘

**首屏展示**:

```
┌─────────────────────────────────────────────────────┐
│  [企业名称] · 总资产 $XXX,XXX.XX        [入金] [出金] │
├──────────┬──────────┬──────────┬──────────────────────┤
│ 总资产    │ 昨日收益  │ 累计收益  │ 年化收益率 (APY)      │
│ $1.25M   │ +$142.50 │ +$8,350  │ 4.65% ↑             │
├──────────┴──────────┴──────────┴──────────────────────┤
│                                                       │
│  📈 收益趋势图 (7d / 30d / 90d / 1y)                 │
│                                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │                                             │     │
│  │      ··· 30天收益曲线 (可交互) ···          │     │
│  │                                             │     │
│  └─────────────────────────────────────────────┘     │
│                                                       │
│  资产分配                                              │
│  ██████████████████ Treasury Core  60%  $750K         │
│  ████████░░░░░░░░░░ DeFi Prime      25%  $312K         │
│  █████░░░░░░░░░░░░░ Basis Trade     15%  $187K         │
│                                                       │
│  最近交易                                              │
│  2026-05-10  +$50,000  入金  ✅ 已确认                │
│  2026-05-09  -$20,000  出金  ✅ 已确认                │
│  2026-05-08  +$142.50  收益  ✅ 已复投                │
│                                                       │
└─────────────────────────────────────────────────────┘
```

#### 3.6.2 报表功能

| 报表类型 | 内容 | 格式 | 频率 |
|---|---|---|---|
| **日收益报告** | 当日持仓、收益明细、APY | Dashboard + Email | 每日 |
| **月度对账单** | 月度资金流水、收益汇总、费用明细 | PDF + CSV 导出 | 每月 |
| **年度税务报表** | 年收益总计、IRS Form 1099 等效 / 通用税务包 | PDF | 每年 |
| **实时审计报告** | 链上持仓证明、Merkle Proof | Dashboard + API | 实时 |
| **合规报告** | AML/KYT 报告、大额交易报告 (CTR) | PDF (可提交给监管) | 按需/自动 |

#### 3.6.3 功能规格

| 需求编号 | 功能 | 优先级 |
|---|---|---|
| F-DASH-01 | 实时总资产展示 | P0 |
| F-DASH-02 | 收益趋势图 (多时间维度) | P0 |
| F-DASH-03 | 资产分配可视化 | P0 |
| F-DASH-04 | 交易历史列表 (分页/筛选/搜索) | P0 |
| F-DASH-05 | 月度对账单生成与导出 (PDF/CSV) | P0 |
| F-DASH-06 | 日收益邮件推送 | P0 |
| F-DASH-07 | 年度税务报表 | P1 |
| F-DASH-08 | 自定义报表构建器 | P2 |
| F-DASH-09 | 链上资产证明 (Merkle Proof) | P1 |
| F-DASH-10 | 多企业/多账户聚合视图 | P2 |

---

### 3.7 风险管控

#### 3.7.1 风险监控体系

| 监控维度 | 监控指标 | 预警阈值 | 响应动作 |
|---|---|---|---|
| **市场风险** | 单一策略 TVL 波动 | >20% 24h变化 | 自动暂停该策略分配 |
| **脱钩风险** | USDC/USDT 脱钩 | >1% 偏离 | 自动切换至备选稳定币 |
| **协议风险** | 底层协议被攻击/异常 | 安全预警源 | 立即暂停相关策略 + 紧急赎回 |
| **操作风险** | 异常大额交易 | >历史均值的 3σ | 人工审核确认 |
| **地址风险** | 与风险地址交互 | Chainalysis 标记 | 自动拦截 |
| **Gas 异常** | 网络 Gas 暴涨 | >200 gwei (Base) | 暂缓非紧急链上操作 |
| **流动性风险** | 赎回请求集中 | 待赎 > 可赎的 50% | 启动流动性后备方案 |

#### 3.7.2 熔断机制

```
三级熔断:
  Level 1 (黄色): 暂停新资金进入特定策略, 已存资金正常赎回
  Level 2 (橙色): 暂停所有新资金进入, 加速现有头寸赎回
  Level 3 (红色): 紧急暂停所有操作, 平台多签触发全局暂停
```

#### 3.7.3 保险

- 与 **Nexus Mutual** 集成智能合约风险保险
- 默认为企业账户提供 $250K 保额（含在管理费中）
- 超过 $250K 的保额由企业自行选择购买

#### 3.7.4 功能规格

| 需求编号 | 功能 | 优先级 |
|---|---|---|
| F-RISK-01 | 实时风险监控 Dashboard (运营端) | P0 |
| F-RISK-02 | 自动化熔断规则引擎 | P0 |
| F-RISK-03 | Chainalysis/TRM 钱包风险评分集成 | P0 |
| F-RISK-04 | 异常交易告警 | P0 |
| F-RISK-05 | 全局紧急暂停开关 (平台多签) | P0 |
| F-RISK-06 | Nexus Mutual 保险集成 | P1 |
| F-RISK-07 | 风险报告 (周报+月报) | P1 |
| F-RISK-08 | 自动化风险响应行动手册 | P1 |

---

### 3.8 合规审计追踪

#### 3.8.1 链上审计追踪

所有 YieldNest 智能账户的操作均在链上记录，通过 YieldNest 索引器提供结构化查询：

```
每笔操作记录包含:
  - 操作类型: deposit / withdraw / strategy_change / approval / recovery
  - 时间戳 (链上 + 服务器双重时间)
  - 发起人 (用户/审批人标识)
  - 金额 / 资产
  - TX Hash (链上可验证)
  - UserOp Hash
  - 操作结果 (成功/失败/待处理)
  - 关联的审批记录 ID
```

#### 3.8.2 合规报告自动生成

| 报告 | 触发条件 | 接收方 |
|---|---|---|
| **大额交易报告 (CTR 等效)** | 单笔 >$10K | 自动归档，按监管要求提交 |
| **可疑活动报告 (SAR 等效)** | 风控引擎触发 | 合规官审核后可提交 |
| **月度合规声明** | 每月 1 日 | 企业管理员 |
| **年度 1099 等效报表** | 每年 1 月 15 日 | 企业管理员 + 企业税务代理 |

#### 3.8.3 功能规格

| 需求编号 | 功能 | 优先级 |
|---|---|---|
| F-AUDIT-01 | 完整操作审计日志 (不可变存储) | P0 |
| F-AUDIT-02 | 合规报告自动生成 | P0 |
| F-AUDIT-03 | 审计日志导出 (CSV / JSON / PDF) | P0 |
| F-AUDIT-04 | 审计员专用只读角色 | P1 |
| F-AUDIT-05 | 自定义审计查询界面 | P2 |
| F-AUDIT-06 | 监管报告提交状态追踪 | P1 |

---

## 4. 系统架构

### 4.1 总体架构概览

```
                        ┌──────────────┐
                        │   CDN / WAF   │
                        │ (Cloudflare)  │
                        └──────┬───────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Web App    │     │  Mobile App  │     │   API Clients │
│  (Next.js)   │     │  (React N.)  │     │  (3rd Party)  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   API Gateway   │
                   │  (Kong/Envoy)   │
                   └────────┬────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Auth       │   │  Business    │   │  Blockchain  │
│   Service    │   │  Services    │   │  Service     │
│              │   │              │   │              │
│ · KYB/KYC   │   │ · Account    │   │ · Indexer    │
│ · AuthN/Z   │   │ · Strategy   │   │ · Bundler    │
│ · RBAC      │   │ · Approval   │   │ · Paymaster  │
└──────┬───────┘   │ · Reporting  │   │ · Tx Relayer │
       │           └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
       ┌──────────┐ ┌─────────┐ ┌──────────┐
       │PostgreSQL│ │  Redis  │ │ ClickHouse│
       │ (主数据) │ │ (缓存)  │ │ (分析)   │
       └──────────┘ └─────────┘ └──────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
       ┌──────────┐ ┌─────────┐ ┌──────────┐
       │  Base    │ │Arbitrum │ │ Ethereum │
       │  Chain   │ │ Chain   │ │  L1      │
       └──────────┘ └─────────┘ └──────────┘
```

### 4.2 前端架构

#### 4.2.1 技术栈

| 层级 | 技术选择 | 说明 |
|---|---|---|
| **框架** | Next.js 15 (App Router) | SSR/SSG 混合，SEO 友好 |
| **语言** | TypeScript (strict mode) | 全量类型覆盖 |
| **UI 组件** | shadcn/ui + Tailwind CSS v4 | 可定制 + 现代化设计系统 |
| **状态管理** | Zustand + React Query (TanStack) | 服务端状态 + 客户端状态分离 |
| **表单** | React Hook Form + Zod | 高性能表单 + schema 校验 |
| **图表** | Recharts / Tremor | 收益曲线、资产分布等 |
| **Web3 交互** | Wagmi v3 + Viem v2 | 钱包连接 + 合约交互 |
| **认证** | NextAuth v5 + WebAuthn | Passkey + 传统认证 |
| **国际化** | next-intl | 多语言支持 (英语/中文优先) |

#### 4.2.2 组件结构

```
src/
├── app/                          # Next.js App Router Pages
│   ├── (auth)/                   # 认证相关页面
│   │   ├── login/
│   │   ├── register/
│   │   └── recover/
│   ├── (app)/                    # 主应用页面 (需登录)
│   │   ├── dashboard/
│   │   ├── deposit/
│   │   ├── withdraw/
│   │   ├── strategies/
│   │   ├── approvals/
│   │   ├── reports/
│   │   ├── team/
│   │   └── settings/
│   └── api/                      # Next.js API Routes (BFF)
├── components/
│   ├── ui/                       # shadcn/ui 基础组件
│   ├── web3/                     # Web3 专用组件
│   │   ├── SmartAccountProvider.tsx
│   │   ├── GasEstimate.tsx
│   │   ├── TxConfirmation.tsx
│   │   └── ChainSwitcher.tsx
│   ├── dashboard/                # 仪表盘组件
│   ├── approval/                 # 审批流组件
│   └── shared/                   # 共享业务组件
├── hooks/                        # 自定义 Hooks
├── lib/                          # 工具库
│   ├── api.ts                    # API Client
│   ├── chain.ts                  # 链配置
│   └── validators.ts             # Zod schemas
├── stores/                       # Zustand stores
└── types/                        # TypeScript 类型定义
```

### 4.3 后端微服务架构

#### 4.3.1 服务列表

```
┌─────────────────────────────────────────────────────────┐
│                     API Gateway (Kong)                    │
│  · 路由 · 限流 · 认证 · 日志 · CORS                      │
└─────────────────────────────────────────────────────────┘
         │          │          │          │
         ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Auth    │ │ Account  │ │ Strategy │ │ Approval │
│  Service │ │ Service  │ │ Service  │ │ Service  │
│  Node.js │ │ Go       │ │ Go       │ │ Node.js  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Reporting │ │Blockchain│ │Webhook   │ │  Admin   │
│ Service  │ │ Service  │ │ Service  │ │ Service  │
│ Python   │ │ Go/Rust  │ │ Node.js  │ │ Node.js  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

#### 4.3.2 各服务职责

| 服务 | 语言 | 职责 | 主要依赖 |
|---|---|---|---|
| **Auth Service** | Node.js (Express/Fastify) | 用户注册/登录、Passkey 管理、会话管理、RBAC、KYB 集成 | Persona API, OAuth2 |
| **Account Service** | Go | 企业账户 CRUD、限额管理、团队管理、白名单管理 | PostgreSQL |
| **Strategy Service** | Go | 收益策略配置、分配引擎、再平衡调度、收益计算 | PostgreSQL, Redis |
| **Approval Service** | Node.js | 审批策略引擎、审批流状态机、通知触发 | PostgreSQL, Redis |
| **Reporting Service** | Python | 报表生成 (PDF/CSV)、月度/年度报告调度 | ClickHouse, PostgreSQL |
| **Blockchain Service** | Go/Rust | 链上事件索引、UserOp 构建与发送、Paymaster 交互、合约调用 | Viem/Bindings, RPC |
| **Webhook Service** | Node.js | 外部回调、企业系统对接、事件推送 | Redis (队列) |
| **Admin Service** | Node.js | 运营后台 (KYB 复审、风控管理、策略参数配置) | PostgreSQL |

#### 4.3.3 消息与事件驱动

```
服务间通信:
  同步: gRPC (内部服务调用) + REST (BFF → Backend)
  异步: Redis Streams / Kafka (事件总线)

关键事件流:
  UserRegistered → KYB 自动审查
  DepositConfirmed → Strategy 自动分配
  WithdrawalRequested → Approval 流程触发
  ApprovalResolved → Blockchain Tx 执行
  DailyYieldCalculated → Reporting 报表生成
```

### 4.4 区块链交互层

#### 4.4.1 模块架构

```
┌──────────────────────────────────────────┐
│         Blockchain Service (Go)          │
├──────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│  │ Indexer │ │ Bundler │ │ Paymaster │  │
│  │         │ │         │ │  Client   │  │
│  │· 事件监听│ │· UserOp │ │ · 赞助策略│  │
│  │· 状态同步│ │· 签名   │ │ · Gas 估算│  │
│  │· 余额追踪│ │· 提交   │ │ · 费用结算│  │
│  └─────────┘ └─────────┘ └───────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│  │  Vault  │ │  Price  │ │   Safety  │  │
│  │ Adapter │ │ Oracle  │ │   Module  │  │
│  │         │ │         │ │           │  │
│  │· BUIDL  │ │· Chain- │ │ · 地址筛查│  │
│  │· Aave   │ │  link   │ │ · 金额限制│  │
│  │· Morpho │ │· Pyth   │ │ · 熔断    │  │
│  └─────────┘ └─────────┘ └───────────┘  │
└──────────────────────────────────────────┘
```

#### 4.4.2 链上合约交互模式

```
模式 1: 直接链上转账 (入金)
  监听 USDC Transfer 事件 → 更新内部余额 → 触发策略分配

模式 2: UserOp (ERC-4337, 出金/策略操作)
  构建 UserOp → 用户 Passkey 签名 → Bundler 提交 → Paymaster 付 Gas

模式 3: 合约调用 (策略操作)
  策略合约 Adapter → 底层协议合约 → 状态确认 → 更新内部记录
```

### 4.5 数据层设计

#### 4.5.1 数据库选型

| 数据库 | 用途 | 说明 |
|---|---|---|
| **PostgreSQL 16** | 主数据存储 | 用户、企业、账户、交易、审批、配置 |
| **Redis 7** | 缓存 + 队列 | 会话、限流、实时余额缓存、UserOp 队列 |
| **ClickHouse** | 分析 + 报表 | 交易历史、收益历史、审计日志（时序数据） |
| **S3 (兼容)** | 文件存储 | KYB 证件、导出报表 PDF/CSV |

#### 4.5.2 核心表设计 (PostgreSQL)

```sql
-- 企业表
CREATE TABLE enterprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    country CHAR(2) NOT NULL,          -- ISO 3166-1 alpha-2
    entity_type VARCHAR(50),
    kyb_status VARCHAR(20) DEFAULT 'pending', -- pending/approved/rejected
    kyb_provider_ref VARCHAR(255),
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID REFERENCES enterprises(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,         -- admin / operator / approver / auditor
    passkey_credential_id VARCHAR(255),
    auth_factors JSONB DEFAULT '{}',   -- {passkey, email_otp, hardware_key}
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 智能账户表
CREATE TABLE smart_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID REFERENCES enterprises(id) NOT NULL,
    chain_id INTEGER NOT NULL,
    account_address VARCHAR(42) NOT NULL,
    safe_version VARCHAR(10),
    owners JSONB NOT NULL,             -- [{address, type, added_at}]
    threshold INTEGER DEFAULT 1,
    deployed_at TIMESTAMPTZ,
    UNIQUE(chain_id, account_address)
);

-- 交易表
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID REFERENCES enterprises(id) NOT NULL,
    smart_account_id UUID REFERENCES smart_accounts(id),
    tx_type VARCHAR(30) NOT NULL,       -- deposit / withdraw / yield / fee
    asset VARCHAR(10) NOT NULL,         -- USDC / USDT
    amount NUMERIC(78, 18) NOT NULL,
    direction VARCHAR(10) NOT NULL,     -- in / out
    status VARCHAR(20) DEFAULT 'pending',
    chain_tx_hash VARCHAR(66),
    userop_hash VARCHAR(66),
    approval_id UUID REFERENCES approvals(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ
);

-- 审批表
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID REFERENCES enterprises(id) NOT NULL,
    approval_type VARCHAR(30) NOT NULL,
    requested_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    required_quorum INTEGER NOT NULL,
    current_quorum INTEGER DEFAULT 0,
    payload JSONB NOT NULL,             -- 审批内容快照
    expires_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 审批投票表
CREATE TABLE approval_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_id UUID REFERENCES approvals(id) NOT NULL,
    voter_id UUID REFERENCES users(id) NOT NULL,
    vote VARCHAR(10) NOT NULL,          -- approve / reject
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(approval_id, voter_id)
);

-- 收益记录表
CREATE TABLE yield_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID REFERENCES enterprises(id) NOT NULL,
    strategy_id VARCHAR(50) NOT NULL,
    snapshot_amount NUMERIC(78, 18) NOT NULL,
    gross_yield NUMERIC(78, 18) NOT NULL,
    fee_amount NUMERIC(78, 18) NOT NULL,
    net_yield NUMERIC(78, 18) NOT NULL,
    apy_bps INTEGER NOT NULL,           -- APY in basis points
    record_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 审计日志表
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID REFERENCES enterprises(id),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_tx_enterprise ON transactions(enterprise_id, created_at DESC);
CREATE INDEX idx_tx_status ON transactions(status);
CREATE INDEX idx_yield_enterprise_date ON yield_records(enterprise_id, record_date);
CREATE INDEX idx_audit_enterprise ON audit_logs(enterprise_id, created_at DESC);
CREATE INDEX idx_approval_status ON approvals(status);
```

---

## 5. 智能合约设计

### 5.1 合约架构

```
contracts/
├── core/
│   ├── YieldNestAccount.sol          # ERC-4337 智能账户 (基于 Safe 5.x 扩展)
│   ├── AccountFactory.sol            # 账户工厂 (CREATE2 部署)
│   └── AccountRegistry.sol           # 全局账户注册表
├── vault/
│   ├── YieldNestVault.sol            # 主保险库 (用户资金入口)
│   ├── StrategyAdapter.sol           # 策略适配器基类
│   ├── adapters/
│   │   ├── BUIDLAdapter.sol          # BlackRock BUIDL 适配器
│   │   ├── OndoUSDYAdapter.sol       # Ondo USDY 适配器
│   │   ├── AaveV4Adapter.sol         # Aave V4 适配器
│   │   ├── MorphoAdapter.sol         # Morpho Blue 适配器
│   │   └── EthenaAdapter.sol         # Ethena USDe 适配器
│   └── AllocationEngine.sol          # 分配引擎
├── paymaster/
│   └── YieldNestPaymaster.sol        # Gas 代付合约
├── governance/
│   ├── EmergencyPause.sol            # 紧急暂停模块
│   └── YieldNestTimelock.sol         # 时间锁
└── lib/
    ├── RiskScore.sol                 # 风险评分库
    └── FeeCalculator.sol             # 费用计算库
```

### 5.2 核心合约详述

#### 5.2.1 YieldNestVault.sol

```solidity
// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

/// @title YieldNestVault - 主保险库合约
/// @notice 接收企业用户资金，按策略分配至各适配器
contract YieldNestVault {
    // 状态变量
    mapping(address => uint256) public userShares;      // 用户 → 份额
    mapping(uint256 => Strategy) public strategies;     // 策略ID → 策略
    uint256 public totalShares;
    address public allocationEngine;
    address public platformFeeRecipient;
    uint256 public platformFeeBps;                      // 平台费率 (基点)
    
    // 策略结构
    struct Strategy {
        address adapter;           // 适配器合约地址
        uint256 targetWeight;      // 目标权重 (基点)
        uint256 currentWeight;     // 当前权重
        bool active;
    }
    
    // 核心方法
    function deposit(address asset, uint256 amount, uint256 strategyId) external;
    function withdraw(address asset, uint256 shares, address recipient) external;
    function rebalance() external onlyAllocationEngine;
    function claimYield() external;
    function emergencyWithdraw() external onlyOwner;
    
    // 事件
    event Deposited(address indexed user, address asset, uint256 amount);
    event Withdrawn(address indexed user, address asset, uint256 amount);
    event Rebalanced(uint256 indexed strategyId, uint256 newWeight);
    event YieldClaimed(address indexed user, uint256 amount);
}
```

#### 5.2.2 StrategyAdapter.sol (基类)

```solidity
/// @title StrategyAdapter - 策略适配器基类
/// @notice 所有收益策略适配器必须实现的接口
abstract contract StrategyAdapter {
    address public vault;
    address public underlyingAsset;
    uint256 public totalDeposited;
    bool public paused;
    
    // 每个适配器必须实现的方法
    function deposit(uint256 amount) external virtual returns (uint256 shares);
    function withdraw(uint256 shares) external virtual returns (uint256 amount);
    function totalValue() public virtual returns (uint256);
    function pendingYield() public virtual returns (uint256);
    function claimRewards() external virtual;
    function emergencyWithdraw() external virtual returns (uint256 amount);
    
    // 风险管理
    function getRiskScore() external virtual returns (uint256);
    function getAPY() external virtual returns (uint256);
    function getWithdrawalDelay() external virtual returns (uint256); // 秒
}
```

#### 5.2.3 YieldNestPaymaster.sol

```solidity
/// @title YieldNestPaymaster - Gas 代付合约
/// @notice 为 YieldNest 用户代付 ERC-4337 UserOp Gas 费
contract YieldNestPaymaster is IEntryPoint {
    address public platformOwner;
    mapping(address => bool) public whitelistedAccounts;
    
    // 赞助策略
    enum SponsorMode { USDC, SUBSIDIZED, MONTHLY_BILLING }
    mapping(address => SponsorMode) public sponsorModes;
    
    // Gas 费兑换 (USDC → 原生代币)
    address public usdcToken;
    address public swapRouter;
    
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData);
    
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external;
}
```

#### 5.2.4 EmergencyPause.sol

```solidity
/// @title EmergencyPause - 紧急暂停模块
/// @notice 支持分级熔断和紧急恢复
contract EmergencyPause is AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    enum PauseLevel { NONE, YELLOW, ORANGE, RED }
    PauseLevel public currentLevel;
    
    // 受控合约列表
    address[] public controlledContracts;
    
    function setPauseLevel(PauseLevel level) external onlyRole(PAUSER_ROLE);
    function emergencyShutdown() external onlyRole(DEFAULT_ADMIN_ROLE);
}
```

### 5.3 合约部署参数

| 参数 | 值 |
|---|---|
| 编译器版本 | Solidity 0.8.26+ |
| 优化器 | 200 runs |
| 初始部署链 | Base (Chain ID: 8453) |
| 账户工厂盐值 | `keccak256("yieldnest.account.v1")` |
| 平台费率 | 30 bps (0.3%), 可治理调整 |
| 时间锁延迟 | 48 小时 |
| 多签阈值 | 平台 3-of-5 |

### 5.4 升级策略

- **非保管合约** (Vault, Paymaster): UUPS Proxy 模式, OpenZeppelin Defender 管理
- **用户智能账户** (Safe): 不可升级，采用模块化扩展 (Safe Modules)
- **适配器**: 策略适配器独立部署，通过 Vault 白名单注册

---

## 6. API 接口设计

### 6.1 API 设计规范

| 规范项 | 标准 |
|---|---|
| 协议 | HTTPS + WSS (实时推送) |
| 数据格式 | JSON |
| 认证 | Bearer JWT (Access + Refresh Token) |
| 签名 | 部分写操作需要 Passkey 签名 (WebAuthn assertion) |
| 分页 | Cursor-based (推荐) / Offset-based |
| 版本 | URL 前缀 `/v1/` |
| 幂等性 | 写操作使用 `Idempotency-Key` 头 |
| 限流 | 1000 req/min (默认), 可配置 |

### 6.2 核心 API 端点

#### 6.2.1 认证 (Auth Service)

```
POST   /v1/auth/register              # 企业注册 (第1步: 邮箱)
POST   /v1/auth/register/verify       # 邮箱验证 (OTP)
POST   /v1/auth/kyb/submit            # 提交 KYB 信息
GET    /v1/auth/kyb/status            # 查询 KYB 状态

POST   /v1/auth/login/begin           # 登录 (获取 challenge)
POST   /v1/auth/login/complete        # 登录 (提交 Passkey assertion)
POST   /v1/auth/refresh               # 刷新 Access Token
POST   /v1/auth/logout                # 登出

POST   /v1/auth/recover/begin         # 账户恢复 (发送 Magic Link)
POST   /v1/auth/recover/complete      # 恢复确认
POST   /v1/auth/passkey/register      # 注册新 Passkey
GET    /v1/auth/passkey/list          # 列出已注册 Passkeys
DELETE /v1/auth/passkey/:id           # 删除 Passkey
```

#### 6.2.2 企业账户 (Account Service)

```
GET    /v1/enterprises/:id            # 企业信息
PATCH  /v1/enterprises/:id            # 更新企业信息
GET    /v1/enterprises/:id/members    # 团队成员列表
POST   /v1/enterprises/:id/members    # 邀请团队成员
PATCH  /v1/enterprises/:id/members/:uid # 更新成员角色
DELETE /v1/enterprises/:id/members/:uid # 移除成员

GET    /v1/accounts                   # 智能账户列表
GET    /v1/accounts/:id               # 单个账户详情
GET    /v1/accounts/:id/balance       # 实时余额
GET    /v1/accounts/:id/whitelist     # 出金地址白名单
POST   /v1/accounts/:id/whitelist     # 添加白名单地址
DELETE /v1/accounts/:id/whitelist/:addr # 移除白名单地址
```

#### 6.2.3 交易 (Account Service)

```
POST   /v1/deposits                   # 创建入金意向 (获取地址)
GET    /v1/deposits/:id               # 入金详情
POST   /v1/withdrawals                # 创建出金请求
GET    /v1/withdrawals/:id            # 出金详情
POST   /v1/withdrawals/:id/cancel     # 取消失败的出金 (未上链)
GET    /v1/transactions               # 交易历史 (分页/筛选)
GET    /v1/transactions/:id           # 单笔交易详情
```

#### 6.2.4 收益策略 (Strategy Service)

```
GET    /v1/strategies                 # 可用策略列表
GET    /v1/strategies/:id             # 策略详情 (含历史APY)
GET    /v1/strategies/:id/performance # 策略表现统计

GET    /v1/allocations                # 当前分配状态
POST   /v1/allocations                # 设置/更新分配方案
POST   /v1/allocations/rebalance      # 手动触发再平衡

GET    /v1/yield/history              # 收益历史
GET    /v1/yield/summary              # 收益摘要 (累计/日均/APY)
POST   /v1/yield/simulate             # 收益模拟计算
```

#### 6.2.5 审批 (Approval Service)

```
GET    /v1/approvals                  # 审批列表 (我的请求/待我审批)
GET    /v1/approvals/:id              # 审批详情
POST   /v1/approvals/:id/vote         # 审批投票 (通过/拒绝)
POST   /v1/approvals/:id/cancel       # 取消审批

GET    /v1/policies                   # 审批策略配置
POST   /v1/policies                   # 创建审批策略
PATCH  /v1/policies/:id               # 更新审批策略
DELETE /v1/policies/:id               # 删除审批策略
```

#### 6.2.6 报表 (Reporting Service)

```
GET    /v1/reports/monthly            # 月度对账单列表
GET    /v1/reports/monthly/:id        # 下载月度对账单
GET    /v1/reports/tax/:year          # 下载年度税务报表
POST   /v1/reports/custom             # 生成自定义报表
GET    /v1/reports/audit-proof        # 生成链上资产证明
```

#### 6.2.7 Webhook (Webhook Service)

```
GET    /v1/webhooks                   # Webhook 配置列表
POST   /v1/webhooks                   # 创建 Webhook 订阅
PATCH  /v1/webhooks/:id               # 更新 Webhook
DELETE /v1/webhooks/:id               # 删除 Webhook
POST   /v1/webhooks/:id/test          # 发送测试事件
```

### 6.3 WebSocket 实时事件

```
WSS /v1/ws?token={jwt}

事件类型:
  deposit.confirmed      入金确认
  withdrawal.completed   出金完成
  approval.requested     审批请求
  approval.resolved      审批完成
  yield.daily            日收益更新
  strategy.rebalanced    策略再平衡
  alert.risk             风险告警
```

---

## 7. 安全架构设计

### 7.1 安全层次

```
Layer 1: 物理/基础设施
  · AWS/GCP 安全组
  · Cloudflare WAF + DDoS 防护
  · VPC 私有子网隔离

Layer 2: 应用安全
  · OWASP Top 10 防护 (SQL注入/XSS/CSRF)
  · 输入校验 (Zod / class-validator)
  · 参数化查询 (Prisma / sqlc)
  · Content-Security-Policy 头

Layer 3: 认证与授权
  · WebAuthn (Passkey) 防钓鱼
  · JWT 短期 (15min) + 刷新令牌轮换
  · RBAC (角色-权限) + ABAC (属性) 混合
  · 会话管理 (设备指纹 + IP 绑定选项)

Layer 4: 链上安全
  · 智能合约审计 (Trail of Bits + Spearbit)
  · 形式化验证 (Certora) 核心合约
  · Bug Bounty (Immunefi, $50K-$500K)
  · 合约保险 (Nexus Mutual)
  · 时间锁 + 多签治理

Layer 5: 密钥安全
  · 平台私钥: AWS KMS / HashiCorp Vault + HSM
  · 用户私钥: 客户端 Passkey (永不接触服务器)
  · 密钥轮换: 自动定期轮换
```

### 7.2 威胁模型与对策

| 威胁 | 风险等级 | 对策 |
|---|---|---|
| 智能合约漏洞导致资金被盗 | 🔴 极高 | 多轮审计 + 形式化验证 + Bug Bounty + 保险 + 资金多层隔离 |
| 平台后端被攻破 | 🔴 极高 | 最小权限原则 + 数据库加密 + 入侵检测 + 定期渗透测试 |
| 用户 Passkey 丢失 | 🟡 中 | Email Magic Link 恢复 + 管理员辅助恢复 + 多设备 Passkey |
| 前端供应链攻击 | 🟡 中 | Subresource Integrity + npm 审计 + 依赖锁定 |
| RPC 节点作恶/被攻击 | 🟡 中 | 多 RPC 提供商冗余 (Alchemy + Infura + QuickNode) |
| Oracle 价格操纵 | 🟡 中 | Chainlink + Pyth 双 Oracle + 价格偏差熔断 |
| 内部人员作恶 | 🟠 高 | 所有管理操作需多签 + 时间锁 + 操作审计 |
| DDoS 攻击 | 🟢 低 | Cloudflare WAF + 自动扩容 + 限流 |

### 7.3 安全监控与事件响应

```
监控栈:
  · Datadog / Grafana (指标 + 日志)
  · Sentry (错误追踪)
  · OpenZeppelin Defender (合约监控)
  · Tenderly Alerts (链上事件告警)
  · Chainalysis KYT (地址风险)

事件响应 SLA:
  · 严重事件 (资金风险): 15分钟内响应, 1小时内解决或暂停
  · 高危事件: 1小时内响应
  · 中危事件: 4小时内响应
```

---

## 8. 部署与运维架构

### 8.1 基础设施

```
Cloud: AWS (主) + GCP (备份, 多区域)

┌─────────────────────────────────────────┐
│             Cloudflare CDN              │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           AWS us-east-1 (主)            │
│                                         │
│  ECS Fargate (容器化微服务)              │
│  │  ├─ Auth Service     (2-4 tasks)    │
│  │  ├─ Account Service   (2-4 tasks)   │
│  │  ├─ Strategy Service  (2 tasks)     │
│  │  ├─ Approval Service  (2 tasks)     │
│  │  ├─ Reporting Service (1-2 tasks)   │
│  │  ├─ Blockchain Service(2-4 tasks)   │
│  │  └─ Admin Service     (1-2 tasks)   │
│  │                                      │
│  RDS PostgreSQL (Multi-AZ)              │
│  ElastiCache Redis (Cluster)            │
│  ClickHouse Cloud                       │
│  S3 (文件存储)                           │
└─────────────────────────────────────────┘
```

### 8.2 CI/CD 流水线

```
GitHub → GitHub Actions
  ├─ Lint + Type Check
  ├─ Unit Tests
  ├─ Integration Tests
  ├─ Contract Tests (Foundry)
  ├─ Security Scan (Slither + npm audit)
  ├─ Build Docker Images
  ├─ Push to ECR
  ├─ Deploy to Staging (自动)
  └─ Deploy to Production (手动审批)
```

### 8.3 环境管理

| 环境 | 用途 | 链 |
|---|---|---|
| **local** | 开发者本地 | Base Sepolia (测试网) |
| **staging** | 集成测试 + 内部试运行 | Base Sepolia |
| **production** | 线上生产 | Base 主网 + 后续多链 |

---

## 9. 开发路线图

### Phase 0: 基础建设 (M1-M2, 8周)

```
Week 1-2: 技术选型确认 + 开发环境搭建 + 安全审计范围确定
Week 3-4: 核心智能合约开发 (Vault + AccountFactory + Paymaster)
Week 5-6: Auth Service + 基础 Account Service
Week 7-8: 合约单元测试 + 内部安全审查 + 测试网部署
```

**里程碑 M0**: 测试网完整流转 (注册 → KYB → 入金 → 收益 → 出金)

### Phase 1: MVP (M3-M4, 8周)

```
Week 9-10:  前端核心页面 (Dashboard / 入金 / 出金)
Week 11-12: BUIDL 策略适配器 + 基础分配引擎
Week 13-14: Passkey 认证 + 审批流 (单签版本)
Week 15-16: KYB 集成 + 银行入金通道 (Wire)
```

**里程碑 M1**: 封闭 Alpha 测试 (内部团队 + 5家友好企业)

### Phase 2: 增强 (M5-M6, 8周)

```
Week 17-18: 多签审批流 + 高级策略配置
Week 19-20: Aave + Morpho 策略适配器
Week 21-22: 报表系统 (月度对账单 + 审计报告)
Week 23-24: 外部安全审计 (Trail of Bits) + Bug Bounty 上线
```

**里程碑 M2**: 公开 Beta 上线，目标 50 家企业，AUM $10M+

### Phase 3: 规模化 (M7-M12, 24周)

```
Month 7-8:  多链扩展 (Arbitrum + Ethereum)
Month 9-10: 企业 API + Webhook + ERP 对接
Month 11:   Ethena / Ondo 策略适配器
Month 12:   移动端 App (React Native)
```

**里程碑 M3**: 正式版 GA，目标 200+ 企业，AUM $200M+

---

## 附录

### A. 术语表

| 术语 | 说明 |
|---|---|
| **ERC-4337** | 账户抽象标准，允许智能合约作为钱包 |
| **UserOp** | ERC-4337 中的用户操作对象 |
| **Paymaster** | 代付 Gas 费的合约 |
| **Safe{Core}** | 模块化智能账户协议 |
| **Passkey (WebAuthn)** | 基于生物识别的无密码认证标准 |
| **BUIDL** | BlackRock USD Institutional Digital Liquidity Fund |
| **KYB** | Know Your Business — 企业尽职调查 |
| **AUM** | Assets Under Management — 管理资产规模 |
| **bps** | Basis Points — 基点 (1 bps = 0.01%) |

### B. 关键参考

- [ERC-4337 规范](https://eips.ethereum.org/EIPS/eip-4337)
- [Safe{Core} Protocol](https://docs.safe.global)
- [Pimlico Bundler & Paymaster](https://docs.pimlico.io)
- [BlackRock BUIDL](https://www.blackrock.com/cash/en-us/products/build)
- [WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/)
