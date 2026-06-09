/**
 * ===== 算力优惠自动抓取脚本 =====
 * 
 * 自动从各平台官网抓取最新优惠信息
 * 用法: node scraper.js
 * 
 * 抓取来源:
 *   - 各平台公开价格页面
 *   - Hugging Face 空间
 *   - 已知的免费/优惠活动页
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// ===== 配置 =====
const timeout = 15000;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// ===== 现有数据 =====
const DATA_PATH = path.join(__dirname, 'pricing-hub', 'js', 'data.js');

// ===== 工具函数 =====
async function fetch(url) {
  try {
    const resp = await globalThis.fetch(url, {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(timeout)
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch { return null; }
}

function extractDeals(text, patterns) {
  const results = [];
  for (const p of patterns) {
    const match = text.match(p.regex);
    if (match && match[1]) {
      results.push({
        platformId: p.platformId,
        title: p.title,
        desc: `${match[1].trim().slice(0, 200)}`,
        tags: p.tags || ['free'],
        validUntil: p.validUntil || '长期有效',
        url: p.url,
        promoType: p.promoType || 'free'
      });
    }
  }
  return results;
}

// ===== 各平台抓取器 =====

// 1. DeepSeek
async function scrapeDeepSeek() {
  const html = await fetch('https://api-docs.deepseek.com/zh-cn/quick_start/pricing');
  if (!html) return [];
  const $ = cheerio.load(html);
  const text = $('body').text();
  return extractDeals(text, [
    {
      platformId: 'deepseek',
      title: 'DeepSeek API 最新定价',
      regex: /输入[：:]\s*([^。]*?)\d+[元块]/,
      tags: ['new'],
      url: 'https://platform.deepseek.com',
      promoType: 'discount'
    }
  ]);
}

// 2. OpenAI
async function scrapeOpenAI() {
  const html = await fetch('https://openai.com/api/pricing/');
  if (!html) return [];
  const $ = cheerio.load(html);
  const text = $('body').text();
  const deals = [];
  if (text.includes('gpt-4.1-nano') || text.includes('GPT-4.1')) {
    deals.push({
      platformId: 'openai',
      title: 'GPT-4.1 系列已发布',
      desc: 'OpenAI 最新 GPT-4.1 系列包括 GPT-4.1、GPT-4.1-mini、GPT-4.1-nano',
      tags: ['new', 'hot'],
      validUntil: '长期有效',
      url: 'https://platform.openai.com',
      promoType: 'discount'
    });
  }
  return deals;
}

// 3. Groq
async function scrapeGroq() {
  const html = await fetch('https://console.groq.com/docs/models');
  if (!html) return [];
  const $ = cheerio.load(html);
  const text = $('body').text();
  const deals = [];
  if (text.includes('free') && (text.includes('mixtral') || text.includes('llama'))) {
    deals.push({
      platformId: 'groq',
      title: 'Groq 免费 API 持续可用',
      desc: 'Groq LPU 推理引擎提供多个开源模型的免费 API 层',
      tags: ['free'],
      validUntil: '长期有效',
      url: 'https://console.groq.com',
      promoType: 'free'
    });
  }
  return deals;
}

// 4. Hugging Face
async function scrapeHuggingFace() {
  const html = await fetch('https://huggingface.co/pricing');
  if (!html) return [];
  const $ = cheerio.load(html);
  const text = $('body').text();
  if (text.includes('Inference') && text.includes('free')) {
    return [{
      platformId: 'huggingface',
      title: 'Hugging Face 免费 Inference API',
      desc: 'Hugging Face 提供免费 Inference API 额度，支持大量开源模型',
      tags: ['free'],
      validUntil: '长期有效',
      url: 'https://huggingface.co/pricing',
      promoType: 'free'
    }];
  }
  return [];
}

// 5. Anthropic
async function scrapeAnthropic() {
  const html = await fetch('https://www.anthropic.com/pricing');
  if (!html) return [];
  const $ = cheerio.load(html);
  const text = $('body').text();
  if (text.includes('Claude') && text.includes('Sonnet')) {
    return [{
      platformId: 'anthropic',
      title: 'Claude 最新定价',
      desc: 'Anthropic Claude 系列最新定价信息已更新',
      tags: ['new'],
      validUntil: '长期有效',
      url: 'https://www.anthropic.com/pricing',
      promoType: 'discount'
    }];
  }
  return [];
}

// 6. Google Gemini
async function scrapeGemini() {
  const html = await fetch('https://ai.google.dev/pricing');
  if (!html) return [];
  const $ = cheerio.load(html);
  const text = $('body').text();
  if (text.includes('Free') && text.includes('Gemini')) {
    return [{
      platformId: 'gemini',
      title: 'Gemini API 免费层',
      desc: 'Google Gemini API 提供免费调用额度，Gemini 2.0 Flash 完全免费',
      tags: ['free'],
      validUntil: '长期有效',
      url: 'https://ai.google.dev/pricing',
      promoType: 'free'
    }];
  }
  return [];
}

// 7. 阿里云活动页
async function scrapeAliyun() {
  const html = await fetch('https://www.aliyun.com/daily-act/ecs/activity_selection');
  if (!html) return [];
  const $ = cheerio.load(html);
  const text = $('body').text();
  const deals = [];
  if (text.includes('GPU') || text.includes('免费') || text.includes('试用')) {
    deals.push({
      platformId: 'aliyun',
      title: '阿里云 GPU 实例活动进行中',
      desc: '阿里云 GPU 云服务器新用户优惠活动持续进行',
      tags: ['time'],
      validUntil: '2025-12-31',
      url: 'https://www.aliyun.com/daily-act/ecs/activity_selection',
      promoType: 'discount'
    });
  }
  return deals;
}

// 8. 腾讯云活动页
async function scrapeTencent() {
  const html = await fetch('https://cloud.tencent.com/act/gpu');
  if (!html) return [];
  const $ = cheerio.load(html);
  const text = $('body').text();
  if (text.includes('GPU') || text.includes('免费') || text.includes('试用')) {
    return [{
      platformId: 'tencent',
      title: '腾讯云 GPU 服务器优惠',
      desc: '腾讯云 GPU 云服务器新用户专享优惠活动中',
      tags: ['time'],
      validUntil: '2025-12-31',
      url: 'https://cloud.tencent.com/act/gpu',
      promoType: 'discount'
    }];
  }
  return [];
}

// 9. 百度云活动
async function scrapeBaidu() {
  const html = await fetch('https://cloud.baidu.com/product/gpu.html');
  if (!html) return [];
  const $ = cheerio.load(html);
  const text = $('body').text();
  if (text.includes('免费') || text.includes('试用') || text.includes('GPU')) {
    return [{
      platformId: 'baidu',
      title: '百度智能云 GPU 产品最新活动',
      desc: '百度智能云 GPU 云服务器及 AI 算力平台优惠进行中',
      tags: ['time'],
      validUntil: '2025-12-31',
      url: 'https://cloud.baidu.com/product/gpu.html',
      promoType: 'discount'
    }];
  }
  return [];
}

// ===== 通用关键词抓取 =====
async function scrapeByKeywords() {
  const deals = [];
  const sources = [
    { platformId: 'lambdalabs', url: 'https://lambdalabs.com/service/gpu-cloud', name: 'Lambda Labs' },
    { platformId: 'vastai', url: 'https://vast.ai/pricing', name: 'Vast.ai' },
    { platformId: 'runpod', url: 'https://www.runpod.io/pricing', name: 'RunPod' },
    { platformId: 'paperspace', url: 'https://www.paperspace.com/pricing', name: 'Paperspace' },
  ];

  for (const src of sources) {
    const html = await fetch(src.url);
    if (!html) continue;
    const $ = cheerio.load(html);
    const text = $('body').text().toLowerCase();
    if (text.includes('free') || text.includes('credit') || text.includes('trial') || text.includes('coupon')) {
      deals.push({
        platformId: src.platformId,
        title: `${src.name} 优惠活动进行中`,
        desc: `${src.name} 当前有免费额度/试用活动，请访问官网查看详情`,
        tags: ['free'],
        validUntil: '长期有效',
        url: src.url,
        promoType: 'free'
      });
    }
  }
  return deals;
}

// ===== 主程序 =====
async function main() {
  console.log('🤖 开始自动抓取各平台优惠信息...\n');

  const scrapers = [
    ['DeepSeek', scrapeDeepSeek],
    ['OpenAI', scrapeOpenAI],
    ['Groq', scrapeGroq],
    ['HuggingFace', scrapeHuggingFace],
    ['Anthropic', scrapeAnthropic],
    ['Gemini', scrapeGemini],
    ['阿里云', scrapeAliyun],
    ['腾讯云', scrapeTencent],
    ['百度云', scrapeBaidu],
    ['通用关键词', scrapeByKeywords],
  ];

  const allNewDeals = [];
  for (const [name, scraper] of scrapers) {
    process.stdout.write(`  ⏳ ${name}... `);
    try {
      const deals = await scraper();
      if (deals.length > 0) {
        allNewDeals.push(...deals);
        console.log(`✅ 发现 ${deals.length} 条`);
      } else {
        console.log('⏭️  无新数据');
      }
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }
  }

  console.log(`\n📊 抓取完成，共发现 ${allNewDeals.length} 条新优惠信息`);

  // 保存结果
  if (allNewDeals.length > 0) {
    const outputPath = path.join(__dirname, 'scraped-deals.json');
    fs.writeFileSync(outputPath, JSON.stringify(allNewDeals, null, 2));
    console.log(`💾 已保存到 ${outputPath}\n`);

    // 打印结果
    allNewDeals.forEach(d => {
      console.log(`  [${d.platformId}] ${d.title}`);
      console.log(`    ${d.desc.slice(0, 80)}`);
      console.log(`    ${d.url}`);
      console.log('');
    });

    console.log('📤 要合并到 data.js 请运行:');
    console.log('    node merge-scraped.js');
  }

  console.log('✅ 抓取完毕');
}

main().catch(e => console.error('❌ 脚本出错:', e));
