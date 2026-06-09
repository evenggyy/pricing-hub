/**
 * 每日自动更新脚本
 * 支持本地运行(ossutil)和 GitHub Actions(ali-oss SDK)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_PATH = path.join(__dirname, 'pricing-hub', 'js', 'data.js');

// 判断环境
const isCI = process.env.CI === 'true' || process.env.ACCESS_KEY_ID;

async function fetchText(url) {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000)
    });
    return resp.ok ? await resp.text() : null;
  } catch { return null; }
}

async function scrape() {
  const results = [];
  const checks = [
    ['DeepSeek', 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing', 'deepseek', 'DeepSeek 最新定价'],
    ['Anthropic', 'https://www.anthropic.com/pricing', 'anthropic', 'Claude 最新定价'],
    ['Groq', 'https://console.groq.com/docs/models', 'groq', 'Groq 免费 API'],
    ['Gemini', 'https://ai.google.dev/pricing', 'gemini', 'Gemini 免费层'],
    ['阿里云', 'https://www.aliyun.com/daily-act/ecs/activity_selection', 'aliyun', '阿里云 GPU 活动'],
    ['腾讯云', 'https://cloud.tencent.com/act/gpu', 'tencent', '腾讯云 GPU 优惠'],
  ];
  for (const [name, url, pid, title] of checks) {
    process.stdout.write(`  ${name}... `);
    const html = await fetchText(url);
    if (html && (html.includes('free') || html.includes('免费') || html.includes('GPU') || html.includes('pricing'))) {
      results.push({ platformId: pid, title, desc: `${name} 最新优惠信息已更新`, tags: ['new'], validUntil: '长期有效', url, promoType: 'discount' });
      console.log('found');
    } else {
      console.log('skip');
    }
  }
  return results;
}

async function uploadToOSS(filePath) {
  if (isCI) {
    // GitHub Actions 模式：用 ali-oss SDK
    const OSS = require('ali-oss');
    const client = new OSS({
      region: 'oss-cn-hangzhou',
      accessKeyId: process.env.ACCESS_KEY_ID,
      accessKeySecret: process.env.ACCESS_KEY_SECRET,
      bucket: 'evengan',
      secure: true
    });
    await client.put('js/data.js', filePath);
    console.log('Upload OK (ali-oss)');
  } else {
    // 本地模式：用 ossutil
    const ossutil = path.join(process.env.USERPROFILE, 'Downloads', 'ossutil', 'ossutil.exe');
    if (fs.existsSync(ossutil)) {
      execSync(`"${ossutil}" cp "${filePath}" oss://evengan/js/data.js -f`, { stdio: 'inherit' });
      console.log('Upload OK (ossutil)');
    } else {
      console.log('ossutil not found, skip upload');
    }
  }
}

async function main() {
  console.log('=== Daily Update ===');
  console.log(new Date().toISOString());

  if (!fs.existsSync(DATA_PATH)) {
    console.log('data.js not found, skip');
    return;
  }

  const content = fs.readFileSync(DATA_PATH, 'utf-8');
  const pEnd = content.indexOf('];');
  const pCode = content.substring(0, pEnd + 2);

  // 解析现有 deals
  let existingEnd = -1;
  const dStart = content.indexOf('const deals = [');
  if (dStart > -1) {
    let open = 1;
    for (let i = dStart + 15; i < content.length; i++) {
      if (content[i] === '[') open++;
      if (content[i] === ']') open--;
      if (open === 0) { existingEnd = i; break; }
    }
  }

  const existingSection = existingEnd > -1 ? content.substring(dStart, existingEnd + 1) : '';
  const existingDeals = existingSection ? (existingSection.match(/title:\s*'([^']+)'/g) || []).length : 0;
  console.log(`Existing: ${existingDeals} deals`);

  const scraped = await scrape();
  const existingTitles = new Set();
  if (existingSection) {
    const matches = existingSection.match(/title:\s*'([^']+)'/g);
    if (matches) matches.forEach(m => existingTitles.add(m.replace(/title:\s*'|'/g, '')));
  }

  const toAdd = scraped.filter(d => !existingTitles.has(d.title));
  console.log(`To add: ${toAdd.length}`);

  // 生成新 data.js
  let newContent = pCode + '\n\nconst deals = [\n';
  if (existingSection) {
    const body = existingSection.replace('const deals = [', '').replace(/\]\s*;?\s*$/, '').trim();
    if (body) newContent += body + ',\n';
  }
  for (const d of toAdd) {
    const safe = s => (s || '').replace(/'/g, "\\'");
    newContent += `  { platformId: '${d.platformId}', title: '${safe(d.title)}', desc: '${safe(d.desc)}', tags: [${(d.tags||[]).map(t => "'" + t + "'").join(',')}], validUntil: '${d.validUntil}', url: '${d.url}', promoType: '${d.promoType}' },\n`;
  }
  newContent += '];\n';
  fs.writeFileSync(DATA_PATH, newContent, 'utf-8');

  // 上传 OSS
  await uploadToOSS(DATA_PATH);
  console.log('=== Done ===');
}

main().catch(e => console.error(e));
