代码还有点小问题 欢迎测试，环境变量更新后会重新部署 老的监控链接记得保存
🚀 KeepURL Monitor — 多地址云监控 + Web UI + Telegram 通知

KeepURL Monitor 是一个运行在 Cloudflare Workers 上的轻量级多网址监控系统，具备：

✅ 精美 Web 控制台

🔐 后端密码校验

💾 Cloudflare KV 持久化

🕒 Cron 定时巡检

🤖 Telegram 报警 & 日报

📌 批量新增 / 删除监控 URL

📡 在线 / 离线 / 异常监控

📸 截图预览
<img width="2083" height="1238" alt="image" src="https://github.com/user-attachments/assets/6084f190-0e08-46e9-8902-b0b51bcd446a" />
✨ 功能特点
🔍 1. 多 URL 实时监控

在线、离线、错误状态一目了然

显示 HTTP 状态码

一键复制 URL

🖥 2. 自带 Web 控制台

无需服务器或前端项目

手机 & PC 自适应

渐变背景 + 卡片 UI

🔐 3. 密码保护

添加 URL

删除 URL

复制 URL

退出登录

💾 4. Cloudflare KV 持久化存储

跨设备共享

自动同步

🤖 5. Telegram 报警 & 日报

异常状态即时报警

自带 push 格式

Cron 定时任务（可选）

⚙️ 安装与部署
1️⃣ 创建 Cloudflare Worker

Cloudflare Dashboard → Workers → Create Worker
将仓库中的 index.js 复制进去。

2️⃣ 创建 KV Namespace

进入 Cloudflare → Workers → KV 创建：

Namespace	绑定变量名
keepURL	keepURL
3️⃣ 将 KV 绑定到 Worker

Worker → Settings → KV Bindings

Variable name: keepURL
Namespace: keepURL

4️⃣ 设置环境变量（必须）

Worker → Settings → Variables

名字	值	说明
TELEGRAM_TOKEN	你的 Bot Token	@BotFather 创建
CHAT_ID	Telegram 群或用户 ID	使用 /getChatId
PASSWORD	自定义访问密码	控制台操作权限
5️⃣ 配置 Cron（可选）

Cloudflare → Worker → Triggers → Cron Triggers

例如：每 30 分钟巡检一次：

*/30 * * * *

📌 使用说明
打开控制台

访问 Worker URL：

https://xxx.workers.dev/

➕ 批量新增 URL

控制台底部 → 添加新监控

支持多行输入：

https://google.com
https://cloudflare.com
https://github.com

🗑 删除 URL

点击右侧 🗑️ 删除按钮
（需要密码验证）

🔐 密码认证

首次操作需输入密码（PASSWORD）
浏览器自动记录（sessionStorage）

📡 Telegram 通知示例
⚠ 异常报警
⚠️ 访问异常
URL: https://xxx.com
状态码: 503

❌ 连接失败
❌ 连接失败
URL: https://xxx.com
错误: timeout

📊 每日巡检报告
📊 KeepURL 监控报告

✅ 成功: 28
❌ 失败: 2
总计: 30

时间: 2025/09/01 23:59:02

🧩 API 说明（可用于第三方集成）
获取所有监控 URL
GET /api/urls

新增 URL
POST /api/urls
{
  "urls": ["https://abc.com"],
  "password": "你的密码"
}

删除 URL
DELETE /api/urls
{
  "url": "https://abc.com",
  "password": "你的密码"
}

检查某个地址
GET /api/check?url=https://google.com


返回示例：

{
  "ok": true,
  "status": 200
}

🛠 项目结构
├── README.md
├── index.js     # Cloudflare Worker 主文件
└── assets/      # 可选：截图资源

❤️ License

MIT License
可自由使用 / 修改 / 二次开发 / 商用
