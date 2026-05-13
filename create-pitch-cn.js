const pptxgen = require("pptxgenjs");

const C = {
  bg:       "0A0E14",
  surface:  "131820",
  card:     "1A1F2E",
  border:   "2A3040",
  text:     "C8CDD6",
  muted:    "7A8294",
  white:    "FFFFFF",
  accent:   "00D4AA",
  accent2:  "4DA6FF",
  accent3:  "F0A050",
  red:      "FF5C5C",
};

const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.25 });

function card(slide, x, y, w, h) {
  slide.addShape("rect", { x, y, w, h, fill: { color: C.card }, rectRadius: 0.08, shadow: makeShadow() });
}

function accentBar(slide, x, y, w, h, color = C.accent) {
  slide.addShape("rect", { x, y, w, h, fill: { color } });
}

function sectionTitle(slide, text, y = 0.35) {
  slide.addText(text, { x: 0.7, y, w: 8.6, h: 0.55, fontSize: 30, fontFace: "Microsoft YaHei", bold: true, color: C.white, margin: 0 });
  slide.addShape("rect", { x: 0.7, y: y + 0.58, w: 0.8, h: 0.04, fill: { color: C.accent } });
}

async function run() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "YieldNest";
  pres.title = "YieldNest 融资演示文稿";

  // ═══════════════════ SLIDE 1: 封面 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.surface } });
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

    s.addShape("rect", { x: 4.1, y: 1.15, w: 1.8, h: 1.8, fill: { color: C.accent }, rectRadius: 0.3 });
    s.addText("YN", { x: 4.1, y: 1.15, w: 1.8, h: 1.8, fontSize: 52, fontFace: "Arial", bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });

    s.addText("YieldNest", { x: 1, y: 3.2, w: 8, h: 0.8, fontSize: 44, fontFace: "Arial", bold: true, color: C.white, align: "center", margin: 0 });
    s.addText("企业级稳定币收益聚合平台", { x: 1.5, y: 3.9, w: 7, h: 0.45, fontSize: 18, fontFace: "Microsoft YaHei", color: C.accent, align: "center", margin: 0 });
    s.addText('区块链时代的「企业版余额宝」', { x: 1.5, y: 4.35, w: 7, h: 0.4, fontSize: 14, fontFace: "Microsoft YaHei", color: C.muted, align: "center", margin: 0 });

    s.addText("机密文件 · 2026年5月", { x: 0.7, y: 5.15, w: 3, h: 0.3, fontSize: 10, fontFace: "Microsoft YaHei", color: C.muted, margin: 0 });
  }

  // ═══════════════════ SLIDE 2: 痛点 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "20 万亿美元现金的困境");

    const stats = [
      { val: "$20万亿", label: "全球中小企业\n持有的现金等价物" },
      { val: "0.01%", label: "银行活期存款\n平均年化收益率" },
      { val: "4-5%", label: "链上国债产品\n当前年化收益率" },
      { val: "0", label: "面向传统企业\n的友好型接入产品" },
    ];
    stats.forEach((st, i) => {
      const sx = 0.7 + i * 2.2;
      card(s, sx, 1.3, 2.0, 1.35);
      s.addText(st.val, { x: sx, y: 1.4, w: 2.0, h: 0.6, fontSize: 28, fontFace: "Arial", bold: true, color: st.val === "0" ? C.red : C.accent, align: "center", margin: 0 });
      s.addText(st.label, { x: sx, y: 1.95, w: 2.0, h: 0.55, fontSize: 11, fontFace: "Microsoft YaHei", color: C.muted, align: "center", margin: 0 });
    });

    s.addText([
      { text: "全球中小企业持有约 $20 万亿美元现金，收益几乎为零", options: { bullet: true, breakLine: true } },
      { text: "传统银行企业活期存款利率仅 0.01%~0.5%", options: { bullet: true, breakLine: true } },
      { text: "与此同时，链上美国国债产品（贝莱德 BUIDL）年化 4~5%", options: { bullet: true, breakLine: true } },
      { text: "但钱包、私钥、Gas 费、合规恐惧，将企业挡在门外", options: { bullet: true, breakLine: true } },
      { text: '「收益就在那里——只是没有通道能触达它。」', options: { bullet: true } },
    ], { x: 0.7, y: 2.85, w: 8.6, h: 1.9, fontSize: 15, fontFace: "Microsoft YaHei", color: C.text, paraSpaceAfter: 8 });

    s.addText("数据来源：美联储金融稳定报告、贝莱德 BUIDL 概况、中小企业现金管理调研 2025", {
      x: 0.7, y: 5.0, w: 8.6, h: 0.35, fontSize: 10, fontFace: "Microsoft YaHei", italic: true, color: C.muted, margin: 0,
    });
  }

  // ═══════════════════ SLIDE 3: 解决方案 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "YieldNest：一键获取 4-5% 年化收益");

    // 传统方案
    card(s, 0.5, 1.4, 4.1, 3.5);
    s.addShape("rect", { x: 0.5, y: 1.4, w: 4.1, h: 0.45, fill: { color: C.red, transparency: 85 } });
    s.addText("传统方案", { x: 0.7, y: 1.42, w: 3.7, h: 0.4, fontSize: 15, fontFace: "Microsoft YaHei", bold: true, color: C.red, margin: 0 });
    s.addText([
      { text: "银行储蓄账户", options: { bullet: true, breakLine: true } },
      { text: "年化 0.01%（几乎为零）", options: { bullet: true, breakLine: true } },
      { text: "需维护多家银行关系", options: { bullet: true, breakLine: true } },
      { text: "每家银行开户 2-4 周", options: { bullet: true, breakLine: true } },
      { text: "无实时收益可视化", options: { bullet: true } },
    ], { x: 0.8, y: 2.1, w: 3.5, h: 2.5, fontSize: 13, fontFace: "Microsoft YaHei", color: C.text, paraSpaceAfter: 10 });

    // 箭头
    s.addText("→", { x: 4.3, y: 2.8, w: 1.4, h: 0.6, fontSize: 36, fontFace: "Arial", bold: true, color: C.accent, align: "center", valign: "middle", margin: 0 });

    // YieldNest 方案
    card(s, 5.4, 1.4, 4.1, 3.5);
    s.addShape("rect", { x: 5.4, y: 1.4, w: 4.1, h: 0.45, fill: { color: C.accent, transparency: 85 } });
    s.addText("YieldNest 方案", { x: 5.6, y: 1.42, w: 3.7, h: 0.4, fontSize: 15, fontFace: "Microsoft YaHei", bold: true, color: C.accent, margin: 0 });
    s.addText([
      { text: "智能账户，年化 4-5%", options: { bullet: true, breakLine: true } },
      { text: "收益是银行的 400 倍", options: { bullet: true, breakLine: true } },
      { text: "统一仪表盘，一目了然", options: { bullet: true, breakLine: true } },
      { text: "15 分钟在线入驻", options: { bullet: true, breakLine: true } },
      { text: "实时收益追踪", options: { bullet: true, breakLine: true } },
      { text: "API + 移动端 + Web", options: { bullet: true } },
    ], { x: 5.6, y: 2.1, w: 3.7, h: 2.5, fontSize: 13, fontFace: "Microsoft YaHei", color: C.text, paraSpaceAfter: 10 });

    s.addText("无需任何加密知识。存入 USDC，坐享收益。", {
      x: 0.7, y: 5.05, w: 8.6, h: 0.35, fontSize: 14, fontFace: "Microsoft YaHei", italic: true, color: C.accent, margin: 0,
    });
  }

  // ═══════════════════ SLIDE 4: 市场规模 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "巨大的可寻址市场");

    const layers = [
      { label: "TAM 总可寻址市场", desc: "全球中小企业现金管理市场", val: "$3000亿", w: 8.6, color: C.border, tcolor: C.muted },
      { label: "SAM 可服务市场", desc: "已持有或愿意持有稳定币的中小企业", val: "$500亿", w: 6.5, color: C.accent, tcolor: C.white, t2: "TAM 的 17%" },
      { label: "SOM 可得市场", desc: "第 5 年收入目标（0.7% 实际费率）", val: "$2.45亿", w: 4.3, color: C.accent, tcolor: C.white, t2: "基于 $350亿 AUM" },
    ];

    layers.forEach((l, i) => {
      const y = 1.4 + i * 1.15;
      const cx = (10 - l.w) / 2;
      s.addShape("rect", { x: cx, y, w: l.w, h: 0.95, fill: { color: l.label.includes("SOM") ? C.accent : C.card }, rectRadius: 0.08 });
      s.addText(l.label, { x: cx + 0.25, y: y + 0.1, w: 2.2, h: 0.3, fontSize: 11, fontFace: "Microsoft YaHei", bold: true, color: l.label.includes("SOM") ? C.bg : C.accent, margin: 0 });
      s.addText(l.desc, { x: cx + 0.25, y: y + 0.38, w: l.w - 2.8, h: 0.25, fontSize: 12, fontFace: "Microsoft YaHei", color: l.tcolor, margin: 0 });
      s.addText(l.val, { x: cx + l.w - 2.2, y: y + 0.15, w: 2.0, h: 0.55, fontSize: 26, fontFace: "Arial", bold: true, color: l.tcolor, align: "right", margin: 0 });
      if (l.t2) {
        s.addText(l.t2, { x: cx + l.w - 2.2, y: y + 0.6, w: 2.0, h: 0.25, fontSize: 10, fontFace: "Microsoft YaHei", color: C.muted, align: "right", margin: 0 });
      }
    });

    card(s, 0.7, 4.85, 8.6, 0.55);
    s.addText("稳定币市值：$1350亿 → $2500亿+（18 个月增长 85%）| 链上美债：$50亿 → $3500亿（增长 70 倍）", {
      x: 0.9, y: 4.85, w: 8.2, h: 0.55, fontSize: 12, fontFace: "Microsoft YaHei", bold: true, color: C.accent, valign: "middle", margin: 0,
    });
  }

  // ═══════════════════ SLIDE 5: 产品流程 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "YieldNest 如何运作");

    const steps = [
      { num: "1", title: "入驻", desc: "15 分钟 KYB 企业验证\n智能账户即刻部署" },
      { num: "2", title: "入金", desc: "电汇 / ACH /\n链上转账\n→ USDC 到达账户" },
      { num: "3", title: "分配", desc: "AI 驱动分配引擎\n自动路由至最优策略\nBUIDL、Aave、Morpho" },
      { num: "4", title: "收益", desc: "每日复利\n实时仪表盘\n一键提现" },
    ];

    steps.forEach((st, i) => {
      const sx = 0.6 + i * 2.35;
      card(s, sx, 1.5, 2.1, 2.7);

      s.addShape("oval", { x: sx + 0.75, y: 1.7, w: 0.6, h: 0.6, fill: { color: C.accent } });
      s.addText(st.num, { x: sx + 0.75, y: 1.7, w: 0.6, h: 0.6, fontSize: 22, fontFace: "Arial", bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });

      s.addText(st.title, { x: sx + 0.15, y: 2.5, w: 1.8, h: 0.4, fontSize: 18, fontFace: "Microsoft YaHei", bold: true, color: C.white, align: "center", margin: 0 });
      s.addText(st.desc, { x: sx + 0.15, y: 3.0, w: 1.8, h: 0.9, fontSize: 11, fontFace: "Microsoft YaHei", color: C.muted, align: "center", margin: 0 });

      if (i < 3) {
        s.addText("▸", { x: sx + 2.1, y: 2.5, w: 0.25, h: 0.5, fontSize: 18, fontFace: "Arial", color: C.accent, align: "center", valign: "middle", margin: 0 });
      }
    });

    s.addText("Gas 费？我们代付。  私钥？用户无需触碰。  合规？内建其中。", {
      x: 0.7, y: 5.0, w: 8.6, h: 0.35, fontSize: 12, fontFace: "Microsoft YaHei", italic: true, color: C.muted, margin: 0,
    });
  }

  // ═══════════════════ SLIDE 6: 技术架构 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "让技术「隐形」");

    const layers = [
      { title: "表现层", desc: "Web 应用 · React Native 移动端 · REST API", detail: '「让 CFO 一眼就能看懂的界面」', color: C.accent2 },
      { title: "智能账户层", desc: "ERC-4337 · Safe{Core} · Passkey 认证 · 多签审批", detail: '「企业级安全，无需助记词」', color: C.accent },
      { title: "策略适配层", desc: "BUIDL | Aave V4 | Morpho | Ondo USDY | Ethena USDe", detail: '「多元化收益来源，自动优化配置」', color: C.accent3 },
    ];

    layers.forEach((l, i) => {
      const y = 1.5 + i * 1.2;
      card(s, 0.7, y, 8.6, 1.0);
      accentBar(s, 0.7, y, 0.06, 1.0, l.color);
      s.addText(l.title, { x: 1.1, y: y + 0.1, w: 4.0, h: 0.3, fontSize: 17, fontFace: "Microsoft YaHei", bold: true, color: l.color, margin: 0 });
      s.addText(l.desc, { x: 1.1, y: y + 0.42, w: 5.5, h: 0.25, fontSize: 14, fontFace: "Microsoft YaHei", color: C.text, margin: 0 });
      s.addText(l.detail, { x: 1.1, y: y + 0.68, w: 5.5, h: 0.25, fontSize: 11, fontFace: "Microsoft YaHei", italic: true, color: C.muted, margin: 0 });
    });

    // 安全标识
    const badges = ["SOC 2 认证", "ISO 27001", "多签治理", "Nexus Mutual 保险"];
    card(s, 0.7, 4.8, 8.6, 0.6);
    badges.forEach((b, i) => {
      const bx = 0.9 + i * 2.1;
      s.addShape("rect", { x: bx, y: 4.88, w: 1.9, h: 0.44, fill: { color: C.surface }, rectRadius: 0.06 });
      s.addText(b, { x: bx, y: 4.88, w: 1.9, h: 0.44, fontSize: 11, fontFace: "Microsoft YaHei", color: C.accent, align: "center", valign: "middle", margin: 0 });
    });
  }

  // ═══════════════════ SLIDE 7: 为什么是现在 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "三重顺风汇聚");

    const columns = [
      {
        title: "监管明朗化",
        bullets: [
          "美国 GENIUS 法案通过（联邦框架）",
          "欧盟 MiCA 全面生效",
          "香港/新加坡监管框架落地",
          "稳定币被认定为受监管金融工具",
        ],
      },
      {
        title: "基础设施成熟",
        bullets: [
          "ERC-4337 账户抽象主流 L2 全覆盖",
          "Passkey 在所有浏览器和设备上可用",
          "Base/Solana 交易费低于 $0.001",
          "Chainlink + Pyth 预言机可靠运行",
        ],
      },
      {
        title: "市场需求爆发",
        bullets: [
          "Stripe $11亿 收购 Bridge（稳定币基建）",
          "PayPal 发行 PYUSD，覆盖 4.3 亿用户",
          "贝莱德 BUIDL AUM 突破 $800亿",
          "稳定币年转账量同比增长 200%",
        ],
      },
    ];

    columns.forEach((col, i) => {
      const cx = 0.5 + i * 3.15;
      card(s, cx, 1.4, 2.9, 3.8);
      s.addText(col.title, { x: cx + 0.2, y: 1.55, w: 2.5, h: 0.45, fontSize: 18, fontFace: "Microsoft YaHei", bold: true, color: C.white, align: "center", margin: 0 });
      s.addText(
        col.bullets.map((b, j) => ({ text: b, options: { bullet: true, breakLine: j < col.bullets.length - 1 } })),
        { x: cx + 0.2, y: 2.15, w: 2.5, h: 2.8, fontSize: 11, fontFace: "Microsoft YaHei", color: C.text, paraSpaceAfter: 8 }
      );
    });
  }

  // ═══════════════════ SLIDE 8: 竞争格局 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "我们占据的市场空白");

    // 2×2 矩阵
    const mx = 0.7, my = 1.5, mw = 5.8, mh = 3.8;
    card(s, mx, my, mw, mh);

    s.addShape("line", { x: mx + mw/2, y: my, w: 0, h: mh, line: { color: C.border, width: 1 } });
    s.addShape("line", { x: mx, y: my + mh/2, w: mw, h: 0, line: { color: C.border, width: 1 } });

    s.addText("加密原生", { x: mx + 0.05, y: my + 0.05, w: 1.2, h: 0.25, fontSize: 9, fontFace: "Microsoft YaHei", color: C.muted, margin: 0 });
    s.addText("传统用户", { x: mx + mw - 1.2, y: my + 0.05, w: 1.2, h: 0.25, fontSize: 9, fontFace: "Microsoft YaHei", color: C.muted, align: "right", margin: 0 });
    s.addText("零售", { x: mx + 0.05, y: my + 0.3, w: 0.6, h: 0.25, fontSize: 9, fontFace: "Microsoft YaHei", color: C.muted, margin: 0 });
    s.addText("企业", { x: mx + 0.05, y: my + mh - 0.55, w: 0.6, h: 0.25, fontSize: 9, fontFace: "Microsoft YaHei", color: C.muted, margin: 0 });

    const competitors = [
      { name: "Aave /\nMorpho", x: mx + 0.3, y: my + 0.5, w: 1.1, h: 0.65, color: C.muted },
      { name: "Ondo\nFinance", x: mx + 1.7, y: my + 1.2, w: 1.1, h: 0.65, color: C.muted },
      { name: "Coinbase\n机构版", x: mx + 0.5, y: my + 2.4, w: 1.1, h: 0.65, color: C.muted },
      { name: "传统银行", x: mx + 3.8, y: my + 2.7, w: 1.1, h: 0.65, color: C.muted },
    ];
    competitors.forEach(c => {
      s.addShape("rect", { x: c.x, y: c.y, w: c.w, h: c.h, fill: { color: C.surface }, rectRadius: 0.05 });
      s.addText(c.name, { x: c.x, y: c.y, w: c.w, h: c.h, fontSize: 10, fontFace: "Microsoft YaHei", color: c.color, align: "center", valign: "middle", margin: 0 });
    });

    // YieldNest 位置
    const ynX = mx + 3.4, ynY = my + 0.5;
    s.addShape("rect", { x: ynX, y: ynY, w: 1.8, h: 0.75, fill: { color: C.accent }, rectRadius: 0.06, shadow: makeShadow() });
    s.addText("YieldNest", { x: ynX, y: ynY, w: 1.8, h: 0.75, fontSize: 14, fontFace: "Arial", bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });

    s.addText("◁  市场空白", { x: 5.3, y: 0.7, w: 2.5, h: 0.3, fontSize: 10, fontFace: "Microsoft YaHei", bold: true, color: C.accent, margin: 0 });
    s.addText("企业 + 传统用户\n没有竞争对手", { x: 5.3, y: 0.95, w: 2.5, h: 0.4, fontSize: 10, fontFace: "Microsoft YaHei", color: C.muted, margin: 0 });

    const rx = 6.9;
    s.addText("市场空白", { x: rx, y: 2.2, w: 2.8, h: 0.35, fontSize: 16, fontFace: "Microsoft YaHei", bold: true, color: C.white, margin: 0 });
    s.addText([
      { text: "现有 DeFi 产品服务", options: { breakLine: true } },
      { text: "加密原生用户。", options: { breakLine: true, paraSpaceAfter: 12 } },
      { text: "传统银行服务企业，", options: { breakLine: true } },
      { text: "但收益几乎为零。", options: { breakLine: true, paraSpaceAfter: 12 } },
      { text: "YieldNest 桥接二者：", options: { breakLine: true, bold: true, color: C.accent } },
      { text: "企业级体验 + DeFi 收益。", options: { bold: true, color: C.accent } },
    ], { x: rx, y: 2.6, w: 2.8, h: 2.5, fontSize: 12, fontFace: "Microsoft YaHei", color: C.text });
  }

  // ═══════════════════ SLIDE 9: 商业模式 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "收入模型");

    const streams = [
      { title: "AUM 管理费", pct: "0.3-0.5%", desc: "年化计提，核心收入来源", ex: "$5亿 AUM → $150-250万/年" },
      { title: "企业版订阅", pct: "$199-999/月", desc: "高级功能：多实体、API 接入、专属支持", ex: "SaaS 式经常性收入" },
      { title: "超额收益分成", pct: "10%", desc: "超过基准收益率部分的 10%", ex: "与客户利益对齐" },
      { title: "短期赎回费", pct: "0.1%", desc: "30 天内赎回收取", ex: "鼓励资金稳定留存" },
    ];

    streams.forEach((st, i) => {
      const sy = 1.4 + i * 0.9;
      card(s, 0.7, sy, 8.6, 0.75);
      if (i === 0) accentBar(s, 0.7, sy, 0.06, 0.75, C.accent);
      s.addText(st.title, { x: 1.1, y: sy + 0.05, w: 2.5, h: 0.3, fontSize: 15, fontFace: "Microsoft YaHei", bold: true, color: i === 0 ? C.accent : C.white, margin: 0 });
      s.addText(st.pct, { x: 1.1, y: sy + 0.3, w: 2.5, h: 0.25, fontSize: 12, fontFace: "Arial", color: C.muted, margin: 0 });
      s.addText(st.desc, { x: 3.8, y: sy + 0.1, w: 3.0, h: 0.55, fontSize: 13, fontFace: "Microsoft YaHei", color: C.text, margin: 0 });
      s.addText(st.ex, { x: 6.8, y: sy + 0.1, w: 2.3, h: 0.55, fontSize: 11, fontFace: "Microsoft YaHei", italic: true, color: C.muted, align: "right", valign: "middle", margin: 0 });
    });

    s.addText("单位经济模型：获客成本 ~$2,000（直销） · 客户生命周期价值 ~$30,000（5 年） · LTV/CAC = 15x", {
      x: 0.7, y: 5.05, w: 8.6, h: 0.35, fontSize: 11, fontFace: "Microsoft YaHei", italic: true, color: C.muted, margin: 0,
    });
  }

  // ═══════════════════ SLIDE 10: GTM ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "市场进入策略");

    const phases = [
      { phase: "第一阶段 · 第 1-6 月", title: "加密近邻优先", desc: "加密基金、DAO 金库、Web3 初创企业\n—— 门槛最低，采纳速度最快", color: C.accent },
      { phase: "第二阶段 · 第 7-12 月", title: "行业垂直突破", desc: "跨境电商、远程优先公司、自由职业平台\n数字服务出口商", color: C.accent2 },
      { phase: "第三阶段 · 第 13-24 月", title: "主流中小企业", desc: "直销团队 + 会计师事务所合作\nERP 集成（用友、金蝶、SAP）", color: C.accent3 },
    ];

    phases.forEach((p, i) => {
      const py = 1.4 + i * 1.15;
      card(s, 0.7, py, 8.6, 0.95);
      accentBar(s, 0.7, py, 0.06, 0.95, p.color);
      s.addText(p.phase, { x: 1.1, y: py + 0.08, w: 3.0, h: 0.22, fontSize: 11, fontFace: "Microsoft YaHei", color: p.color, margin: 0 });
      s.addText(p.title, { x: 1.1, y: py + 0.3, w: 3.5, h: 0.28, fontSize: 17, fontFace: "Microsoft YaHei", bold: true, color: C.white, margin: 0 });
      s.addText(p.desc, { x: 1.1, y: py + 0.55, w: 7.8, h: 0.36, fontSize: 12, fontFace: "Microsoft YaHei", color: C.text, margin: 0 });
    });

    s.addText("增长飞轮：更多 AUM → 更优收益 → 更多客户 → 更大 AUM", {
      x: 0.7, y: 4.95, w: 8.6, h: 0.35, fontSize: 12, fontFace: "Microsoft YaHei", italic: true, color: C.muted, margin: 0,
    });
  }

  // ═══════════════════ SLIDE 11: 护城河 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "构建护城河");

    const moats = [
      { icon: "🏛", title: "监管壁垒", desc: "MSB 牌照 + KYB 基础设施\n每个司法管辖区需 12+ 个月复制" },
      { icon: "🔗", title: "集成壁垒", desc: "深度优化路由直连\nBUIDL、Aave、Morpho、Ondo、Ethena" },
      { icon: "🛡", title: "信任壁垒", desc: "SOC 2、ISO 27001 认证\nNexus Mutual 保险保障" },
      { icon: "📊", title: "数据壁垒", desc: "自研风险评分与收益优化算法\n规模越大、效果越好" },
    ];

    moats.forEach((m, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const mx = 0.7 + col * 4.5;
      const my = 1.4 + row * 1.85;
      card(s, mx, my, 4.2, 1.65);
      s.addText(m.icon, { x: mx + 0.2, y: my + 0.2, w: 0.55, h: 0.55, fontSize: 28, align: "center", valign: "middle", margin: 0 });
      s.addText(m.title, { x: mx + 0.9, y: my + 0.2, w: 3.0, h: 0.35, fontSize: 17, fontFace: "Microsoft YaHei", bold: true, color: C.white, margin: 0 });
      s.addText(m.desc, { x: mx + 0.9, y: my + 0.6, w: 3.0, h: 0.8, fontSize: 12, fontFace: "Microsoft YaHei", color: C.muted, margin: 0 });
    });

    s.addText("转换成本：一旦嵌入企业财资管理流程，流失率趋近于零。", {
      x: 0.7, y: 5.05, w: 8.6, h: 0.35, fontSize: 12, fontFace: "Microsoft YaHei", italic: true, color: C.muted, margin: 0,
    });
  }

  // ═══════════════════ SLIDE 12: 路线图 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "12 个月路线图");

    const milestones = [
      { q: "2026 Q1 ✓", title: "基础", items: ["智能合约审计（Spearbit）", "测试网 MVP 部署"] },
      { q: "2026 Q2", title: "内测", items: ["10 家设计合作伙伴", "MSB 牌照申请提交"] },
      { q: "2026 Q3", title: "公测上线", items: ["BUIDL + Aave 策略上线", "50+ 企业入驻"] },
      { q: "2026 Q4", title: "增长", items: ["AUM $1亿 里程碑", "多链扩展：Arbitrum"] },
      { q: "2027 Q1", title: "规模化", items: ["AUM $2.5亿", "移动端 + 企业 API"] },
      { q: "2027 Q2", title: "扩张", items: ["AUM $5亿", "A 轮融资", "国际市场拓展"] },
    ];

    const tlY = 3.35;
    s.addShape("line", { x: 0.7, y: tlY, w: 8.6, h: 0, line: { color: C.accent, width: 2 } });

    milestones.forEach((m, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const mxx = 0.7 + i * 1.45;
      const dotColor = i === 0 ? C.accent : (i <= 3 ? C.accent : C.accent2);
      s.addShape("oval", { x: mxx + 0.35, y: tlY - 0.08, w: 0.16, h: 0.16, fill: { color: dotColor } });

      const cy = side === -1 ? tlY - 0.55 : tlY + 0.3;
      s.addText(m.q, { x: mxx - 0.15, y: cy - 0.32, w: 1.3, h: 0.25, fontSize: 9, fontFace: "Microsoft YaHei", color: C.muted, margin: 0 });
      s.addText(m.title, { x: mxx - 0.15, y: cy - 0.05, w: 1.3, h: 0.25, fontSize: 12, fontFace: "Microsoft YaHei", bold: true, color: C.white, margin: 0 });
      s.addText(m.items.join("\n"), { x: mxx - 0.15, y: cy + 0.25, w: 1.3, h: 0.6, fontSize: 8, fontFace: "Microsoft YaHei", color: C.muted, margin: 0 });
    });
  }

  // ═══════════════════ SLIDE 13: 财务预测 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "财务预测");

    const headerOpts = { bold: true, color: C.accent, fill: { color: C.surface }, fontFace: "Microsoft YaHei" };
    const rowOpts = (alt) => ({ fill: { color: alt ? C.card : C.surface }, fontFace: "Microsoft YaHei" });

    const tableData = [
      [
        { text: "年度", options: headerOpts },
        { text: "AUM", options: headerOpts },
        { text: "收入", options: headerOpts },
        { text: "支出", options: headerOpts },
        { text: "团队", options: headerOpts },
      ],
      [{ text: "第 1 年", options: rowOpts(true) }, { text: "$5000万", options: rowOpts(true) }, { text: "$25万", options: rowOpts(true) }, { text: "$150万", options: { ...rowOpts(true), color: C.red } }, { text: "12 人", options: rowOpts(true) }],
      [{ text: "第 2 年", options: rowOpts(false) }, { text: "$2.5亿", options: rowOpts(false) }, { text: "$125万", options: rowOpts(false) }, { text: "$250万", options: { ...rowOpts(false), color: C.red } }, { text: "25 人", options: rowOpts(false) }],
      [{ text: "第 3 年", options: rowOpts(true) }, { text: "$5亿", options: rowOpts(true) }, { text: "$350万", options: rowOpts(true) }, { text: "$400万", options: { ...rowOpts(true), color: C.red } }, { text: "40 人", options: rowOpts(true) }],
      [{ text: "第 4 年", options: rowOpts(false) }, { text: "$15亿", options: rowOpts(false) }, { text: "$1050万", options: { ...rowOpts(false), color: C.accent } }, { text: "$700万", options: { ...rowOpts(false), color: C.red } }, { text: "60 人", options: rowOpts(false) }],
      [{ text: "第 5 年", options: rowOpts(true) }, { text: "$50亿", options: rowOpts(true) }, { text: "$3500万", options: { ...rowOpts(true), color: C.accent, bold: true } }, { text: "$1500万", options: { ...rowOpts(true), color: C.red } }, { text: "85 人", options: rowOpts(true) }],
    ];

    s.addTable(tableData, {
      x: 0.7, y: 1.5, w: 8.6,
      colW: [1.6, 1.8, 1.8, 1.8, 1.6],
      rowH: [0.55, 0.52, 0.52, 0.52, 0.52, 0.52],
      border: { pt: 0.5, color: C.border },
      fontSize: 14,
      color: C.text,
      valign: "middle",
      align: "center",
    });

    card(s, 0.7, 4.7, 8.6, 0.7);
    s.addText([
      { text: "盈亏平衡：第 30-36 个月   ", options: { bold: true, color: C.accent } },
      { text: "|   第 5 年营业利润：$2000万（57% 利润率）   |   收入 CAGR：170%", options: { color: C.text } },
    ], { x: 0.9, y: 4.72, w: 8.2, h: 0.65, fontSize: 13, fontFace: "Microsoft YaHei", valign: "middle", margin: 0 });
  }

  // ═══════════════════ SLIDE 14: 融资需求 ═══════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.surface } });
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

    s.addText("加入我们", { x: 1, y: 0.6, w: 8, h: 0.7, fontSize: 40, fontFace: "Microsoft YaHei", bold: true, color: C.white, align: "center", margin: 0 });

    const askStats = [
      { val: "$500万", label: "种子轮融资\n（SAFE + 代币权证）" },
      { val: "40%", label: "产品与\n工程研发" },
      { val: "25%", label: "合规与\n牌照申请" },
      { val: "35%", label: "市场进入\n销售与运营" },
    ];
    askStats.forEach((a, i) => {
      const ax = 0.8 + i * 2.3;
      card(s, ax, 1.7, 2.0, 1.3);
      s.addText(a.val, { x: ax, y: 1.8, w: 2.0, h: 0.55, fontSize: 28, fontFace: "Microsoft YaHei", bold: true, color: C.accent, align: "center", margin: 0 });
      s.addText(a.label, { x: ax, y: 2.3, w: 2.0, h: 0.55, fontSize: 11, fontFace: "Microsoft YaHei", color: C.muted, align: "center", margin: 0 });
    });

    s.addText("目标投资人", { x: 0.7, y: 3.3, w: 8.6, h: 0.35, fontSize: 16, fontFace: "Microsoft YaHei", bold: true, color: C.white, margin: 0 });
    const investors = ["金融科技 VC", "加密基金", "战略天使投资人\n前 Stripe/Revolut/Circle", "机构收益\n基金"];
    investors.forEach((inv, i) => {
      const ix = 0.7 + i * 2.25;
      card(s, ix, 3.7, 2.0, 0.8);
      s.addText(inv, { x: ix, y: 3.7, w: 2.0, h: 0.8, fontSize: 12, fontFace: "Microsoft YaHei", color: C.text, align: "center", valign: "middle", margin: 0 });
    });

    s.addText('「$20 万亿美元现金市场正在向链上迁移。YieldNest 就是这座桥梁。」', {
      x: 1, y: 4.75, w: 8, h: 0.45, fontSize: 16, fontFace: "Microsoft YaHei", italic: true, color: C.accent, align: "center", margin: 0,
    });

    s.addText("team@yieldnest.io", { x: 0.7, y: 5.3, w: 3, h: 0.3, fontSize: 11, fontFace: "Arial", color: C.muted, margin: 0 });
  }

  await pres.writeFile({ fileName: "E:\\workspace\\assit\\stablecoin\\yieldnest-pitch-deck-cn.pptx" });
  console.log("中文版 Pitch Deck 创建成功！");
}

run().catch(err => { console.error(err); process.exit(1); });
