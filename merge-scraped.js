const fs = require('fs');
const content = fs.readFileSync('pricing-hub/js/data.js', 'utf-8');

// 找到 platforms 的结尾：第一个 ]; 
// 但后面的评论里有 '];' 字符串
// 安全方法：按行扫描
const lines = content.split('\n');
let platformEnd = -1;
let dealsStart = -1;
let dealsEnd = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line === '];' && platformEnd === -1 && dealsStart === -1) {
    // This is the end of platforms array (first standalone ];)
    platformEnd = i;
  }
  if (line.startsWith('const deals = [')) {
    dealsStart = i;
  }
  if (line === '];' && dealsStart > -1 && dealsEnd === -1 && i > dealsStart) {
    dealsEnd = i;
  }
}

// 重建
let platformsCode = '';
if (platformEnd > -1) {
  platformsCode = lines.slice(0, platformEnd + 1).join('\n');
}

// 解析现有deals
let existingDeals = [];
if (dealsStart > -1 && dealsEnd > -1) {
  const dealLines = lines.slice(dealsStart + 1, dealsEnd);
  let current = '';
  for (const line of dealLines) {
    current += line;
  }
  // 每条deal用 }, 分割
  const blocks = current.split('},');
  for (const block of blocks) {
    const pid = block.match(/platformId:\s*'([^']+)'/);
    const title = block.match(/title:\s*'([^']+)'/);
    if (pid && title) {
      existingDeals.push({ platformId: pid[1], title: title[1] });
    }
  }
}

console.log('Found ' + existingDeals.length + ' existing deals');

// 读取抓取
const scraped = JSON.parse(fs.readFileSync('scraped-deals.json', 'utf-8'));
console.log('Scraped ' + scraped.length + ' deals');

// 去重
const keys = new Set(existingDeals.map(d => d.platformId + '|' + d.title));
const toAdd = scraped.filter(d => !keys.has(d.platformId + '|' + d.title));
console.log('New to add: ' + toAdd.length);

// 生成
let output = platformsCode + '\n\nconst deals = [\n';

// 先写现有优惠
for (let i = 0; i < existingDeals.length; i++) {
  output += lines[dealsStart + 1 + i] + '\n';
}

// 再写新抓取的
const lastExistingLine = lines[dealsEnd - 1];
const hasComma = lastExistingLine.trim().endsWith(',');
for (let i = 0; i < toAdd.length; i++) {
  const d = toAdd[i];
  const comma = (i < toAdd.length - 1 || existingDeals.length > 0) ? ',' : '';
  const safe = s => (s || '').replace(/'/g, "\\'");
  output += `  { platformId: '${d.platformId}', title: '${safe(d.title)}', desc: '${safe(d.desc)}', tags: [${(d.tags||[]).map(t => "'" + t + "'").join(',')}], validUntil: '${d.validUntil || '长期有效'}', url: '${d.url || ''}', promoType: '${d.promoType || 'free'}' }${comma}\n`;
}

output += '];\n';

fs.writeFileSync('pricing-hub/js/data.js', output, 'utf-8');
console.log('Total: ' + existingDeals.length + ' existing + ' + toAdd.length + ' new = ' + (existingDeals.length + toAdd.length));
