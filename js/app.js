/* ===== 算力优惠聚合 - 应用逻辑 ===== */

let currentListCategory = 'compute';
let currentFilter = 'all';
let currentPlatformId = null;
let isDark = true;
let pageHistory = ['page-home'];

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  isDark = localStorage.getItem('pricing-theme') !== 'light';
  applyTheme();
  updateHomeCounts();
  renderQuickPlatforms();
  renderHomeHot();
  updateFavBadge();

  document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', closeModals));
  document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', closeModals));

  document.querySelectorAll('.list-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.list-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderList();
    });
  });

  document.getElementById('listSearch').addEventListener('input', renderList);

  // 明细页收藏事件
  document.getElementById('detailScroll').addEventListener('click', e => {
    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
      const pid = favBtn.dataset.platformId;
      if (pid) togglePlatformFav(pid);
    }
  });
});

// ===== 页面导航 =====
function switchPage(pageId) {
  const allPages = document.querySelectorAll('.page');
  const targetPage = document.getElementById(pageId);
  if (!targetPage || targetPage.classList.contains('active')) return;
  allPages.forEach(p => p.classList.remove('active'));
  targetPage.classList.add('active');
}

function goHome() {
  switchPage('page-home');
  updateHomeCounts();
  renderQuickPlatforms();
  renderHomeHot();
  // 重置筛选
  currentFilter = 'all';
  document.querySelectorAll('.list-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
  document.getElementById('listSearch').value = '';
  navActive(0);
}

function navigateTo(page, category) {
  if (page === 'list') {
    currentListCategory = category;
    currentFilter = 'all';
    document.querySelectorAll('.list-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
    document.getElementById('listSearch').value = '';
    document.getElementById('listTitle').textContent = category === 'compute' ? '🖥️ 算力平台' : '🧠 AI 大模型';
    renderList();
    switchPage('page-list');
    navActive(category === 'compute' ? 1 : 2);
  }
}

function goToList() {
  document.getElementById('listTitle').textContent = currentListCategory === 'compute' ? '🖥️ 算力平台' : '🧠 AI 大模型';
  renderList();
  switchPage('page-list');
}

function showDetail(platformId) {
  currentPlatformId = platformId;
  renderDetail(platformId);
  switchPage('page-detail');
}

function showFavPage() {
  renderFavPage();
  switchPage('page-fav');
  navActive(3);
}

function showForum() {
  switchPage('page-forum');
  navActive(4);
}

function navActive(idx) {
  document.querySelectorAll('.nav-item').forEach((n, i) => n.classList.toggle('active', i === idx));
}
    'nav-llm': 2,
    'page-fav': 3
  };
  const idx = map[pageId] !== undefined ? map[pageId] : 0;
  document.querySelectorAll('.nav-item').forEach((n, i) => n.classList.toggle('active', i === idx));
}

// ===== 首页 =====
function updateHomeCounts() {
  document.getElementById('homePlatformCount').textContent = platforms.length;
  document.getElementById('homeDealCount').textContent = deals.length;
  const computeCount = platforms.filter(p => p.category === 'compute').length;
  const llmCount = platforms.filter(p => p.category === 'llm').length;
  const computeDeals = deals.filter(d => platforms.find(p => p.id === d.platformId)?.category === 'compute').length;
  const llmDeals = deals.filter(d => platforms.find(p => p.id === d.platformId)?.category === 'llm').length;
  const btnSubs = document.querySelectorAll('.ds-btn-sub');
  if (btnSubs[0]) btnSubs[0].textContent = `国内外 ${computeCount} 个 GPU 云平台`;
  if (btnSubs[1]) btnSubs[1].textContent = `国内外 ${llmCount} 个大模型 API 平台`;
}

function renderQuickPlatforms() {
  const grid = document.getElementById('quickGrid');
  if (!grid) return;
  // 取前 8 个平台（混合国内国际）
  const shuffled = [...platforms].sort(() => Math.random() - 0.5).slice(0, 8);
  grid.innerHTML = shuffled.map(p => {
    const c1 = p.brand ? p.brand[0] : '#6c5ce7';
    return `
      <div class="ds-quick-item" onclick="showDetail('${p.id}')" style="border-color:${c1}33">
        <div class="qi-icon" style="background:${c1}22">${p.icon}</div>
        <span class="qi-name">${p.name}</span>
        <span class="qi-tag">${p.region === 'domestic' ? '🇨🇳' : '🌍'}</span>
      </div>
    `;
  }).join('');
}

function renderHomeHot() {
  const list = document.getElementById('homeHotList');
  const hotDeals = deals.filter(d => d.tags.includes('hot') || d.tags.includes('free'))
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  if (hotDeals.length === 0) {
    document.getElementById('homeHot').style.display = 'none';
    return;
  }

  document.getElementById('homeHot').style.display = 'block';

  list.innerHTML = hotDeals.map(d => {
    const p = platforms.find(x => x.id === d.platformId);
    if (!p) return '';
    const tag = d.tags.includes('hot') ? 'hot' : 'free';
    const tagLabel = d.tags.includes('hot') ? '🔥 热门' : '🎁 免费';
    return `
      <div class="ds-hot-item" onclick="showDetail('${p.id}')">
        <div class="hot-icon">${p.icon}</div>
        <div class="hot-info">
          <div class="hot-name">${p.name} · ${d.title}</div>
          <div class="hot-desc">${d.desc.slice(0, 40)}...</div>
        </div>
        <span class="hot-tag ${tag}">${tagLabel}</span>
      </div>
    `;
  }).join('');
}

// ===== 收藏系统 =====
function getFavorites() {
  return JSON.parse(localStorage.getItem('pricing-favs2') || '[]');
}
function saveFavorites(favs) {
  localStorage.setItem('pricing-favs2', JSON.stringify(favs));
}
function isPlatformFav(platformId) {
  return getFavorites().includes(platformId);
}
function togglePlatformFav(platformId) {
  let favs = getFavorites();
  const idx = favs.indexOf(platformId);
  if (idx > -1) {
    favs.splice(idx, 1);
    saveFavorites(favs);
    if (document.getElementById('page-detail').classList.contains('active')) {
      renderDetail(platformId);
    }
    showToast('已取消收藏');
  } else {
    favs.push(platformId);
    saveFavorites(favs);
    if (document.getElementById('page-detail').classList.contains('active')) {
      renderDetail(platformId);
    }
    showToast('⭐ 已收藏');
  }
  updateFavBadge();
}
function updateFavBadge() {
  const badge = document.getElementById('favBadge');
  const count = getFavorites().length;
  if (count > 0) {
    badge.style.display = 'flex';
    badge.textContent = count;
  } else {
    badge.style.display = 'none';
  }
}

// ===== 收藏页 =====
function renderFavPage() {
  const favs = getFavorites();
  const container = document.getElementById('favContainer');
  const empty = document.getElementById('favEmpty');

  if (favs.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  const favPlatforms = platforms.filter(p => favs.includes(p.id));

  let html = `<div class="logo-grid-header">共 <strong>${favPlatforms.length}</strong> 个收藏平台</div><div class="logo-grid">`;

  html += favPlatforms.map(p => {
    const platformDeals = deals.filter(d => d.platformId === p.id);
    const freeCount = platformDeals.filter(d => d.promoType === 'free' || d.tags.includes('free')).length;
    const regionLabel = p.region === 'domestic' ? '🇨🇳' : '🌍';
    const c1 = p.brand ? p.brand[0] : '#6c5ce7';
    const c2 = p.brand ? p.brand[1] : '#a29bfe';

    return `
      <div class="logo-btn" onclick="showDetail('${p.id}')" style="background:linear-gradient(135deg,${c1}22,${c2}11);border-color:${c1}44">
        <div class="logo-btn-icon" style="background:linear-gradient(135deg,${c1},${c2})">${p.icon}</div>
        <div class="logo-btn-name">${p.name}</div>
        <div class="logo-btn-meta">
          <span class="logo-btn-region">${regionLabel}</span>
          <span class="logo-btn-deals">${platformDeals.length} 优惠</span>
          ${freeCount > 0 ? '<span class="logo-btn-free">🎁</span>' : ''}
        </div>
        <div class="logo-btn-fav" onclick="event.stopPropagation();togglePlatformFav('${p.id}')">⭐</div>
      </div>
    `;
  }).join('');

  html += '</div>';
  container.innerHTML = html;
}

// ===== Toast =====
let toastTimer = null;
function showToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--surface);color:var(--text);padding:10px 22px;border-radius:20px;font-size:13px;border:1px solid var(--border);box-shadow:0 4px 24px rgba(0,0,0,.3);z-index:300;opacity:0;transition:all .3s;pointer-events:none;backdrop-filter:blur(12px);white-space:nowrap';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2000);
}

// ===== 列表渲染 =====
function renderList() {
  const container = document.getElementById('listContainer');
  const empty = document.getElementById('listEmpty');
  const searchQ = document.getElementById('listSearch').value.trim().toLowerCase();

  let filtered = platforms.filter(p => {
    if (p.category !== currentListCategory) return false;
    if (currentFilter === 'domestic' && p.region !== 'domestic') return false;
    if (currentFilter === 'international' && p.region !== 'international') return false;
    if (currentFilter === 'free') {
      if (!deals.some(d => d.platformId === p.id && (d.promoType === 'free' || d.tags.includes('free')))) return false;
    }
    if (searchQ && !p.name.toLowerCase().includes(searchQ)) return false;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const categoryLabel = currentListCategory === 'compute' ? '算力' : '大模型';
  const totalDeals = filtered.reduce((sum, p) => sum + deals.filter(d => d.platformId === p.id).length, 0);

  // 顶部统计
  let html = `<div class="logo-grid-header">
    <span class="logo-grid-count">共 <strong>${filtered.length}</strong> 个${categoryLabel}平台 · <strong>${totalDeals}</strong> 个优惠</span>
  </div><div class="logo-grid">`;

  html += filtered.map(p => {
    const platformDeals = deals.filter(d => d.platformId === p.id);
    const freeCount = platformDeals.filter(d => d.promoType === 'free' || d.tags.includes('free')).length;
    const regionLabel = p.region === 'domestic' ? '🇨🇳' : '🌍';
    const isFav = isPlatformFav(p.id);
    const c1 = p.brand ? p.brand[0] : '#6c5ce7';
    const c2 = p.brand ? p.brand[1] : '#a29bfe';

    return `
      <div class="logo-btn" onclick="showDetail('${p.id}')" style="background:linear-gradient(135deg,${c1}22,${c2}11);border-color:${c1}44">
        <div class="logo-btn-icon" style="background:linear-gradient(135deg,${c1},${c2})">${p.icon}</div>
        <div class="logo-btn-name">${p.name}</div>
        <div class="logo-btn-meta">
          <span class="logo-btn-region">${regionLabel}</span>
          <span class="logo-btn-deals">${platformDeals.length} 优惠</span>
          ${freeCount > 0 ? '<span class="logo-btn-free">🎁</span>' : ''}
        </div>
        <div class="logo-btn-fav" onclick="event.stopPropagation();togglePlatformFav('${p.id}')">${isFav ? '⭐' : '☆'}</div>
      </div>
    `;
  }).join('');

  html += '</div>';
  container.innerHTML = html;
}

// ===== 明细渲染 =====
// 检查优惠是否过期
function isDealExpired(validUntil) {
  if (!validUntil || validUntil === '长期有效') return false;
  const match = validUntil.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return false;
  const expiry = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  return expiry < new Date();
}

function renderDetail(platformId) {
  const p = platforms.find(x => x.id === platformId);
  if (!p) return;

  const platformDeals = deals.filter(d => d.platformId === platformId);
  const freeCount = platformDeals.filter(d => d.promoType === 'free' || d.tags.includes('free')).length;
  const regionLabel = p.region === 'domestic' ? '🇨🇳 国内' : '🌍 国际';
  const regionClass = p.region === 'domestic' ? 'domestic' : 'international';
  const isFav = isPlatformFav(platformId);

  document.getElementById('detailTitle').textContent = p.name;

  document.getElementById('detailHeader').innerHTML = `
    <div class="platform-icon">${p.icon}</div>
    <div class="platform-name">
      ${p.name}
      <span class="region-tag ${regionClass}">${regionLabel}</span>
      <button class="fav-btn ${isFav ? 'active' : ''}" data-platform-id="${platformId}"
        style="background:none;border:none;font-size:22px;cursor:pointer;margin-left:6px;vertical-align:middle"
        title="${isFav ? '取消收藏' : '收藏此平台'}">
        ${isFav ? '⭐' : '☆'}
      </button>
      <button onclick="sharePlatform('${platformId}')" style="background:none;border:none;font-size:18px;cursor:pointer;margin-left:4px;vertical-align:middle" title="分享">🔗</button>
    </div>
    <div class="platform-url">
      <a href="${p.url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent2)">${p.url}</a>
    </div>
    <div class="platform-stats">
      <div class="stat"><strong>${platformDeals.length}</strong>优惠活动</div>
      <div class="stat"><strong>${freeCount}</strong>免费试用</div>
    </div>
  `;

  if (platformDeals.length === 0) {
    document.getElementById('detailDeals').innerHTML = `
      <div style="text-align:center;padding:32px 0;color:var(--text3);font-size:14px">暂无收录优惠活动</div>`;
  } else {
    const tagMap = { free: '免费', time: '限时', new: '最新', hot: '热门' };
    document.getElementById('detailDeals').innerHTML = platformDeals.map(d => {
      const expired = isDealExpired(d.validUntil);
      return `
      <div class="detail-deal" style="${expired ? 'opacity:0.5;border-color:var(--red)' : ''}">
        <div class="deal-title">${d.title}${expired ? '<span style="font-size:11px;color:var(--red);margin-left:6px;font-weight:400">⏰ 已过期</span>' : ''}</div>
        <div class="deal-desc">${d.desc}</div>
        <div class="deal-tags">${d.tags.map(t => `<span class="deal-tag ${t}">${tagMap[t] || t}</span>`).join('')}</div>
        <div class="deal-footer">
          <span class="deal-valid">📅 ${d.validUntil}</span>
          ${expired ? '' : `<a href="${d.url}" target="_blank" rel="noopener noreferrer" class="deal-link">立即查看 →</a>`}
        </div>
      </div>`;
    }).join('');
  }

  const aboutText = p.detailDesc || p.desc;
  document.getElementById('detailAbout').innerHTML = aboutText
    .split('。').filter(s => s.trim())
    .map(s => `<p style="margin-bottom:8px;line-height:1.7">${s.trim()}。</p>`).join('');
}

// ===== 主题 =====
function toggleTheme() {
  isDark = !isDark;
  applyTheme();
}
function applyTheme() {
  document.body.className = isDark ? 'dark' : 'light';
  document.querySelectorAll('.theme-btn').forEach(b => b.textContent = isDark ? '🌙' : '☀️');
  localStorage.setItem('pricing-theme', isDark ? 'dark' : 'light');
}

// ===== 弹窗 =====
function sharePlatform(platformId) {
  const p = platforms.find(x => x.id === platformId);
  if (!p) return;
  const text = `[${p.icon}] ${p.name} - 查看最新优惠 https://evengan.oss-cn-hangzhou.aliyuncs.com`;
  if (navigator.share) {
    navigator.share({ title: p.name + ' 优惠', text: text, url: 'https://evengan.oss-cn-hangzhou.aliyuncs.com' }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('✅ 已复制分享链接')).catch(() => {});
  } else {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('✅ 已复制分享链接');
  }
}

function showAboutModal() {
  document.getElementById('aboutPlatformCount').textContent = platforms.length;
  document.getElementById('aboutDealCount').textContent = deals.length;
  document.getElementById('aboutModal').style.display = 'flex';
}
function closeModals() {
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

// ===== 提交优惠 =====
function showSubmitDeal() {
  const sel = document.getElementById('submitPlatform');
  if (sel) {
    sel.innerHTML = '<option value="">选择平台...</option>' +
      platforms.map(p => `<option value="${p.id}">${p.icon} ${p.name}</option>`).join('');
  }
  document.getElementById('submitModal').style.display = 'flex';
}
function closeSubmitDeal() {
  document.getElementById('submitModal').style.display = 'none';
}
// 过滤恶意内容
function sanitize(str) {
  return str.replace(/<[^>]*>/g, '')    // 去掉HTML标签
            .replace(/[<>"'`]/g, '')     // 去掉特殊字符
            .replace(/javascript:/gi, '') // 去掉 js 协议
            .replace(/on\w+=/gi, '')     // 去掉事件处理器
            .trim();
}

function saveSubmitDeal() {
  const pid = document.getElementById('submitPlatform').value;
  const title = sanitize(document.getElementById('submitTitle').value);
  const desc = sanitize(document.getElementById('submitDesc').value);
  const url = document.getElementById('submitUrl').value.trim();
  // URL 只允许 http/https
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    showToast('链接格式不正确');
    return;
  }
  if (!pid || !title) { showToast('请填写平台和标题'); return; }
  if (title.length > 100 || desc.length > 500) { showToast('内容过长'); return; }
  // 存到 localStorage
  const pending = JSON.parse(localStorage.getItem('pending-deals') || '[]');
  pending.push({ platformId: pid, title, desc, url, time: new Date().toISOString() });
  localStorage.setItem('pending-deals', JSON.stringify(pending));
  closeSubmitDeal();
  document.getElementById('submitTitle').value = '';
  document.getElementById('submitDesc').value = '';
  document.getElementById('submitUrl').value = '';
  showToast('✅ 已收到！管理员审核后上线');
}

// ===== 比价页 =====
const priceData = [
  { gpu: 'H100', aliyun: '¥42/时', tencent: '¥38/时', huawei: '¥45/时', aws: '$4.2/时', gcp: '$3.8/时', azure: '$4.0/时', lambdalabs: '$2.5/时', vastai: '$1.8/时' },
  { gpu: 'A100 80G', aliyun: '¥28/时', tencent: '¥26/时', huawei: '¥30/时', aws: '$3.2/时', gcp: '$2.9/时', azure: '$3.0/时', lambdalabs: '$1.8/时', vastai: '$1.2/时' },
  { gpu: 'A100 40G', aliyun: '¥18/时', tencent: '¥16/时', huawei: '¥20/时', aws: '$2.5/时', gcp: '$2.2/时', azure: '$2.3/时', lambdalabs: '$1.3/时', vastai: '$0.9/时' },
  { gpu: 'V100', aliyun: '¥10/时', tencent: '¥9/时', huawei: '¥11/时', aws: '$1.4/时', gcp: '$1.2/时', azure: '$1.3/时', lambdalabs: '-', vastai: '$0.5/时' },
  { gpu: 'T4', aliyun: '¥5/时', tencent: '¥4.5/时', huawei: '¥5.5/时', aws: '$0.7/时', gcp: '$0.6/时', azure: '$0.65/时', lambdalabs: '-', vastai: '$0.3/时' },
  { gpu: 'L4', aliyun: '¥6/时', tencent: '¥5.5/时', huawei: '¥6.5/时', aws: '$0.8/时', gcp: '$0.7/时', azure: '$0.75/时', lambdalabs: '$0.5/时', vastai: '$0.35/时' },
  { gpu: 'RTX4090', aliyun: '-', tencent: '-', huawei: '-', aws: '-', gcp: '-', azure: '-', lambdalabs: '$0.7/时', vastai: '$0.35/时' },
];

// ===== 多平台比价 =====
let cpType = 'compute';
let cpSelected = [];

function showCompare() {
  cpType = 'compute';
  cpSelected = [];
  switchPage('page-compare');
  navActive(-1);
  renderCpPlatforms();
  document.getElementById('cpCompare').style.display = '';
  document.getElementById('cpCombine').style.display = 'none';
}

function switchCpTab(tab) {
  document.querySelectorAll('.cp-tab').forEach(t => t.classList.toggle('active', t.textContent.includes(tab === 'compare' ? '比价' : '组合')));
  document.getElementById('cpCompare').style.display = tab === 'compare' ? '' : 'none';
  document.getElementById('cpCombine').style.display = tab === 'combine' ? '' : 'none';
  if (tab === 'combine') renderCombo();
  else renderCpPlatforms();
}

function switchCpType(type) {
  cpType = type;
  cpSelected = [];
  document.querySelectorAll('.cp-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  renderCpPlatforms();
}

function renderCpPlatforms() {
  const container = document.getElementById('cpPlatforms');
  const data = cpType === 'compute' ? gpuPrices : apiPrices;
  const keys = Object.keys(data);
  // 默认选中前2个
  if (cpSelected.length === 0) { cpSelected = [keys[0], keys[1] || keys[0]]; }
  container.innerHTML = keys.map(id => {
    const d = data[id];
    const sel = cpSelected.includes(id);
    return `<button class="cp-platform-btn ${sel ? 'active' : ''}" onclick="toggleCpPlatform('${id}')">
      <span class="ck">${sel ? '✓' : ''}</span>
      ${d.icon} ${d.name}
    </button>`;
  }).join('');
  renderCpTable();
}

function toggleCpPlatform(id) {
  const idx = cpSelected.indexOf(id);
  if (idx > -1) { cpSelected.splice(idx, 1); }
  else if (cpSelected.length < 4) { cpSelected.push(id); }
  else { showToast('最多选 4 个平台'); return; }
  renderCpPlatforms();
}

function renderCpTable() {
  const container = document.getElementById('cpTable');
  const data = cpType === 'compute' ? gpuPrices : apiPrices;
  const selected = cpSelected.map(id => data[id]).filter(Boolean);

  if (selected.length < 2) { container.innerHTML = '<p style="color:var(--text3);font-size:13px">请选择至少 2 个平台</p>'; return; }

  // 收集所有 GPU 型号 / 模型名
  const allKeys = new Set();
  selected.forEach(p => Object.keys(p.prices).forEach(k => allKeys.add(k)));
  const keys = Array.from(allKeys);

  let html = `<table class="cp-compare-table"><thead><tr><th>${cpType === 'compute' ? 'GPU' : '模型'}</th>`;
  selected.forEach(p => { html += `<th>${p.icon} ${p.name}</th>`; });
  html += '</tr></thead><tbody>';

  keys.forEach(key => {
    html += `<tr><td class="gpu-n">${key}</td>`;
    const vals = selected.map(p => p.prices[key] || '-');
    // 找最低价
    const prices = vals.map(v => {
      const m = v.match(/[\d.]+/);
      return m ? parseFloat(m[0]) : Infinity;
    });
    const minVal = Math.min(...prices);
    vals.forEach((v, i) => {
      const isBest = prices[i] === minVal && prices[i] !== Infinity && v !== '-';
      html += `<td class="${isBest ? 'best' : ''}">${v}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  html += '<p style="font-size:11px;color:var(--text3);margin-top:8px">💡 绿色=最低价 · 价格仅供参考</p>';
  container.innerHTML = html;
}

// ===== 组合测算 =====
function renderCombo() {
  const selC = document.getElementById('comboCompute');
  const selL = document.getElementById('comboLlm');
  if (!selC || !selL) return;

  // 填充下拉框
  if (selC.options.length === 0) {
    const computePlatforms = platforms.filter(p => p.category === 'compute');
    computePlatforms.forEach(p => { selC.add(new Option(p.icon + ' ' + p.name, p.id)); });
    const llmPlatforms = platforms.filter(p => p.category === 'llm');
    llmPlatforms.forEach(p => { selL.add(new Option(p.icon + ' ' + p.name, p.id)); });
  }

  const cId = selC.value;
  const lId = selL.value;
  const result = document.getElementById('comboResult');

  const cDeals = deals.filter(d => d.platformId === cId);
  const lDeals = deals.filter(d => d.platformId === lId);

  if (!cId || !lId) { result.innerHTML = '<p style="color:var(--text3);font-size:13px">请选择平台</p>'; return; }

  const cP = platforms.find(p => p.id === cId);
  const lP = platforms.find(p => p.id === lId);

  let html = `<div style="display:flex;gap:8px;margin-bottom:12px">
    <div style="flex:1;padding:10px;border-radius:8px;background:var(--surface);border:1px solid var(--border);text-align:center">
      <div style="font-size:24px">${cP ? cP.icon : ''}</div>
      <div style="font-size:13px;font-weight:600;margin-top:4px">${cP ? cP.name : ''}</div>
      <div style="font-size:11px;color:var(--text2)">${cDeals.length} 个优惠</div>
    </div>
    <div style="display:flex;align-items:center;font-size:20px;color:var(--text3)">＋</div>
    <div style="flex:1;padding:10px;border-radius:8px;background:var(--surface);border:1px solid var(--border);text-align:center">
      <div style="font-size:24px">${lP ? lP.icon : ''}</div>
      <div style="font-size:13px;font-weight:600;margin-top:4px">${lP ? lP.name : ''}</div>
      <div style="font-size:11px;color:var(--text2)">${lDeals.length} 个优惠</div>
    </div>
  </div>`;

  if (cDeals.length === 0 && lDeals.length === 0) {
    html += '<p style="color:var(--text3);font-size:13px;text-align:center">暂无优惠活动</p>';
  } else {
    html += '<h4 style="font-size:14px;font-weight:600;margin-bottom:8px">🎯 可用优惠</h4>';
    [...cDeals, ...lDeals].forEach(d => {
      const tagMap = { free: '免费', time: '限时', new: '最新', hot: '热门' };
      const tags = d.tags.map(t => `<span class="tag ${t}">${tagMap[t] || t}</span>`).join('');
      html += `<div class="combo-card">
        <h4>${d.title}</h4>
        <p>${d.desc}</p>
        <div>${tags}</div>
        <a href="${d.url}" target="_blank" class="link" style="font-size:11px">查看详情 →</a>
      </div>`;
    });
  }
  result.innerHTML = html;
}
