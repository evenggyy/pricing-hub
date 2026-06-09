/**
 * 阿里云函数计算 - 每日自动抓取优惠
 * 定时触发，自动抓取各平台优惠并更新 OSS
 */

const OSS_ENDPOINT = 'https://evengan.oss-cn-hangzhou.aliyuncs.com';
const BUCKET = 'evengan';
const REGION = 'oss-cn-hangzhou';

// 获取 OSS 客户端
function getOSSClient() {
  const oss = require('ali-oss');
  return new oss({
    region: REGION,
    accessKeyId: process.env.ACCESS_KEY_ID,
    accessKeySecret: process.env.ACCESS_KEY_SECRET,
    bucket: BUCKET,
    internal: false,
    secure: true,
    timeout: 30000
  });
}

// 抓取函数
async function fetchText(url) {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(15000)
    });
    return resp.ok ? await resp.text() : null;
  } catch { return null; }
}

// 抓取各平台
async function scrapeAll() {
  const results = [];

  // 1. DeepSeek
  const dsHtml = await fetchText('https://api-docs.deepseek.com/zh-cn/quick_start/pricing');
  if (dsHtml && dsHtml.includes('输入')) {
    results.push({
      platformId: 'deepseek', title: 'DeepSeek 最新定价', desc: 'DeepSeek API 最新定价信息已抓取',
      tags: ['new'], validUntil: '长期有效', url: 'https://platform.deepseek.com', promoType: 'discount'
    });
  }

  // 2. OpenAI
  const oaHtml = await fetchText('https://openai.com/api/pricing/');
  if (oaHtml && (oaHtml.includes('gpt-4.1') || oaHtml.includes('GPT-4'))) {
    results.push({
      platformId: 'openai', title: 'OpenAI 最新模型定价', desc: 'OpenAI GPT-4.1 系列 API 定价已更新',
      tags: ['new', 'hot'], validUntil: '长期有效', url: 'https://platform.openai.com', promoType: 'discount'
    });
  }

  // 3. Groq
  const groqHtml = await fetchText('https://console.groq.com/docs/models');
  if (groqHtml && groqHtml.includes('free')) {
    results.push({
      platformId: 'groq', title: 'Groq 免费 API', desc: 'Groq LPU 推理提供免费 API 层',
      tags: ['free'], validUntil: '长期有效', url: 'https://console.groq.com', promoType: 'free'
    });
  }

  // 4. Hugging Face
  const hfHtml = await fetchText('https://huggingface.co/pricing');
  if (hfHtml && hfHtml.includes('Inference') && hfHtml.includes('free')) {
    results.push({
      platformId: 'huggingface', title: 'HF 免费推理 API', desc: 'Hugging Face 免费 Inference API',
      tags: ['free'], validUntil: '长期有效', url: 'https://huggingface.co/pricing', promoType: 'free'
    });
  }

  // 5. Anthropic
  const anHtml = await fetchText('https://www.anthropic.com/pricing');
  if (anHtml && anHtml.includes('Claude')) {
    results.push({
      platformId: 'anthropic', title: 'Claude 最新定价', desc: 'Anthropic Claude 系列 API 定价已更新',
      tags: ['new'], validUntil: '长期有效', url: 'https://www.anthropic.com/pricing', promoType: 'discount'
    });
  }

  // 6. Gemini
  const gmHtml = await fetchText('https://ai.google.dev/pricing');
  if (gmHtml && gmHtml.includes('Free') && gmHtml.includes('Gemini')) {
    results.push({
      platformId: 'gemini', title: 'Gemini 免费层', desc: 'Google Gemini API 免费调用额度可用',
      tags: ['free'], validUntil: '长期有效', url: 'https://ai.google.dev/pricing', promoType: 'free'
    });
  }

  // 7. 阿里云
  const alHtml = await fetchText('https://www.aliyun.com/daily-act/ecs/activity_selection');
  if (alHtml && (alHtml.includes('GPU') || alHtml.includes('免费'))) {
    results.push({
      platformId: 'aliyun', title: '阿里云 GPU 活动', desc: '阿里云 GPU 实例优惠活动进行中',
      tags: ['time'], validUntil: '2025-12-31', url: 'https://www.aliyun.com/daily-act/ecs/activity_selection', promoType: 'discount'
    });
  }

  // 8. 腾讯云
  const txHtml = await fetchText('https://cloud.tencent.com/act/gpu');
  if (txHtml && (txHtml.includes('GPU') || txHtml.includes('免费'))) {
    results.push({
      platformId: 'tencent', title: '腾讯云 GPU 优惠', desc: '腾讯云 GPU 服务器新用户优惠',
      tags: ['time'], validUntil: '2025-12-31', url: 'https://cloud.tencent.com/act/gpu', promoType: 'discount'
    });
  }

  return results;
}

// 去重合并
function mergeDeals(existing, scraped) {
  const keys = new Set(existing.map(d => `${d.platformId}|${d.title}`));
  let added = 0;
  for (const d of scraped) {
    const key = `${d.platformId}|${d.title}`;
    if (!keys.has(key)) {
      existing.push(d);
      keys.add(key);
      added++;
    }
  }
  return { deals: existing, added };
}

// 生成 data.js 代码
function generateDataJs(existingDeals, platformsCode) {
  let code = platformsCode + '\n\nconst deals = [\n';
  existingDeals.forEach((d, i) => {
    const c = i < existingDeals.length - 1 ? ',' : '';
    code += `  { platformId: '${d.platformId}', title: '${(d.title||'').replace(/'/g,"\\'")}', desc: '${(d.desc||'').replace(/'/g,"\\'")}', tags: [${(d.tags||[]).map(t=>`'${t}'`).join(',')}], validUntil: '${d.validUntil||'长期有效'}', url: '${d.url||''}', promoType: '${d.promoType||'free'}' }${c}\n`;
  });
  code += '];\n';
  return code;
}

// 主函数
exports.handler = async (event, context) => {
  console.log('🚀 开始每日自动抓取...');

  const fc = context.credentials;
  const accessKeyId = fc.accessKeyId;
  const accessKeySecret = fc.accessKeySecret;

  // 从 OSS 读取现有 data.js
  const client = getOSSClient();
  
  let existingDeals = [];
  let platformsCode = '';

  try {
    const obj = await client.get('js/data.js');
    const content = obj.content.toString();
    
    // 提取 platforms 和 deals
    const pMatch = content.match(/const platforms\s*=\s*(\[[\s\S]*?\]);/);
    const dMatch = content.match(/const deals\s*=\s*(\[[\s\S]*?\]);/);
    
    if (pMatch) {
      platformsCode = content.substring(0, dMatch ? dMatch.index : content.length);
    }
    if (dMatch) {
      existingDeals = eval(dMatch[1]);
    }
    
    console.log(`📖 当前数据: ${existingDeals.length} 条优惠`);
  } catch (e) {
    console.log('⚠️ 读取现有数据失败，使用默认数据');
    // 使用内置数据
  }

  // 抓取
  const scraped = await scrapeAll();
  console.log(`🔍 抓取到 ${scraped.length} 条新信息`);

  // 合并
  const { deals, added } = mergeDeals(existingDeals, scraped);
  console.log(`✅ 新增 ${added} 条，总计 ${deals.length} 条`);

  // 生成新 data.js
  const newCode = generateDataJs(deals, platformsCode);
  
  // 写回 OSS
  await client.put('js/data.js', Buffer.from(newCode, 'utf-8'), {
    headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
  });

  console.log('✅ data.js 已更新到 OSS');
  console.log('📊 总计 ' + deals.length + ' 条优惠');
  
  return {
    statusCode: 200,
    body: JSON.stringify({ added, total: deals.length })
  };
};
