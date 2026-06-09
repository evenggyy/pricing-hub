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
    document.getElementById('detailDeals').innerHTML = platformDeals.map(d => `
      <div class="detail-deal">
        <div class="deal-title">${d.title}</div>
        <div class="deal-desc">${d.desc}</div>
        <div class="deal-tags">${d.tags.map(t => `<span class="deal-tag ${t}">${tagMap[t] || t}</span>`).join('')}</div>
        <div class="deal-footer">
          <span class="deal-valid">📅 ${d.validUntil}</span>
          <a href="${d.url}" target="_blank" rel="noopener noreferrer" class="deal-link">立即查看 →</a>
        </div>
      </div>
    `).join('');
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
function showAboutModal() {
  document.getElementById('aboutPlatformCount').textContent = platforms.length;
  document.getElementById('aboutDealCount').textContent = deals.length;
  document.getElementById('aboutModal').style.display = 'flex';
}
function closeModals() {
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}
