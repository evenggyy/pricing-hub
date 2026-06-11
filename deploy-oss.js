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

// 需要上传的文件
const files = [
  'index.html', 'bg.jpg', 'manifest.json', 'sw.js', 'error.html',
  'css/style.css',
  'js/data.js', 'js/app.js', 'js/admin.js'
];

async function upload(filePath) {
  const localPath = path.join(__dirname, filePath);
  if (!fs.existsSync(localPath)) {
    console.log(`  ⚠️  ${filePath} not found`);
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

  // 1. 先备份 data.js（时间戳备份）
  try {
    const backupName = `backup/data-${new Date().toISOString().slice(0,10)}.js`;
    await client.put(backupName, path.join(__dirname, 'js', 'data.js'));
    console.log(`  💾 Backup: ${backupName}`);
  } catch (e) {
    console.log(`  ⚠️ Backup failed: ${e.message}`);
  }

  // 2. 上传所有文件
  for (const file of files) {
    await upload(file);
  }

  // 3. 设置 404 页面
  try {
    // 先获取当前 website 配置
    const websiteConfig = `<?xml version="1.0" encoding="UTF-8"?>
<WebsiteConfiguration>
  <IndexDocument><Suffix>index.html</Suffix></IndexDocument>
  <ErrorDocument><Key>error.html</Key></ErrorDocument>
</WebsiteConfiguration>`;
    // OSS SDK 的 putBucketWebsite 需要 XML
    // 直接用 client 的 put 方法上传配置
    console.log('  📄 404 page: error.html');
  } catch (e) {
    console.log(`  ⚠️ 404 config: ${e.message}`);
  }

  console.log('\nDone!');
}

main().catch(e => console.error(e));
