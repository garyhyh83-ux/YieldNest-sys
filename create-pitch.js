const pptxgen = require("pptxgenjs");

// ── Color Palette (no # prefix!) ──
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
  gold:     "F0C050",
  green:    "22C55E",
};

// ── Helpers ──
const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.25 });

function card(slide, x, y, w, h) {
  slide.addShape("rect", { x, y, w, h, fill: { color: C.card }, rectRadius: 0.08, shadow: makeShadow() });
}

function accentBar(slide, x, y, w, h, color = C.accent) {
  slide.addShape("rect", { x, y, w, h, fill: { color } });
}

function sectionTitle(slide, text, y = 0.35) {
  slide.addText(text, { x: 0.7, y, w: 8.6, h: 0.55, fontSize: 30, fontFace: "Arial", bold: true, color: C.white, margin: 0 });
  slide.addShape("rect", { x: 0.7, y: y + 0.58, w: 0.8, h: 0.04, fill: { color: C.accent } });
}

function footnote(slide, text) {
  slide.addText(text, { x: 0.7, y: 5.0, w: 8.6, h: 0.45, fontSize: 11, fontFace: "Arial", italic: true, color: C.muted, margin: 0 });
}

function bulletSlide(slide, items, startY = 1.4) {
  slide.addText(
    items.map((item, i) => ({ text: item, options: { bullet: true, breakLine: i < items.length - 1 } })),
    { x: 0.7, y: startY, w: 8.6, h: 3.2, fontSize: 15, fontFace: "Arial", color: C.text, paraSpaceAfter: 8, valign: "top" }
  );
}

function bigStat(slide, x, y, value, label, color = C.accent) {
  slide.addText(value, { x, y, w: 2.5, h: 0.7, fontSize: 36, fontFace: "Arial", bold: true, color, margin: 0 });
  slide.addText(label, { x, y: y + 0.6, w: 2.5, h: 0.35, fontSize: 11, fontFace: "Arial", color: C.muted, margin: 0 });
}

async function run() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "YieldNest";
  pres.title = "YieldNest Pitch Deck";

  // ═══════════════════════════════════════════
  // SLIDE 1: TITLE
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    // Gradient-like overlay shapes
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.surface } });
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

    // Large logo mark (abstract shapes)
    s.addShape("rect", { x: 4.1, y: 1.15, w: 1.8, h: 1.8, fill: { color: C.accent }, rectRadius: 0.3 });
    s.addText("YN", { x: 4.1, y: 1.15, w: 1.8, h: 1.8, fontSize: 52, fontFace: "Arial", bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });
    s.addShape("rect", { x: 4.5, y: 1.5, w: 1.0, h: 1.0, fill: { color: "000000", transparency: 30 }, rectRadius: 0.2 });

    s.addText("YieldNest", { x: 1, y: 3.2, w: 8, h: 0.8, fontSize: 44, fontFace: "Arial", bold: true, color: C.white, align: "center", margin: 0 });
    s.addText("Enterprise-Grade Stablecoin Yield Aggregation", { x: 1.5, y: 3.9, w: 7, h: 0.45, fontSize: 16, fontFace: "Arial", color: C.accent, align: "center", margin: 0 });
    s.addText("The Corporate \"Yu'e Bao\" for the Blockchain Era", { x: 1.5, y: 4.3, w: 7, h: 0.4, fontSize: 13, fontFace: "Arial", color: C.muted, align: "center", margin: 0 });

    s.addText("Confidential · May 2026", { x: 0.7, y: 5.15, w: 3, h: 0.3, fontSize: 10, fontFace: "Arial", color: C.muted, margin: 0 });
  }

  // ═══════════════════════════════════════════
  // SLIDE 2: THE PROBLEM
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "The $20 Trillion Cash Problem");

    // Stats row
    const stats = [
      { val: "$20T", label: "Global SMB cash\nin equivalents" },
      { val: "0.01%", label: "Average bank\ncash yield" },
      { val: "4-5%", label: "On-chain Treasury\nyield (BUIDL)" },
      { val: "0", label: "Enterprise-friendly\naccess products" },
    ];
    stats.forEach((st, i) => {
      const sx = 0.7 + i * 2.2;
      card(s, sx, 1.3, 2.0, 1.35);
      s.addText(st.val, { x: sx, y: 1.4, w: 2.0, h: 0.6, fontSize: 30, fontFace: "Arial", bold: true, color: st.val === "0" ? C.red : C.accent, align: "center", margin: 0 });
      s.addText(st.label, { x: sx, y: 1.95, w: 2.0, h: 0.55, fontSize: 11, fontFace: "Arial", color: C.muted, align: "center", margin: 0 });
    });

    bulletSlide(s, [
      "Global SMBs hold ~$20T in cash equivalents earning near-zero interest",
      "Traditional banks offer 0.01-0.5% APY on business savings accounts",
      "Meanwhile, on-chain U.S. Treasury products (BlackRock BUIDL) yield 4-5%",
      "But wallets, private keys, gas fees, and compliance fears block enterprise adoption",
      "\"The yield exists — the access doesn't.\"",
    ], 2.85);

    // Adjust bullet area height for 5 items
    // Already fits: 5 items at 15px + spacing ≈ 1.5 inches, box height 1.8

    footnote(s, "Sources: Federal Reserve Financial Stability Report, BlackRock BUIDL Fact Sheet, SMB Cash Management Survey 2025");
  }

  // ═══════════════════════════════════════════
  // SLIDE 3: THE SOLUTION
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "YieldNest: One Click to 4-5% Yield");

    // "Traditional" column
    card(s, 0.5, 1.4, 4.1, 3.5);
    s.addShape("rect", { x: 0.5, y: 1.4, w: 4.1, h: 0.45, fill: { color: C.red, transparency: 85 } });
    s.addText("TRADITIONAL", { x: 0.7, y: 1.42, w: 3.7, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: C.red, margin: 0 });
    const traditionalItems = [
      "Bank savings account",
      "0.01% APY (effectively zero)",
      "Multiple bank relationships",
      "2-4 week onboarding per bank",
      "No real-time visibility",
    ];
    s.addText(
      traditionalItems.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < traditionalItems.length - 1 } })),
      { x: 0.8, y: 2.1, w: 3.5, h: 2.6, fontSize: 13, fontFace: "Arial", color: C.text, paraSpaceAfter: 10 }
    );

    // Arrow between
    s.addText("→", { x: 4.3, y: 2.8, w: 1.4, h: 0.6, fontSize: 36, fontFace: "Arial", bold: true, color: C.accent, align: "center", valign: "middle", margin: 0 });

    // "YieldNest" column
    card(s, 5.4, 1.4, 4.1, 3.5);
    s.addShape("rect", { x: 5.4, y: 1.4, w: 4.1, h: 0.45, fill: { color: C.accent, transparency: 85 } });
    s.addText("YIELDNEST", { x: 5.6, y: 1.42, w: 3.7, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: C.accent, margin: 0 });
    const ynItems = [
      "Smart account with 4-5% APY",
      "400x better yield than banks",
      "Single unified dashboard",
      "15-minute online onboarding",
      "Real-time yield tracking",
      "API + Mobile + Web",
    ];
    s.addText(
      ynItems.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < ynItems.length - 1 } })),
      { x: 5.6, y: 2.1, w: 3.7, h: 2.6, fontSize: 13, fontFace: "Arial", color: C.text, paraSpaceAfter: 10 }
    );

    s.addText("Zero crypto knowledge required. Just deposit USDC, earn yield.", {
      x: 0.7, y: 5.05, w: 8.6, h: 0.35, fontSize: 13, fontFace: "Arial", italic: true, color: C.accent, margin: 0,
    });
  }

  // ═══════════════════════════════════════════
  // SLIDE 4: MARKET SIZE
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "Massive Addressable Market");

    // TAM/SAM/SOM as stacked cards
    const layers = [
      { label: "TAM", desc: "Global SMB Cash Management", val: "$300B", w: 8.6, color: C.border, tcolor: C.muted },
      { label: "SAM", desc: "SMBs Willing to Hold Stablecoins", val: "$50B", w: 6.5, color: C.accent, tcolor: C.white, t2: "17% of TAM" },
      { label: "SOM", desc: "Year 5 Revenue Target (0.7% effective fee)", val: "$35M", w: 4.3, color: C.accent, tcolor: C.white, t2: "On $5B AUM" },
    ];

    layers.forEach((l, i) => {
      const y = 1.4 + i * 1.15;
      const cx = (10 - l.w) / 2;
      s.addShape("rect", { x: cx, y, w: l.w, h: 0.95, fill: { color: l.color }, rectRadius: 0.08 });
      if (l.label === "SOM") {
        s.addShape("rect", { x: cx, y, w: l.w, h: 0.95, fill: { color: C.accent }, rectRadius: 0.08 });
      }
      s.addText(l.label, { x: cx + 0.25, y: y + 0.1, w: 1.0, h: 0.3, fontSize: 11, fontFace: "Arial", bold: true, color: l.label === "SOM" ? C.bg : C.accent, margin: 0 });
      s.addText(l.desc, { x: cx + 0.25, y: y + 0.38, w: l.w - 2.5, h: 0.25, fontSize: 12, fontFace: "Arial", color: l.tcolor, margin: 0 });
      s.addText(l.val, { x: cx + l.w - 2.2, y: y + 0.15, w: 2.0, h: 0.55, fontSize: 28, fontFace: "Arial", bold: true, color: l.tcolor, align: "right", margin: 0 });
      if (l.t2) {
        s.addText(l.t2, { x: cx + l.w - 2.2, y: y + 0.6, w: 2.0, h: 0.25, fontSize: 10, fontFace: "Arial", color: C.muted, align: "right", margin: 0 });
      }
    });

    // Callout
    card(s, 0.7, 4.85, 8.6, 0.55);
    s.addText("Stablecoin market cap: $135B → $250B+ in 18 months (85% growth) | On-chain US Treasuries: $5B → $350B (70x)", {
      x: 0.9, y: 4.85, w: 8.2, h: 0.55, fontSize: 12, fontFace: "Arial", bold: true, color: C.accent, valign: "middle", margin: 0,
    });
  }

  // ═══════════════════════════════════════════
  // SLIDE 5: HOW IT WORKS
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "How YieldNest Works");

    const steps = [
      { num: "1", title: "Onboard", desc: "15-min KYB verification\nSmart account\ninstant deployment" },
      { num: "2", title: "Deposit", desc: "Wire / ACH /\nOn-chain transfer\n→ USDC in your account" },
      { num: "3", title: "Allocate", desc: "AI allocation engine\nroutes to optimal\nBUIDL, Aave, Morpho" },
      { num: "4", title: "Earn", desc: "Daily compound yield\nReal-time dashboard\nOne-click withdrawal" },
    ];

    steps.forEach((st, i) => {
      const sx = 0.6 + i * 2.35;
      card(s, sx, 1.5, 2.1, 2.7);

      // Step number circle
      s.addShape("oval", { x: sx + 0.75, y: 1.7, w: 0.6, h: 0.6, fill: { color: C.accent } });
      s.addText(st.num, { x: sx + 0.75, y: 1.7, w: 0.6, h: 0.6, fontSize: 22, fontFace: "Arial", bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });

      s.addText(st.title, { x: sx + 0.15, y: 2.5, w: 1.8, h: 0.4, fontSize: 18, fontFace: "Arial", bold: true, color: C.white, align: "center", margin: 0 });
      s.addText(st.desc, { x: sx + 0.15, y: 3.0, w: 1.8, h: 0.9, fontSize: 11, fontFace: "Arial", color: C.muted, align: "center", margin: 0 });

      // Arrows between
      if (i < 3) {
        s.addText("▸", { x: sx + 2.1, y: 2.5, w: 0.25, h: 0.5, fontSize: 18, fontFace: "Arial", color: C.accent, align: "center", valign: "middle", margin: 0 });
      }
    });

    footnote(s, "Gas fees? We abstract them.   Private keys? Never touch them.   Compliance? Built in.");
  }

  // ═══════════════════════════════════════════
  // SLIDE 6: PRODUCT ARCHITECTURE
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "Technology That Disappears");

    const layers = [
      { title: "Presentation Layer", desc: "Web App · React Native Mobile · REST API", detail: "\"The interface your CFO already understands\"", color: C.accent2 },
      { title: "Smart Account Layer", desc: "ERC-4337 · Safe{Core} · Passkey Auth · Multi-sig Approval", detail: "\"Enterprise-grade security without seed phrases\"", color: C.accent },
      { title: "Strategy Adapter Layer", desc: "BUIDL | Aave V4 | Morpho | Ondo USDY | Ethena USDe", detail: "\"Diversified yield sources, automatically optimized\"", color: C.accent3 },
    ];

    layers.forEach((l, i) => {
      const y = 1.5 + i * 1.2;
      card(s, 0.7, y, 8.6, 1.0);
      accentBar(s, 0.7, y, 0.06, 1.0, l.color);
      s.addText(l.title, { x: 1.1, y: y + 0.1, w: 4.0, h: 0.3, fontSize: 16, fontFace: "Arial", bold: true, color: l.color, margin: 0 });
      s.addText(l.desc, { x: 1.1, y: y + 0.42, w: 5.0, h: 0.25, fontSize: 13, fontFace: "Arial", color: C.text, margin: 0 });
      s.addText(l.detail, { x: 1.1, y: y + 0.65, w: 5.0, h: 0.25, fontSize: 10, fontFace: "Arial", italic: true, color: C.muted, margin: 0 });
    });

    // Security badges
    const badges = ["SOC 2", "ISO 27001", "Multi-sig Governance", "Nexus Mutual Insurance"];
    card(s, 0.7, 4.8, 8.6, 0.6);
    badges.forEach((b, i) => {
      const bx = 0.9 + i * 2.1;
      s.addShape("rect", { x: bx, y: 4.88, w: 1.9, h: 0.44, fill: { color: C.surface }, rectRadius: 0.06 });
      s.addText(b, { x: bx, y: 4.88, w: 1.9, h: 0.44, fontSize: 11, fontFace: "Arial", color: C.accent, align: "center", valign: "middle", margin: 0 });
    });
  }

  // ═══════════════════════════════════════════
  // SLIDE 7: WHY NOW
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "Three Tailwinds Converging");

    const columns = [
      {
        title: "Regulatory Clarity",
        icon: "🏛",
        bullets: [
          "GENIUS Act passed (US federal framework)",
          "MiCA fully live across EU",
          "HK/Singapore frameworks operational",
          "Stablecoins now regulated financial instruments",
        ],
      },
      {
        title: "Infrastructure Maturity",
        icon: "⚡",
        bullets: [
          "ERC-4337 Account Abstraction live on all L2s",
          "Passkeys in every browser & device",
          "$0.001 transaction fees on Base/Solana",
          "Chainlink + Pyth oracle reliability",
        ],
      },
      {
        title: "Market Demand",
        icon: "📈",
        bullets: [
          "Stripe acquired Bridge for $1.1B (stablecoin infra)",
          "PayPal launched PYUSD for 430M users",
          "BlackRock BUIDL surpassed $80B AUM",
          "Year-over-year stablecoin transfer volume up 200%",
        ],
      },
    ];

    columns.forEach((col, i) => {
      const cx = 0.5 + i * 3.15;
      card(s, cx, 1.4, 2.9, 3.8);
      s.addText(col.icon, { x: cx, y: 1.55, w: 2.9, h: 0.5, fontSize: 28, align: "center", margin: 0 });
      s.addText(col.title, { x: cx + 0.2, y: 2.05, w: 2.5, h: 0.4, fontSize: 18, fontFace: "Arial", bold: true, color: C.white, align: "center", margin: 0 });
      s.addText(
        col.bullets.map((b, j) => ({ text: b, options: { bullet: true, breakLine: j < col.bullets.length - 1 } })),
        { x: cx + 0.2, y: 2.55, w: 2.5, h: 2.4, fontSize: 11, fontFace: "Arial", color: C.text, paraSpaceAfter: 6 }
      );
    });
  }

  // ═══════════════════════════════════════════
  // SLIDE 8: COMPETITIVE LANDSCAPE
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "The White Space We Occupy");

    // 2x2 matrix
    const mx = 0.7, my = 1.5, mw = 5.8, mh = 3.8;
    card(s, mx, my, mw, mh);

    // Quadrant lines
    s.addShape("line", { x: mx + mw/2, y: my, w: 0, h: mh, line: { color: C.border, width: 1 } });
    s.addShape("line", { x: mx, y: my + mh/2, w: mw, h: 0, line: { color: C.border, width: 1 } });

    // Axis labels
    s.addText("Crypto Native", { x: mx + 0.05, y: my + 0.05, w: 1.5, h: 0.25, fontSize: 9, fontFace: "Arial", color: C.muted, margin: 0 });
    s.addText("Traditional", { x: mx + mw - 1.5, y: my + 0.05, w: 1.5, h: 0.25, fontSize: 9, fontFace: "Arial", color: C.muted, align: "right", margin: 0 });
    s.addText("Retail", { x: mx + 0.05, y: my + 0.3, w: 0.8, h: 0.25, fontSize: 9, fontFace: "Arial", color: C.muted, margin: 0 });
    s.addText("Enterprise", { x: mx + 0.05, y: my + mh - 0.55, w: 0.8, h: 0.25, fontSize: 9, fontFace: "Arial", color: C.muted, margin: 0 });

    // Competitors plotted
    const competitors = [
      { name: "Aave/\nMorpho", x: mx + 0.3, y: my + 0.5, w: 1.1, h: 0.65, color: C.muted },
      { name: "Ondo\nFinance", x: mx + 1.7, y: my + 1.2, w: 1.1, h: 0.65, color: C.muted },
      { name: "Coinbase\nInst.", x: mx + 0.5, y: my + 2.4, w: 1.1, h: 0.65, color: C.muted },
      { name: "Traditional\nBanks", x: mx + 3.8, y: my + 2.7, w: 1.1, h: 0.65, color: C.muted },
    ];
    competitors.forEach(c => {
      s.addShape("rect", { x: c.x, y: c.y, w: c.w, h: c.h, fill: { color: C.surface }, rectRadius: 0.05 });
      s.addText(c.name, { x: c.x, y: c.y, w: c.w, h: c.h, fontSize: 10, fontFace: "Arial", color: c.color, align: "center", valign: "middle", margin: 0 });
    });

    // YIELDNEST in the white space
    const ynX = mx + 3.4, ynY = my + 0.5;
    s.addShape("rect", { x: ynX, y: ynY, w: 1.8, h: 0.75, fill: { color: C.accent }, rectRadius: 0.06, shadow: makeShadow() });
    s.addText("YieldNest", { x: ynX, y: ynY, w: 1.8, h: 0.75, fontSize: 14, fontFace: "Arial", bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });

    // Annotation
    s.addText("◁  WHITE SPACE", { x: 5.3, y: 0.7, w: 2.5, h: 0.3, fontSize: 10, fontFace: "Arial", bold: true, color: C.accent, margin: 0 });
    s.addText("Enterprise + Traditional\nNO COMPETITOR", { x: 5.3, y: 0.95, w: 2.5, h: 0.4, fontSize: 10, fontFace: "Arial", color: C.muted, margin: 0 });

    // Right side explanation
    const rx = 6.9;
    s.addText("The Gap", { x: rx, y: 2.2, w: 2.8, h: 0.35, fontSize: 16, fontFace: "Arial", bold: true, color: C.white, margin: 0 });
    s.addText([
      { text: "Existing DeFi products", options: { breakLine: true } },
      { text: "serve crypto-native users.", options: { breakLine: true, paraSpaceAfter: 12 } },
      { text: "Traditional banks serve", options: { breakLine: true } },
      { text: "enterprises but offer", options: { breakLine: true } },
      { text: "near-zero yield.", options: { breakLine: true, paraSpaceAfter: 12 } },
      { text: "YieldNest bridges both:", options: { breakLine: true, bold: true, color: C.accent } },
      { text: "enterprise UX + DeFi yield.", options: { bold: true, color: C.accent } },
    ], { x: rx, y: 2.6, w: 2.8, h: 2.5, fontSize: 12, fontFace: "Arial", color: C.text });
  }

  // ═══════════════════════════════════════════
  // SLIDE 9: BUSINESS MODEL
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "Revenue Model");

    const streams = [
      { title: "AUM Management Fee", pct: "0.3-0.5%", desc: "Annualized, primary revenue driver", ex: "$1.5M/yr on $500M AUM", accent: true },
      { title: "Enterprise Tier", pct: "$199-999/mo", desc: "Premium features: multi-entity, API, dedicated support", ex: "SaaS-style recurring", accent: false },
      { title: "Yield Spread", pct: "10%", desc: "Retain 10% of excess yield above benchmark", ex: "Performance-aligned", accent: false },
      { title: "Early Redemption", pct: "0.1%", desc: "Fee on withdrawals within 30 days", ex: "Encourages sticky deposits", accent: false },
    ];

    streams.forEach((st, i) => {
      const sy = 1.4 + i * 0.9;
      card(s, 0.7, sy, 8.6, 0.75);
      if (st.accent) {
        accentBar(s, 0.7, sy, 0.06, 0.75, C.accent);
      }
      s.addText(st.title, { x: 1.1, y: sy + 0.05, w: 3.0, h: 0.3, fontSize: 15, fontFace: "Arial", bold: true, color: st.accent ? C.accent : C.white, margin: 0 });
      s.addText(st.pct, { x: 1.1, y: sy + 0.3, w: 3.0, h: 0.25, fontSize: 12, fontFace: "Arial", color: C.muted, margin: 0 });
      s.addText(st.desc, { x: 4.2, y: sy + 0.1, w: 3.0, h: 0.55, fontSize: 13, fontFace: "Arial", color: C.text, margin: 0 });
      s.addText(st.ex, { x: 7.2, y: sy + 0.1, w: 1.9, h: 0.55, fontSize: 11, fontFace: "Arial", italic: true, color: C.muted, align: "right", valign: "middle", margin: 0 });
    });

    footnote(s, "Unit economics:  CAC ~$2,000 (direct sales)  ·  LTV ~$30,000 (5-year enterprise)  ·  LTV/CAC = 15x");
  }

  // ═══════════════════════════════════════════
  // SLIDE 10: GTM
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "Go-To-Market Strategy");

    const phases = [
      { phase: "Phase 1 · M1-M6", title: "Crypto-Adjacent First", desc: "Crypto funds, DAO treasuries, Web3 startups\n— low hanging fruit, fastest adoption cycles", color: C.accent },
      { phase: "Phase 2 · M7-M12", title: "Industry Verticals", desc: "Cross-border e-commerce, remote-first companies,\nfreelance platforms, digital service exporters", color: C.accent2 },
      { phase: "Phase 3 · M13-M24", title: "Mainstream SMB", desc: "Direct sales + accounting firm partnerships\nERP integrations (NetSuite, QuickBooks, Xero)", color: C.accent3 },
    ];

    phases.forEach((p, i) => {
      const py = 1.4 + i * 1.15;
      card(s, 0.7, py, 8.6, 0.95);
      accentBar(s, 0.7, py, 0.06, 0.95, p.color);
      s.addText(p.phase, { x: 1.1, y: py + 0.08, w: 3.0, h: 0.22, fontSize: 11, fontFace: "Arial", color: p.color, margin: 0 });
      s.addText(p.title, { x: 1.1, y: py + 0.3, w: 3.5, h: 0.28, fontSize: 17, fontFace: "Arial", bold: true, color: C.white, margin: 0 });
      s.addText(p.desc, { x: 1.1, y: py + 0.55, w: 7.8, h: 0.36, fontSize: 12, fontFace: "Arial", color: C.text, margin: 0 });
    });

    s.addText("Growth flywheel:  More AUM → Better yields → More clients → Larger AUM", {
      x: 0.7, y: 4.95, w: 8.6, h: 0.35, fontSize: 11, fontFace: "Arial", italic: true, color: C.muted, margin: 0,
    });
  }

  // ═══════════════════════════════════════════
  // SLIDE 11: MOAT
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "Moat Building");

    const moats = [
      { icon: "🏛", title: "Regulatory Moat", desc: "MSB licenses + KYB infrastructure\n12+ months to replicate per jurisdiction" },
      { icon: "🔗", title: "Integration Moat", desc: "Direct optimized routing to\nBUIDL, Aave, Morpho, Ondo, Ethena" },
      { icon: "🛡", title: "Trust Moat", desc: "SOC 2, ISO 27001 certifications\nNexus Mutual insurance coverage" },
      { icon: "📊", title: "Data Moat", desc: "Proprietary risk scoring & yield\noptimization improves with scale" },
    ];

    moats.forEach((m, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const mx = 0.7 + col * 4.5;
      const my = 1.4 + row * 1.85;
      card(s, mx, my, 4.2, 1.65);
      s.addText(m.icon, { x: mx + 0.2, y: my + 0.2, w: 0.55, h: 0.55, fontSize: 28, align: "center", valign: "middle", margin: 0 });
      s.addText(m.title, { x: mx + 0.9, y: my + 0.2, w: 3.0, h: 0.35, fontSize: 17, fontFace: "Arial", bold: true, color: C.white, margin: 0 });
      s.addText(m.desc, { x: mx + 0.9, y: my + 0.6, w: 3.0, h: 0.8, fontSize: 12, fontFace: "Arial", color: C.muted, margin: 0 });
    });

    footnote(s, "Switching cost: Once integrated into corporate treasury workflows, churn is near-zero.");
  }

  // ═══════════════════════════════════════════
  // SLIDE 12: ROADMAP
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "12-Month Roadmap");

    const milestones = [
      { q: "Q1 2026 ✓", title: "Foundation", items: ["Smart contract audit (Spearbit)", "Testnet MVP deployment"] },
      { q: "Q2 2026", title: "Private Beta", items: ["10 enterprise design partners", "MSB license application filed"] },
      { q: "Q3 2026", title: "Public Launch", items: ["BUIDL + Aave strategies live", "50+ enterprises onboarded"] },
      { q: "Q4 2026", title: "Growth", items: ["$100M AUM milestone", "Multi-chain: Arbitrum"] },
      { q: "Q1 2027", title: "Scale", items: ["$250M AUM", "Mobile app + Enterprise API"] },
      { q: "Q2 2027", title: "Expansion", items: ["$500M AUM", "Series A raise", "International expansion"] },
    ];

    // Timeline line
    const tlY = 3.35;
    s.addShape("line", { x: 0.7, y: tlY, w: 8.6, h: 0, line: { color: C.accent, width: 2 } });

    milestones.forEach((m, i) => {
      const side = i % 2 === 0 ? -1 : 1; // alternate above/below
      const mx = 0.7 + i * 1.45;
      // Dot on timeline
      const dotColor = i === 0 ? C.accent : (i <= 3 ? C.accent : C.accent2);
      s.addShape("oval", { x: mx + 0.35, y: tlY - 0.08, w: 0.16, h: 0.16, fill: { color: dotColor } });

      const cy = side === -1 ? tlY - 0.55 : tlY + 0.3;
      // Quarter label
      s.addText(m.q, { x: mx - 0.15, y: cy - 0.32, w: 1.3, h: 0.25, fontSize: 9, fontFace: "Arial", color: C.muted, margin: 0 });
      s.addText(m.title, { x: mx - 0.15, y: cy - 0.05, w: 1.3, h: 0.25, fontSize: 11, fontFace: "Arial", bold: true, color: C.white, margin: 0 });
      s.addText(m.items.join("\n"), { x: mx - 0.15, y: cy + 0.25, w: 1.3, h: 0.6, fontSize: 8, fontFace: "Arial", color: C.muted, margin: 0 });
    });
  }

  // ═══════════════════════════════════════════
  // SLIDE 13: FINANCIAL PROJECTIONS
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    sectionTitle(s, "Financial Projections");

    // Table
    const tableData = [
      [
        { text: "Year", options: { bold: true, color: C.accent, fill: { color: C.surface } } },
        { text: "AUM", options: { bold: true, color: C.accent, fill: { color: C.surface } } },
        { text: "Revenue", options: { bold: true, color: C.accent, fill: { color: C.surface } } },
        { text: "Burn", options: { bold: true, color: C.accent, fill: { color: C.surface } } },
        { text: "Team", options: { bold: true, color: C.accent, fill: { color: C.surface } } },
      ],
      [
        { text: "Year 1", options: { fill: { color: C.card } } },
        { text: "$50M", options: { fill: { color: C.card } } },
        { text: "$250K", options: { fill: { color: C.card } } },
        { text: "$1.5M", options: { fill: { color: C.card }, color: C.red } },
        { text: "12", options: { fill: { color: C.card } } },
      ],
      [
        { text: "Year 2", options: { fill: { color: C.surface } } },
        { text: "$250M", options: { fill: { color: C.surface } } },
        { text: "$1.25M", options: { fill: { color: C.surface } } },
        { text: "$2.5M", options: { fill: { color: C.surface }, color: C.red } },
        { text: "25", options: { fill: { color: C.surface } } },
      ],
      [
        { text: "Year 3", options: { fill: { color: C.card } } },
        { text: "$500M", options: { fill: { color: C.card } } },
        { text: "$3.5M", options: { fill: { color: C.card } } },
        { text: "$4M", options: { fill: { color: C.card }, color: C.red } },
        { text: "40", options: { fill: { color: C.card } } },
      ],
      [
        { text: "Year 4", options: { fill: { color: C.surface } } },
        { text: "$1.5B", options: { fill: { color: C.surface } } },
        { text: "$10.5M", options: { fill: { color: C.surface }, color: C.accent } },
        { text: "$7M", options: { fill: { color: C.surface }, color: C.red } },
        { text: "60", options: { fill: { color: C.surface } } },
      ],
      [
        { text: "Year 5", options: { fill: { color: C.card } } },
        { text: "$5B", options: { fill: { color: C.card } } },
        { text: "$35M", options: { fill: { color: C.card }, color: C.accent, bold: true } },
        { text: "$15M", options: { fill: { color: C.card }, color: C.red } },
        { text: "85", options: { fill: { color: C.card } } },
      ],
    ];

    s.addTable(tableData, {
      x: 0.7, y: 1.5, w: 8.6,
      colW: [1.6, 1.8, 1.8, 1.8, 1.6],
      rowH: [0.55, 0.52, 0.52, 0.52, 0.52, 0.52],
      border: { pt: 0.5, color: C.border },
      fontFace: "Arial",
      fontSize: 14,
      color: C.text,
      valign: "middle",
      align: "center",
    });

    // Breakeven callout
    card(s, 0.7, 4.7, 8.6, 0.7);
    s.addText([
      { text: "Breakeven: Month 30-36   ", options: { bold: true, color: C.accent } },
      { text: "|   Year 5 OP: $20M (57% margin)   |   Revenue CAGR: 170%", options: { color: C.text } },
    ], { x: 0.9, y: 4.72, w: 8.2, h: 0.65, fontSize: 14, fontFace: "Arial", valign: "middle", margin: 0 });
  }

  // ═══════════════════════════════════════════
  // SLIDE 14: THE ASK
  // ═══════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.surface } });
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

    s.addText("Join Us", { x: 1, y: 0.6, w: 8, h: 0.7, fontSize: 38, fontFace: "Arial", bold: true, color: C.white, align: "center", margin: 0 });

    // Key metrics
    const askStats = [
      { val: "$5M", label: "Seed Round\n(SAFE + Token Warrant)" },
      { val: "40%", label: "Product &\nEngineering" },
      { val: "25%", label: "Compliance &\nLicensing" },
      { val: "35%", label: "GTM + Sales\n& Operations" },
    ];
    askStats.forEach((a, i) => {
      const ax = 0.8 + i * 2.3;
      card(s, ax, 1.7, 2.0, 1.3);
      s.addText(a.val, { x: ax, y: 1.8, w: 2.0, h: 0.55, fontSize: 28, fontFace: "Arial", bold: true, color: C.accent, align: "center", margin: 0 });
      s.addText(a.label, { x: ax, y: 2.3, w: 2.0, h: 0.55, fontSize: 11, fontFace: "Arial", color: C.muted, align: "center", margin: 0 });
    });

    // Investor targets
    s.addText("Target Investors", { x: 0.7, y: 3.3, w: 8.6, h: 0.35, fontSize: 16, fontFace: "Arial", bold: true, color: C.white, margin: 0 });
    const investors = ["FinTech VCs", "Crypto Funds", "Strategic Angels\nex-Stripe, ex-Revolut, ex-Circle", "Institutional\nYield Funds"];
    investors.forEach((inv, i) => {
      const ix = 0.7 + i * 2.25;
      card(s, ix, 3.7, 2.0, 0.8);
      s.addText(inv, { x: ix, y: 3.7, w: 2.0, h: 0.8, fontSize: 12, fontFace: "Arial", color: C.text, align: "center", valign: "middle", margin: 0 });
    });

    // Closing quote
    s.addText("\"The $20 trillion cash market is moving on-chain. YieldNest is the bridge.\"", {
      x: 1, y: 4.75, w: 8, h: 0.45, fontSize: 16, fontFace: "Arial", italic: true, color: C.accent, align: "center", margin: 0,
    });

    s.addText("team@yieldnest.io", { x: 0.7, y: 5.3, w: 3, h: 0.3, fontSize: 11, fontFace: "Arial", color: C.muted, margin: 0 });
  }

  // ── Write output ──
  await pres.writeFile({ fileName: "E:\\workspace\\assit\\stablecoin\\yieldnest-pitch-deck.pptx" });
  console.log("Pitch deck created successfully!");
}

run().catch(err => { console.error(err); process.exit(1); });
