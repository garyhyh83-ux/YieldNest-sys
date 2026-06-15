const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const inputFile = process.argv[2] || "YieldNest-企业业务说明书.md";
const outputFile = inputFile.replace(/\.md$/, "-v2.pdf");

const md = fs.readFileSync(path.resolve(inputFile), "utf-8");

// ── Simple Markdown to HTML converter ──
function mdToHtml(md) {
  let html = md;

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`);

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold (**text**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Tables — wrap lines between | chars
  html = html.replace(/((?:^\|.+\|$\n?)+)/gm, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length < 2) return match;
    // Skip separator line (|---|---|)
    const dataLines = lines.filter(l => !/^\|[\s\-:|]+\|$/.test(l));
    if (dataLines.length === 0) return match;

    let table = '<table>';
    dataLines.forEach((line, i) => {
      const tag = i === 0 ? 'th' : 'td';
      const cells = line.split('|').filter(c => c.trim() !== '');
      table += '<tr>';
      cells.forEach(cell => {
        table += `<${tag}>${cell.trim()}</${tag}>`;
      });
      table += '</tr>';
    });
    table += '</table>';
    return table;
  });

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

  // Unordered lists
  html = html.replace(/((?:^- .+$\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(l => l.replace(/^- /, ''));
    return '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
  });

  // Ordered lists (1. 2. 3.)
  html = html.replace(/((?:^\d+\. .+$\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(l => l.replace(/^\d+\. /, ''));
    return '<ol>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
  });

  // Paragraphs — wrap non-tag lines in <p>
  const lines = html.split('\n');
  const result = [];
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed === '') {
      result.push('');
      continue;
    }

    // Already an HTML tag
    if (/^<\/?(h[1-4]|table|tr|t[dh]|ul|ol|li|pre|hr|blockquote|div|code|p|strong|thead|tbody)/.test(trimmed)) {
      result.push(line);
      continue;
    }

    // Wrap in paragraph
    result.push(`<p>${trimmed}</p>`);
  }

  return result.join('\n');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const bodyHtml = mdToHtml(md);

const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>YieldNest 企业业务说明书</title>
<style>
  @page {
    size: A4;
    margin: 22mm 18mm 22mm 18mm;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --primary: #1a56db;
    --primary-light: #e8f0fe;
    --gold: #b45309;
    --gold-light: #fffbeb;
    --text: #1e293b;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --surface: #f8fafc;
    --accent-green: #059669;
    --accent-green-bg: #ecfdf5;
    --accent-red: #dc2626;
    --accent-red-bg: #fef2f2;
  }

  body {
    font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Helvetica Neue", sans-serif;
    font-size: 10.5pt;
    line-height: 1.8;
    color: var(--text);
  }

  /* ── Cover ── */
  .cover {
    text-align: center;
    padding: 140px 0 80px;
    page-break-after: always;
    position: relative;
  }
  .cover::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, #1a56db, #3b82f6, #60a5fa);
  }
  .cover .logo {
    width: 64px; height: 64px;
    margin: 0 auto 28px;
    background: linear-gradient(135deg, #1a56db, #3b82f6);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 22pt; font-weight: 800;
    letter-spacing: 1px;
  }
  .cover h1 {
    font-size: 28pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    border: none;
    margin: 0 0 8px;
    padding: 0;
  }
  .cover .subtitle {
    font-size: 15pt;
    color: var(--primary);
    font-weight: 500;
    margin-bottom: 40px;
  }
  .cover .meta {
    font-size: 9.5pt;
    color: var(--text-muted);
    line-height: 2.2;
  }
  .cover .meta span {
    display: inline-block;
    padding: 2px 12px;
    border: 1px solid var(--border);
    border-radius: 20px;
    margin: 0 4px;
    background: var(--surface);
  }

  /* ── TOC ── */
  .toc {
    page-break-after: always;
    padding-top: 20px;
  }
  .toc h2 {
    font-size: 18pt;
    color: #0f172a;
    border: none;
    margin-bottom: 28px;
  }
  .toc-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 24px;
  }
  .toc-item {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 6px;
    border-bottom: 1px dotted var(--border);
  }
  .toc-num {
    font-size: 10pt;
    font-weight: 700;
    color: var(--primary);
    min-width: 24px;
  }
  .toc-title {
    font-size: 10.5pt;
    color: var(--text);
  }

  /* ── Headings ── */
  h1 {
    font-size: 20pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 3px solid var(--primary);
    padding-bottom: 8px;
    margin: 0 0 18px;
  }
  h2 {
    font-size: 15pt;
    font-weight: 700;
    color: #1e293b;
    padding: 10px 0 8px;
    margin: 36px 0 16px;
    border-bottom: 1.5px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  h2::before {
    content: "";
    width: 3px; height: 18px;
    background: var(--primary);
    border-radius: 2px;
    display: inline-block;
  }
  h3 {
    font-size: 12.5pt;
    font-weight: 600;
    color: #334155;
    margin: 26px 0 12px;
  }
  h4 {
    font-size: 11pt;
    font-weight: 600;
    color: #475569;
    margin: 18px 0 8px;
  }

  p { margin: 8px 0; }

  strong { color: #0f172a; }

  /* ── Blockquote ── */
  blockquote {
    margin: 14px 0;
    padding: 14px 20px;
    border-left: 4px solid var(--primary);
    background: var(--primary-light);
    color: #1e40af;
    font-size: 10pt;
    border-radius: 0 8px 8px 0;
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 16px 0;
    font-size: 9.5pt;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  thead { display: table-header-group; }
  th {
    background: #eef2ff;
    color: #1e3a8a;
    padding: 10px 12px;
    text-align: left;
    font-weight: 700;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #c7d2fe;
  }
  td {
    padding: 9px 12px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
  }
  tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) td { background: #fafbfd; }
  tbody tr:hover td { background: #f0f4ff; }

  /* ── Code ── */
  .code-block {
    background: #f8fafc;
    color: #334155;
    padding: 14px 18px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: "Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace;
    font-size: 8.5pt;
    line-height: 1.6;
    white-space: pre-wrap;
    border-left: 3px solid var(--primary);
  }
  .inline-code {
    background: #f1f5f9;
    color: #b45309;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "Cascadia Code", "Fira Code", Consolas, monospace;
    font-size: 9pt;
    border: 1px solid #e2e8f0;
  }

  /* ── Lists ── */
  ul, ol { margin: 8px 0; padding-left: 22px; }
  li { margin: 4px 0; padding-left: 2px; }
  ul li::marker { color: var(--primary); }

  hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 28px 0;
  }

  /* ── Layout ── */
  h2 { page-break-before: always; }
  h2:first-of-type { page-break-before: avoid; }
  table, pre, blockquote { page-break-inside: avoid; }
  h2, h3, h4 { page-break-after: avoid; }

  /* ── Flow Timeline (Section 4) ── */
  .flow-timeline { margin: 20px 0; }
  .flow-phase {
    margin: 20px 0 28px;
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  .phase-badge {
    padding: 10px 18px;
    font-size: 10.5pt;
    font-weight: 700;
    letter-spacing: 0.3px;
  }
  .phase-onboard {
    background: #eef2ff;
    color: #1e3a8a;
    border-bottom: 1px solid #c7d2fe;
  }
  .phase-daily {
    background: #ecfdf5;
    color: #065f46;
    border-bottom: 1px solid #a7f3d0;
  }
  .flow-phase table {
    border: none; border-radius: 0; margin: 0;
  }
  .flow-phase table th { display: none; }
  .flow-phase table td { padding: 10px 16px; }

  /* Flow Steps */
  .flow-steps {
    margin: 18px 0;
  }
  .flow-step {
    display: flex;
    gap: 14px;
    margin: 12px 0;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    align-items: flex-start;
  }
  .step-num {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    background: var(--primary);
    color: #fff;
    border-radius: 8px;
    font-size: 10pt;
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .step-body { flex: 1; }
  .step-body strong {
    display: block;
    font-size: 11pt;
    color: #0f172a;
    margin-bottom: 3px;
  }
  .step-body p {
    margin: 2px 0 0;
    font-size: 10pt;
    color: #475569;
    line-height: 1.65;
  }

  /* Demo Walkthrough Table */
  .demo-walkthrough {
    margin: 18px 0;
  }
  .demo-walkthrough table th {
    background: #f0f9ff;
    color: #0369a1;
    font-size: 9pt;
    border-bottom: 2px solid #bae6fd;
  }
  .demo-walkthrough table td:first-child {
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;
    width: 15%;
  }
  .demo-walkthrough table td:nth-child(2) {
    font-weight: 600;
    color: #334155;
    width: 30%;
  }
  .demo-walkthrough table td:last-child {
    color: #64748b;
    font-size: 9.5pt;
  }

  /* ── Strategy Cards (Section 5) ── */
  .strategy-cards {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;
    margin: 18px 0;
  }
  .strategy-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
  }
  .strategy-card .strat-name {
    font-weight: 700;
    font-size: 11pt;
    color: #0f172a;
    margin-bottom: 6px;
  }
  .strategy-card .strat-meta {
    font-size: 9pt;
    color: var(--text-muted);
    line-height: 1.7;
  }
  .strategy-card .strat-apy {
    font-size: 16pt;
    font-weight: 800;
    color: var(--primary);
    margin: 8px 0 2px;
  }
  .strat-risk {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 8pt;
    font-weight: 600;
    margin-top: 6px;
  }
  .risk-vlow { background: #ecfdf5; color: #065f46; }
  .risk-low { background: #f0fdf4; color: #166534; }
  .risk-med { background: #fffbeb; color: #92400e; }

  /* ── Info cards ── */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 12px;
    margin: 18px 0;
  }
  .info-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    text-align: center;
  }
  .info-card .val {
    font-size: 18pt;
    font-weight: 800;
    color: var(--primary);
  }
  .info-card .lbl {
    font-size: 8pt;
    color: var(--text-muted);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ── Section number badge ── */
  .section-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px; height: 28px;
    background: var(--primary);
    color: #fff;
    border-radius: 8px;
    font-size: 10pt;
    font-weight: 700;
    margin-right: 8px;
  }
</style>
</head>
<body>

<div class="cover">
  <div class="logo">YN</div>
  <h1>YieldNest</h1>
  <div class="subtitle">企业业务说明书</div>
  <div class="meta">
    <span>版本 v1.0</span>
    <span>2026-05-27</span>
    <span>商业机密</span>
    <br><br>
    仅供授权人员阅读
  </div>
</div>

<div class="toc">
  <h2>目录</h2>
  <div class="toc-grid">
    <div class="toc-item"><span class="toc-num">01</span><span class="toc-title">执行摘要</span></div>
    <div class="toc-item"><span class="toc-num">02</span><span class="toc-title">产品定位与价值主张</span></div>
    <div class="toc-item"><span class="toc-num">03</span><span class="toc-title">核心业务功能</span></div>
    <div class="toc-item"><span class="toc-num">04</span><span class="toc-title">操作流程详解</span></div>
    <div class="toc-item"><span class="toc-num">05</span><span class="toc-title">收益策略与模式</span></div>
    <div class="toc-item"><span class="toc-num">06</span><span class="toc-title">风险管理与安全保障</span></div>
    <div class="toc-item"><span class="toc-num">07</span><span class="toc-title">商业效益分析</span></div>
    <div class="toc-item"><span class="toc-num">08</span><span class="toc-title">竞争格局与对标分析</span></div>
    <div class="toc-item"><span class="toc-num">09</span><span class="toc-title">目标客户与市场策略</span></div>
    <div class="toc-item"><span class="toc-num">10</span><span class="toc-title">发展路线图</span></div>
    <div class="toc-item"><span class="toc-num">11</span><span class="toc-title">附录：术语与常见问题</span></div>
  </div>
</div>

${bodyHtml}

</body>
</html>`;

// ── Generate PDF via Puppeteer ──
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: "networkidle0" });
  await page.pdf({
    path: path.resolve(outputFile),
    format: "A4",
    margin: { top: "25mm", bottom: "25mm", left: "20mm", right: "20mm" },
    displayHeaderFooter: false,
    printBackground: true,
  });
  await browser.close();

  console.log(`PDF created: ${outputFile}`);
  console.log(`Size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);
})();
