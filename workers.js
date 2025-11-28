/**
 * Cloudflare Worker with Web UI and Telegram Notifications
 * 
 * 部署说明:
 * 1. 在 Cloudflare 后台创建一个 KV Namespace，命名为 "keepURL"
 * 2. 绑定 KV:变量名也是keepURL
 *    
 */

const TELEGRAM_TOKEN = '';//你的电  报机器人Token
const CHAT_ID = '';//你的电报群ID
const TG_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

// === 自定义密码配置 ===
// PASSWORD 现在通过环境变量传递,默认值在 handleRequest 中设置

// 默认 URL 列表 (如果 KV 为空时初始化用)
const DEFAULT_URLS = [
  "",
  ""
];

// HTML 模板
const HTML_PAGE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KeepURL Monitor</title>
  <style>
    :root { 
      --primary: #6366f1; 
      --primary-dark: #4f46e5;
      --bg-start: #667eea; 
      --bg-end: #764ba2; 
      --card-bg: rgba(255, 255, 255, 0.95); 
      --text: #1f2937; 
      --text-light: #6b7280; 
      --success: #10b981; 
      --error: #ef4444; 
      --warning: #f59e0b; 
    }
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      background: linear-gradient(135deg, var(--bg-start) 0%, var(--bg-end) 100%);
      background-attachment: fixed;
      color: var(--text); 
      margin: 0; 
      padding: 20px; 
      min-height: 100vh;
    }
    
    .container { max-width: 1200px; margin: 0 auto; }
    
    h1 {
      text-align: center;
      color: white;
      font-size: 2.5em;
      margin: 20px 0 10px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    
    .subtitle {
      text-align: center;
      color: rgba(255,255,255,0.9);
      font-size: 1.1em;
      margin-bottom: 30px;
    }
    
    /* 顶部统计 */
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 20px; 
      margin-bottom: 30px; 
    }
    
    .stat-card { 
      background: var(--card-bg); 
      padding: 25px; 
      border-radius: 16px; 
      box-shadow: 0 8px 16px rgba(0,0,0,0.1); 
      text-align: center; 
      transition: transform 0.3s, box-shadow 0.3s;
      backdrop-filter: blur(10px);
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
    }
    
    .stat-value { font-size: 36px; font-weight: 700; margin: 10px 0; }
    .stat-label { color: var(--text-light); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .text-success { color: var(--success); }
    .text-error { color: var(--error); }
    
    /* 添加区域 */
    .add-section { 
      background: var(--card-bg); 
      padding: 20px; 
      border-radius: 16px; 
      margin-bottom: 30px; 
      box-shadow: 0 8px 16px rgba(0,0,0,0.1); 
      backdrop-filter: blur(10px);
    }
    
    textarea { 
      width: 100%; 
      padding: 12px; 
      border: 2px solid #e5e7eb; 
      border-radius: 8px; 
      font-family: monospace; 
      margin-bottom: 10px; 
      resize: vertical; 
      box-sizing: border-box; 
      transition: border-color 0.3s;
    }
    
    textarea:focus { outline: none; border-color: var(--primary); }
    
    .btn { 
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white; 
      border: none; 
      padding: 12px 24px; 
      border-radius: 8px; 
      cursor: pointer; 
      font-weight: 600; 
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
    }
    
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(99, 102, 241, 0.4); }
    
    /* 列表布局 - 网格3列 */
    .list-container { 
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px; 
    }
    
    .list-item { 
      background: var(--card-bg); 
      border-radius: 12px; 
      padding: 12px 16px; 
      box-shadow: 0 4px 8px rgba(0,0,0,0.08); 
      display: flex; 
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      border-left: 4px solid transparent; 
      transition: all 0.3s;
      backdrop-filter: blur(10px);
      min-height: 60px;
    }
    
    .list-item:hover { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
    .list-item.online { border-left-color: var(--success); }
    .list-item.offline { border-left-color: var(--error); }
    
    .item-main { flex: 1; min-width: 0; margin-right: 12px; }
    .item-title { font-weight: 600; font-size: 14px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-sub { font-size: 10px; color: var(--text-light); margin-top: 2px; }
    
    .item-right { display: flex; align-items: center; gap: 10px; }
    .item-status { display: flex; align-items: center; gap: 8px; }
    
    .badge { font-size: 12px; padding: 6px 12px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
    .badge.online { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #065f46; }
    .badge.offline { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #991b1b; }
    .badge.checking { background: #f3f4f6; color: #4b5563; }
    
    .actions { display: flex; gap: 6px; }
    .btn-icon { 
      padding: 6px; 
      border-radius: 6px; 
      border: 1px solid #e5e7eb; 
      background: white; 
      cursor: pointer; 
      color: var(--text-light); 
      transition: all 0.2s; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      font-size: 14px;
    }
    
    .btn-icon:hover { background: var(--primary); color: white; border-color: var(--primary); transform: scale(1.05); }
    .btn-del:hover { background: var(--error); color: white; border-color: var(--error); }
    
    /* 移动端适配 */
    @media (max-width: 1024px) { .list-container { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { 
      .stats-grid { grid-template-columns: 1fr; }
      .list-container { grid-template-columns: 1fr; }
    }
    
    .toast { 
      position: fixed; 
      bottom: 20px; 
      right: 20px; 
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%); 
      color: white; 
      padding: 12px 24px; 
      border-radius: 8px; 
      opacity: 0; 
      transition: opacity 0.3s; 
      z-index: 100; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 多地址监控面板</h1>
    <div class="subtitle">实时监控多个 URL 平台和服务状态</div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">总监控数</div>
        <div class="stat-value" id="totalCount">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">在线</div>
        <div class="stat-value text-success" id="onlineCount">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">离线/异常</div>
        <div class="stat-value text-error" id="offlineCount">-</div>
      </div>
    </div>

    <div class="list-container" id="listContainer">
      <!-- 列表由 JS 生成 -->
    </div>

    <div class="add-section" style="margin-top: 30px;">
      <details>
        <summary style="cursor:pointer;font-weight:600;margin-bottom:10px">➕ 添加新监控</summary>
        <textarea id="newUrl" rows="3" placeholder="输入 URL，每行一个..."></textarea>
        <button class="btn" onclick="addUrl()">批量添加</button>
      </details>
    </div>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    const PASSWORD = '\${PASSWORD}';  // 从后端注入的密码配置
    console.log('Frontend PASSWORD:', PASSWORD);
    let allUrls = [];
    let isAuthenticated = false;

    async function init() {
      const res = await fetch('/api/urls');
      allUrls = await res.json();
      renderList();
      checkAllStatus();
      
      if (sessionStorage.getItem('auth') === 'true') {
        isAuthenticated = true;
      }
    }

    function getDomain(url) {
      try {
        const hostname = new URL(url).hostname;
        const parts = hostname.split('.');
        
        if (parts.length >= 2) {
          const firstPart = parts[0];
          const showLength = Math.min(Math.ceil(firstPart.length / 2), 5);
          const prefix = firstPart.substring(0, showLength);
          const topDomain = parts.slice(-2).join('.');
          return prefix + '*.' + topDomain;
        }
        
        return hostname.substring(0, 5) + '***';
      } catch {
        return 'Invalid URL';
      }
    }

    function authenticate() {
      if (isAuthenticated) return true;
      
      const pass = prompt('请输入操作密码:');
      if (!pass) return false;
      
      if (pass === PASSWORD) {
        isAuthenticated = true;
        sessionStorage.setItem('auth', 'true');
        showToast('验证成功');
        return true;
      } else {
        alert('密码错误');
        return false;
      }
    }

    function clearAuth() {
      isAuthenticated = false;
      sessionStorage.removeItem('auth');
      showToast('已退出验证');
    }

    function renderList() {
      const container = document.getElementById('listContainer');
      document.getElementById('totalCount').innerText = allUrls.length;
      container.innerHTML = '';

      allUrls.forEach((url, index) => {
        const domain = getDomain(url);
        const item = document.createElement('div');
        item.className = 'list-item';
        item.id = 'item-' + index;
        item.innerHTML = '<div class="item-main">' +
          '<div class="item-title" title="' + domain + '">' + domain + '</div>' +
          '<div class="item-sub">' +
            '<span class="url-mask" onclick="copyToClipboard(&apos;' + url + '&apos;)" title="点击复制完整链接" style="cursor:pointer;font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:3px;font-size:10px;">🔗 复制</span>' +
          '</div>' +
        '</div>' +
        '<div class="item-right">' +
          '<div class="item-status">' +
            '<span class="badge checking" id="badge-' + index + '">检测中</span>' +
            '<div style="font-size:11px;color:#6b7280;min-width:70px;text-align:right;" id="code-' + index + '">-</div>' +
          '</div>' +
          '<div class="actions">' +
            '<button class="btn-icon" onclick="copyToClipboard(&apos;' + url + '&apos;)" title="复制">📋</button>' +
            '<button class="btn-icon btn-del" onclick="deleteUrl(&apos;' + url + '&apos;)" title="删除">🗑️</button>' +
          '</div>' +
        '</div>';
        container.appendChild(item);
      });
    }

    async function checkAllStatus() {
      let online = 0;
      let offline = 0;
      
      const promises = allUrls.map(async (url, index) => {
        try {
          const res = await fetch('/api/check?url=' + encodeURIComponent(url));
          const data = await res.json();
          updateItemStatus(index, data.ok, data.status);
          if (data.ok) online++; else offline++;
        } catch (e) {
          updateItemStatus(index, false, 'Err');
          offline++;
        }
      });

      await Promise.all(promises);
      document.getElementById('onlineCount').innerText = online;
      document.getElementById('offlineCount').innerText = offline;
    }

    function updateItemStatus(index, isOk, code) {
      const item = document.getElementById('item-' + index);
      const badge = document.getElementById('badge-' + index);
      const codeDiv = document.getElementById('code-' + index);

      if (isOk) {
        item.classList.add('online');
        item.classList.remove('offline');
        badge.className = 'badge online';
        badge.innerText = '在线';
        codeDiv.innerText = 'Code: ' + code;
      } else {
        item.classList.add('offline');
        item.classList.remove('online');
        badge.className = 'badge offline';
        badge.innerText = '离线';
        codeDiv.innerText = 'Err: ' + code;
      }
    }

    async function addUrl() {
      console.log('addUrl function called');
      if (!authenticate()) {
        console.log('Authentication failed or cancelled');
        return;
      }

      const input = document.getElementById('newUrl');
      const text = input.value.trim();
      if (!text) return;
      const urlsToAdd = text.split(new RegExp('[\\r\\n]+'))
        .map(u => u.trim())
        .filter(u => u)
        .map(u => {
          if (!new RegExp('^https?://', 'i').test(u)) {
            return 'https://' + u;
          }
          return u;
        });
      if (urlsToAdd.length === 0) return;

      const res = await fetch('/api/urls', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ urls: urlsToAdd, password: PASSWORD })
      });

      if (res.status === 401) {
        alert('后端验证失败');
        return;
      }
      
      input.value = '';
      showToast('已添加 ' + urlsToAdd.length + ' 个监控');
      init();
    }

    async function deleteUrl(url) {
      if (!confirm('确定删除?')) return;
      if (!authenticate()) return;

      const res = await fetch('/api/urls', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ url, password: PASSWORD })
      });

      if (res.status === 401) {
        alert('后端验证失败');
        return;
      }

      showToast('已删除');
      init();
    }

    function copyToClipboard(text) {
      if (!authenticate()) return;
      
      navigator.clipboard.writeText(text);
      showToast('链接已复制');
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.style.opacity = 1;
      setTimeout(() => t.style.opacity = 0, 2000);
    }

    init();
  </script>
</body>
</html>
`;

// === 主逻辑 ===

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

addEventListener('scheduled', event => {
  event.waitUntil(handleScheduled());
});

async function handleRequest(request) {
  // 在Service Worker语法中,环境变量是全局变量
  // 我们尝试直接访问全局PASSWORD,如果未定义则使用默认值
  let currentPassword = '123456';
  try {
    if (typeof PASSWORD !== 'undefined') {
      currentPassword = PASSWORD;
    }
  } catch (e) {
    // 忽略错误
  }

  console.log('Using PASSWORD:', currentPassword);
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === '/api/urls') {
    const urls = await getUrls();
    return new Response(JSON.stringify(urls), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST' && url.pathname === '/api/urls') {
    const { urls: newUrls, password } = await request.json();
    console.log('Received password:', password, 'Expected PASSWORD:', currentPassword, 'Match:', password === currentPassword);

    if (password !== currentPassword) {
      return new Response('Unauthorized', { status: 401 });
    }

    let currentUrls = await getUrls();
    let addedCount = 0;
    if (Array.isArray(newUrls)) {
      newUrls.forEach(u => {
        if (u && !currentUrls.includes(u)) {
          currentUrls.push(u);
          addedCount++;
        }
      });
      if (addedCount > 0) {
        await saveUrls(currentUrls);
      }
    }

    return new Response(JSON.stringify({ status: 'ok', added: addedCount, urls: currentUrls }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'DELETE' && url.pathname === '/api/urls') {
    const { url: delUrl, password } = await request.json();

    if (password !== currentPassword) {
      return new Response('Unauthorized', { status: 401 });
    }

    let urls = await getUrls();
    urls = urls.filter(u => u !== delUrl);
    await saveUrls(urls);
    return new Response(JSON.stringify({ status: 'ok', urls }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'GET' && url.pathname === '/api/check') {
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) return new Response('Missing url', { status: 400 });

    try {
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'KeepURL-Check/1.0' },
        redirect: 'follow'
      });
      const isOk = res.status < 500;
      return new Response(JSON.stringify({ ok: isOk, status: res.status }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, status: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(HTML_PAGE.replace('${PASSWORD}', currentPassword), {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });
}

async function getUrls() {
  let urlsStr = await keepURL.get('urls');
  if (!urlsStr) {
    return DEFAULT_URLS;
  }
  return JSON.parse(urlsStr);
}

async function saveUrls(urls) {
  await keepURL.put('urls', JSON.stringify(urls));
}

async function handleScheduled() {
  const urls = await getUrls();
  console.log(`⏳ 开始检测 ${urls.length} 个 URL`);

  let success = 0;
  let fail = 0;

  for (const url of urls) {
    const ok = await checkUrl(url);
    if (ok) success++;
    else fail++;
  }

  const msg = `📊 *KeepURL 监控报告*\n\n✅ 成功: ${success}\n❌ 失败: ${fail}\n总计: ${urls.length}\n\n时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

  // 发送汇总报告（无论成功失败都发送，确保你知道它在运行）
  await sendTelegramMessage(msg);
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'KeepURL-Monitor/1.0' }
    });

    if (res.status < 300) {
      return true;
    } else {
      await sendTelegramMessage(`⚠️ *访问异常*\nURL: ${url}\n状态码: ${res.status}`);
      return false;
    }
  } catch (err) {
    await sendTelegramMessage(`❌ *连接失败*\nURL: ${url}\n错误: ${err.message}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function sendTelegramMessage(text) {
  try {
    await fetch(TG_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
  } catch (e) {
    console.log('TG 发送失败', e);
  }
}

