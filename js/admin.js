/* ===== 数据管理 - 在浏览器中更新优惠 ===== */

let adminMode = false;
let editingDealIndex = -1;
let tempDeals = [];

// 启用管理面板（长按标题3秒或 ?admin=true）
function enableAdmin() {
  if (adminMode) return;
  adminMode = true;
  // 注入管理按钮
  const nav = document.getElementById('bottomNav');
  const btn = document.createElement('button');
  btn.className = 'nav-item';
  btn.innerHTML = '<span class="nav-icon">⚙️</span><span class="nav-label">管理</span>';
  btn.onclick = showAdmin;
  nav.appendChild(btn);

  // 注入 CSS
  const style = document.createElement('style');
  style.textContent = `
  .admin-page{display:none;flex-direction:column;height:100vh;background:var(--bg);color:var(--text)}
  .admin-page.active{display:flex}
  .admin-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg);z-index:10}
  .admin-header h2{font-size:16px;font-weight:600}
  .admin-close{width:36px;height:36px;border-radius:8px;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer}
  .admin-tabs{display:flex;gap:4px;padding:8px 16px;background:var(--bg);border-bottom:1px solid var(--border)}
  .admin-tab{padding:6px 14px;font-size:12px;border-radius:6px;background:var(--bg2);color:var(--text2);cursor:pointer;transition:all .2s}
  .admin-tab.active{background:var(--accent);color:#fff}
  .admin-scroll{flex:1;overflow-y:auto;padding:12px 16px 100px}
  .admin-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px}
  .admin-card h4{font-size:13px;font-weight:600;margin-bottom:4px}
  .admin-card p{font-size:11px;color:var(--text2);margin-bottom:6px}
  .admin-card .tags{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px}
  .admin-card .tags span{font-size:10px;padding:1px 6px;border-radius:3px;background:var(--bg2)}
  .admin-card-actions{display:flex;gap:6px}
  .admin-card-actions button{padding:4px 10px;font-size:11px;border-radius:4px;cursor:pointer}
  .admin-btn-edit{background:var(--accent-bg);color:var(--accent);border:1px solid rgba(0,212,255,0.2)}
  .admin-btn-del{background:var(--pink-bg);color:var(--pink);border:1px solid rgba(255,107,157,0.2)}
  .admin-btn-add{background:var(--accent);color:#fff;border:none;padding:8px 20px;border-radius:8px;font-size:13px;cursor:pointer;margin-bottom:12px}
  .admin-form{background:var(--surface);border:1px solid var(--accent);border-radius:10px;padding:16px;margin-bottom:12px}
  .admin-form h4{font-size:14px;font-weight:600;margin-bottom:10px;color:var(--accent)}
  .admin-form label{font-size:11px;color:var(--text2);display:block;margin-bottom:2px;margin-top:8px}
  .admin-form input,.admin-form select,.admin-form textarea{width:100%;padding:6px 10px;font-size:13px;border-radius:6px;border:1px solid var(--border);background:var(--bg2);color:var(--text);box-sizing:border-box}
  .admin-form textarea{min-height:50px;resize:vertical;font-family:inherit}
  .admin-form .form-actions{display:flex;gap:8px;margin-top:12px}
  .admin-form .form-actions button{padding:6px 16px;font-size:12px;border-radius:6px;cursor:pointer}
  .admin-form .btn-save{background:var(--green);color:#fff;border:none}
  .admin-form .btn-cancel{background:var(--bg3);color:var(--text2);border:1px solid var(--border)}
  .admin-export-btn{display:block;width:100%;padding:10px;border-radius:8px;background:rgba(0,210,160,0.15);color:var(--green);border:1px solid rgba(0,210,160,0.2);text-align:center;font-size:13px;cursor:pointer;margin-bottom:12px}
  .admin-export-area{width:100%;min-height:200px;font-size:11px;font-family:monospace;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--text);padding:10px;box-sizing:border-box;display:none}
  .admin-info{font-size:11px;color:var(--text3);text-align:center;padding:8px;margin-bottom:8px}
  `;
  document.head.appendChild(style);
}

// 创建管理页面
function showAdmin() {
  let page = document.getElementById('adminPage');
  if (!page) {
    page = document.createElement('div');
    page.id = 'adminPage';
    page.className = 'admin-page';
    document.getElementById('app').appendChild(page);
  }
  renderAdmin();
  // 隐藏其他页面
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-page').forEach(p => p.style.display = 'flex');
  page.classList.add('active');
  page.style.display = 'flex';
}

function renderAdmin() {
  const page = document.getElementById('adminPage');
  tempDeals = JSON.parse(JSON.stringify(deals));

  page.innerHTML = `
    <div class="admin-header">
      <button class="admin-close" onclick="closeAdmin()">✕</button>
      <h2>⚙️ 数据管理</h2>
      <span style="font-size:11px;color:var(--text3)">${platforms.length}平台 · ${deals.length}优惠</span>
    </div>
    <div class="admin-tabs">
      <button class="admin-tab active" onclick="switchAdminTab(this,'deals')">🎯 优惠管理</button>
      <button class="admin-tab" onclick="switchAdminTab(this,'pending')">📩 待审核</button>
      <button class="admin-tab" onclick="switchAdminTab(this,'export')">📤 导出数据</button>
    </div>
    <div class="admin-scroll" id="adminContent"></div>
  `;
  renderDealsTab();
}

function switchAdminTab(el, tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  if (tab === 'deals') renderDealsTab();
  else if (tab === 'pending') renderPendingTab();
  else renderExportTab();
}

// ===== 待审核 =====
function renderPendingTab() {
  const container = document.getElementById('adminContent');
  const pending = JSON.parse(localStorage.getItem('pending-deals') || '[]');

  if (pending.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:40px;margin-bottom:12px">📭</div><p>暂无待审核的优惠</p></div>';
    return;
  }

  let html = `<div class="admin-info">📩 共 ${pending.length} 条待审核</div>`;
  pending.forEach((d, i) => {
    const p = platforms.find(x => x.id === d.platformId);
    html += `<div class="admin-card" style="border-color:var(--orange)">
      <h4>${d.title}</h4>
      <p>${d.desc}</p>
      <p style="font-size:10px;color:var(--text3)">${p ? p.icon+' '+p.name : d.platformId} · ${new Date(d.time).toLocaleString()}</p>
      <div class="admin-card-actions">
        <button class="admin-btn-edit" onclick="approveDeal(${i})">✅ 采纳</button>
        <button class="admin-btn-del" onclick="rejectDeal(${i})">🗑️ 拒绝</button>
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

function approveDeal(idx) {
  const pending = JSON.parse(localStorage.getItem('pending-deals') || '[]');
  const d = pending[idx];
  if (!d) return;
  // 添加到 deals
  deals.push({
    platformId: d.platformId,
    title: d.title,
    desc: d.desc,
    tags: ['new'],
    validUntil: '长期有效',
    url: d.url,
    promoType: 'free'
  });
  pending.splice(idx, 1);
  localStorage.setItem('pending-deals', JSON.stringify(pending));
  renderPendingTab();
  showToast('✅ 已采纳，记得导出部署');
}

function rejectDeal(idx) {
  const pending = JSON.parse(localStorage.getItem('pending-deals') || '[]');
  pending.splice(idx, 1);
  localStorage.setItem('pending-deals', JSON.stringify(pending));
  renderPendingTab();
  showToast('已拒绝');
}

function renderDealsTab() {
  const container = document.getElementById('adminContent');
  editingDealIndex = -1;

  let html = '<div class="admin-info">💡 数据保存在浏览器，修改后点"导出"复制代码替换 data.js</div>';
  html += '<button class="admin-btn-add" onclick="showAddForm()">＋ 添加优惠</button>';

  // 按平台分组
  const grouped = {};
  tempDeals.forEach((d, i) => {
    if (!grouped[d.platformId]) grouped[d.platformId] = [];
    grouped[d.platformId].push({ ...d, _idx: i });
  });

  Object.keys(grouped).forEach(pid => {
    const p = platforms.find(x => x.id === pid);
    if (!p) return;
    html += `<div style="margin-bottom:12px"><h3 style="font-size:14px;font-weight:600;margin-bottom:6px">${p.icon} ${p.name}</h3>`;
    grouped[pid].forEach(d => {
      const tagMap = { free: '免费', time: '限时', new: '最新', hot: '热门' };
      const tags = d.tags.map(t => `<span>${tagMap[t] || t}</span>`).join('');
      html += `
        <div class="admin-card">
          <h4>${d.title}</h4>
          <p>${d.desc}</p>
          <div class="tags">${tags}</div>
          <p style="font-size:10px;color:var(--text3)">📅 ${d.validUntil} · ${d.promoType === 'free' ? '🎁免费' : '💰折扣'}</p>
          <div class="admin-card-actions">
            <button class="admin-btn-edit" onclick="editDeal(${d._idx})">✏️ 编辑</button>
            <button class="admin-btn-del" onclick="deleteDeal(${d._idx})">🗑️ 删除</button>
          </div>
        </div>`;
    });
    html += '</div>';
  });

  container.innerHTML = html;
}

function showAddForm() {
  const container = document.getElementById('adminContent');
  const pOpts = platforms.map(p => `<option value="${p.id}">${p.icon} ${p.name}</option>`).join('');
  const formHtml = `
    <div class="admin-form" id="dealForm">
      <h4>${editingDealIndex >= 0 ? '✏️ 编辑优惠' : '➕ 新增优惠'}</h4>
      <label>所属平台</label>
      <select id="f-platformId">${pOpts}</select>
      <label>优惠标题</label>
      <input id="f-title" placeholder="例：新人GPU实例免费试用3个月" value="">
      <label>优惠描述</label>
      <textarea id="f-desc" placeholder="详细说明优惠内容..."></textarea>
      <label>标签（逗号分隔）</label>
      <input id="f-tags" placeholder="free, time, new, hot" value="free">
      <label>有效期</label>
      <input id="f-valid" placeholder="2025-12-31 或 长期有效" value="长期有效">
      <label>活动链接</label>
      <input id="f-url" placeholder="https://..." value="">
      <label>优惠类型</label>
      <select id="f-type"><option value="free">🎁 免费</option><option value="discount">💰 折扣</option></select>
      <div class="form-actions">
        <button class="btn-save" onclick="saveDeal()">💾 保存</button>
        <button class="btn-cancel" onclick="renderDealsTab()">取消</button>
      </div>
    </div>`;

  // 插入到顶部
  container.innerHTML = formHtml + container.innerHTML;
}

function editDeal(idx) {
  editingDealIndex = idx;
  const d = tempDeals[idx];
  if (!d) return;
  showAddForm();
  setTimeout(() => {
    document.getElementById('f-platformId').value = d.platformId;
    document.getElementById('f-title').value = d.title;
    document.getElementById('f-desc').value = d.desc;
    document.getElementById('f-tags').value = d.tags.join(', ');
    document.getElementById('f-valid').value = d.validUntil;
    document.getElementById('f-url').value = d.url;
    document.getElementById('f-type').value = d.promoType;
  }, 50);
}

function saveDeal() {
  const d = {
    platformId: document.getElementById('f-platformId').value,
    title: document.getElementById('f-title').value.trim(),
    desc: document.getElementById('f-desc').value.trim(),
    tags: document.getElementById('f-tags').value.split(/[,，\s]+/).filter(Boolean),
    validUntil: document.getElementById('f-valid').value.trim(),
    url: document.getElementById('f-url').value.trim(),
    promoType: document.getElementById('f-type').value
  };
  if (!d.title || !d.platformId) { alert('请填写标题和平台'); return; }

  if (editingDealIndex >= 0) {
    tempDeals[editingDealIndex] = d;
  } else {
    tempDeals.push(d);
  }

  // 同步到全局 deals
  deals.length = 0;
  tempDeals.forEach(x => deals.push(x));

  renderDealsTab();
  // 刷新首页和列表
  renderHomeHot();
  if (typeof renderList === 'function') renderList();
}

function deleteDeal(idx) {
  if (!confirm('确定删除这条优惠？')) return;
  tempDeals.splice(idx, 1);
  deals.length = 0;
  tempDeals.forEach(x => deals.push(x));
  renderDealsTab();
  renderHomeHot();
}

function renderExportTab() {
  const container = document.getElementById('adminContent');

  // 生成导出的 JS 代码
  let code = '/* 导出的优惠数据 - 替换 data.js 中的 deals 数组 */\n';
  code += 'const deals = [\n';
  deals.forEach((d, i) => {
    const comma = i < deals.length - 1 ? ',' : '';
    code += `  {\n`;
    code += `    platformId: '${d.platformId}',\n`;
    code += `    title: '${d.title.replace(/'/g, "\\'")}',\n`;
    code += `    desc: '${d.desc.replace(/'/g, "\\'")}',\n`;
    code += `    tags: [${d.tags.map(t => `'${t}'`).join(', ')}],\n`;
    code += `    validUntil: '${d.validUntil}',\n`;
    code += `    url: '${d.url}',\n`;
    code += `    promoType: '${d.promoType}'\n`;
    code += `  }${comma}\n`;
  });
  code += '];\n';

  container.innerHTML = `
    <button class="admin-export-btn" onclick="copyExport()">📋 复制到剪贴板</button>
    <p style="font-size:11px;color:var(--text3);margin-bottom:8px">把下面代码复制 → 替换 pricing-hub/js/data.js 中的 deals 数组 → 重新上传到 OSS</p>
    <textarea class="admin-export-area" id="exportArea" style="display:block" readonly>${code.replace(/`/g, '\\`')}</textarea>
    <div style="margin-top:12px;padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:8px">
      <h4 style="font-size:13px;font-weight:600;margin-bottom:6px">📤 OSS 上传命令</h4>
      <code style="font-size:11px;background:var(--bg2);padding:6px 8px;border-radius:4px;display:block;word-break:break-all">
        ossutil cp js/data.js oss://evengan/js/data.js -f
      </code>
    </div>
  `;
}

function copyExport() {
  const el = document.getElementById('exportArea');
  if (!el) return;
  el.select();
  document.execCommand('copy');
  alert('✅ 已复制到剪贴板！\n粘贴到 data.js 替换 deals 数组即可。');
}

function closeAdmin() {
  document.getElementById('adminPage').style.display = 'none';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-home').classList.add('active');
}

// 检测 URL 参数启用管理
if (window.location.search.includes('admin=true')) {
  document.addEventListener('DOMContentLoaded', () => setTimeout(enableAdmin, 1000));
}

// 长按网站标题3秒启用
document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.home-logo');
  if (logo) {
    let timer;
    logo.addEventListener('touchstart', () => { timer = setTimeout(enableAdmin, 3000); });
    logo.addEventListener('touchend', () => clearTimeout(timer));
    logo.addEventListener('mousedown', () => { timer = setTimeout(enableAdmin, 3000); });
    logo.addEventListener('mouseup', () => clearTimeout(timer));
  }
});
