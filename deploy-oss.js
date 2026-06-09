/**
 * 部署所有文件到阿里云 OSS
 * 用于 GitHub Actions
 * node deploy-oss.js
 */
const path = require('path');
const fs = require('fs');

const OSS = require('ali-oss');
const client = new OSS({
  region: 'oss-cn-hangzhou',
  accessKeyId: process.env.ACCESS_KEY_ID,
  accessKeySecret: process.env.ACCESS_KEY_SECRET,
  bucket: 'evengan',
  secure: true,
  timeout: 60000
});

// 需要上传的文件（相对于项目根目录）
const files = [
  'index.html',
  'bg.jpg',
  'manifest.json',
  'sw.js',
  'css/style.css',
  'js/data.js',
  'js/app.js',
  'js/admin.js'
];

async function upload(filePath) {
  const localPath = path.join(__dirname, filePath);
  if (!fs.existsSync(localPath)) {
    console.log(`  ⚠️  ${filePath} not found, skip`);
    return;
  }
  try {
    await client.put(filePath, localPath);
    console.log(`  ✅ ${filePath}`);
  } catch (e) {
    console.log(`  ❌ ${filePath}: ${e.message}`);
  }
}

async function main() {
  console.log('Deploying to OSS...\n');
  for (const file of files) {
    await upload(file);
  }
  console.log('\nDone!');
}

main().catch(e => console.error(e));
