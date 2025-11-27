🚀 KeepURL Monitor — 多地址云监控 + Web UI + Telegram 通知

一个运行在 Cloudflare Workers 上的多网址监控系统，带：

✅ 精美 Web 控制台
✅ 后端密码校验
✅ KV 持久化储存 URL 列表
✅ 定时自动巡检（Cron Trigger）
✅ Telegram 报警/日报通知
✅ 批量新增、删除监控 URL
✅ 自带状态 UI（在线 / 离线 / 异常）


📸 截图预览（可选）

<img width="2083" height="1238" alt="image" src="https://github.com/user-attachments/assets/6084f190-0e08-46e9-8902-b0b51bcd446a" />
✨ 功能特点
🔍 1. 多 URL 实时监控

在线、离线、错误状态一目了然

每个 URL 显示状态码、复制按钮

🖥 2. 在 Worker 内置前端 Web 控制台

无需部署服务器

手机/PC 自适应

三列栅格布局、渐变背景、卡片设计

🔐 3. 支持后端密码验证
新增 URL
删除 URL
复制 URL
退出登录



⚙️ 安装与部署
1️⃣ 创建 Cloudflare Worker

进入 Cloudflare Dashboard → Workers → Create Worker

把 index.js 替换成仓库里的代码。

2️⃣ 创建 KV Namespace

在 Cloudflare → Workers → KV 中创建：

Namespace	变量名 (binding)
keepURL	keepURL
3️⃣ 绑定 KV 到 Worker

在 Worker 设置 → KV Bindings 添加：

Variable name: keepURL
Namespace: keepURL

4️⃣ 设置环境变量

在 Worker → Settings → Variables → 添加以下：

名字	           值	            描述
TELEGRAM_TOKEN	你的 Bot Token	BotFather 创建
CHAT_ID	        你的 TG 群/用户 ID	/getChatId
PASSWORD	      你的后台密码	用于新增/删除 URL

5️⃣ 绑定 Cron Trigger（可选）

启用自动巡检（例如 30 分钟一次）：

*/30 * * * *







💾 4. 存储基于 Cloudflare KV

多设备共享

持久化

🤖 5. Telegram 报警 & 日报

URL 异常实时报警

Cron 定时任务每日总结

Markdown 格式美观输出


📌 使用说明
打开控制台

访问 Worker 的 URL：

https://xxx.workers.dev/

➕ 批量新增 URL

在 Web 控制台底部 → 添加新监控
支持多行输入：

https://google.com
https://cloudflare.com
https://github.com

🗑 删除 URL

点击右侧 “🗑️” 图标即可删除（需验证密码）。

🔐 密码认证

首次点击操作需要输入你在 PASSWORD 中设置的密码。

浏览器会记住登录状态（sessionStorage）。

📡 Telegram 通知示例
URL 异常报警：
⚠️ 访问异常
URL: https://xxx.com
状态码: 503

URL 连接失败：
❌ 连接失败
URL: https://xxx.com
错误: timeout

定时任务日报：
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
  "urls": ["https://abc.com", "https://xyz.com"],
  "password": "你的密码"
}

删除 URL
DELETE /api/urls
{
  "url": "https://abc.com",
  "password": "你的密码"
}

检查某个 URL
GET /api/check?url=https://google.com


返回：

{
  "ok": true,
  "status": 200
}

🛠 项目结构
├── README.md
├── index.js        # Worker 主文件
└── assets/         # 可选: 截图等资源

❤️ 鸣谢 / License

MIT License
自由使用、修改、商用。
