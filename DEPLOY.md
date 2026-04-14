部署与运维说明 (快速上手)

目标
- 在 Vercel / 自托管环境 部署 web 应用，使得：
  - /api/og/png 能返回 PNG（使用 sharp）或 SVG 回退
  - 邮件发送（SendGrid）与支付（Stripe）可配置并验证
  - SEO 与社媒分享（OG、sitemap、robots）正常

一、环境变量（必须在部署平台或本地 .env.local 设置）
- NEXT_PUBLIC_BASE_URL  (例: https://yourdomain.com 或 http://localhost:3000)
- SENDGRID_API_KEY       （可选，发送欢迎邮件）
- SENDGRID_FROM          （可选，发送者邮箱，例如: noreply@yourdomain.com）
- STRIPE_SECRET_KEY      （可选，测试/生产 Stripe 密钥）
- STRIPE_DEFAULT_PRICE_ID（可选，用于 demo checkout）
- STRIPE_WEBHOOK_SECRET  （可选，部署 webhook 时填写）

二、服务器端 OG PNG 生成（app/api/og/png/route.ts）
- 功能：接收 name / sign 参数，生成 SVG，然后尝试用 sharp 转为 PNG 并缓存到 .ogcache/<hash>.png。
- 回退：若服务器上未安装 sharp，会直接返回 SVG（Content-Type: image/svg+xml）。

如何在本地启用 sharp（macOS）
1) 安装 libvips（sharp 的运行时依赖），推荐使用 Homebrew：
   brew install vips
2) 安装 npm 包：
   cd web
   npm install sharp
3) 重建并运行：
   npm run build
   npm run start
4) 测试：
   curl -sS "http://localhost:3000/api/og/png?name=测试&sign=白羊座" -o /tmp/test-og.png
   file /tmp/test-og.png   # 应显示 PNG 文件

注意：在 CI 或某些 Linux 环境，sharp 的二进制会自动下载；若失败请检查网络或在构建镜像中预装 libvips。

在 Vercel 部署
- Vercel 会自动处理大多数二进制依赖，部署时请在 Project Settings -> Environment Variables 填入上面的变量（NEXT_PUBLIC_BASE_URL, SENDGRID_API_KEY, STRIPE_* 等）。
- 如果你更愿意使用 Vercel 官方 OG image（satori），可以替换 app/api/og/png 实现为 satori + resvg pipeline（建议用于无 native 依赖场景）。

三、邮件（SendGrid）集成
1) 在 SendGrid Dashboard 创建 API Key（Restricted - Mail Send）。
2) 在 Vercel / 本地 .env.local 中添加 SENDGRID_API_KEY 和 SENDGRID_FROM。
3) 本地测试：
   - npm run dev
   - 在首页提交邮箱（EmailCapture 组件），检查 web/.data/subscribers.json
   - 如果已设置 SENDGRID_API_KEY，subscribe API 会尝试发送欢迎邮件（fire-and-forget）。

四、Stripe 测试流程
1) 在 Stripe Dashboard 创建测试产品/价格，记下 price ID。
2) 在 .env.local 设置 STRIPE_SECRET_KEY（测试 key）与 STRIPE_DEFAULT_PRICE_ID。
3) 在结果页点击 "购买完整版"（已加入 demo 脚本 public/checkout-demo.js），它会 POST /api/checkout 并跳转到 session.url。
4) Webhook：若需要后端接收支付回调并发放付费报告，部署 app/api/stripe/webhook.ts（目前项目中未自动创建；我可以按需实现）。

五、SEO 与 社媒
- sitemap: /sitemap.xml（app/sitemap.xml.js）会使用 NEXT_PUBLIC_BASE_URL 生成绝对 URL。提交到 Google Search Console。
- robots: public/robots.txt 已添加。
- OG: app/layout.tsx metadata 默认指向 /api/og/png（会返回 PNG 或 SVG）。用 Facebook/Twitter Card Validator 检查抓取。

六、性能 & Lighthouse
本地测试命令：
- npm run build
- npm run start
- npx lighthouse http://localhost:3000 --preset=desktop --output=json --output-path=./lighthouse-report.json --chrome-flags='--headless'

优先优化点（建议）
- Hero 图使用 next/image 并设置 width/height 与 priority
- 使用 next/font（已改造）避免阻塞渲染
- 懒加载非关键 JS（已对星空动画做 lazy load）
- 对大型第三方库做按需加载（例如 framer-motion）

七、清理缓存与重建
- 删除 OG 缓存： rm -rf .ogcache
- 清理构建文件： rm -rf .next node_modules && npm install

八、如何把真实密钥安全填入（建议）
- Vercel: Project -> Settings -> Environment Variables（在 Preview/Production 中分别设置）
- 本地: 在 web/.env.local（不要提交到 git）。示例 .env.local：

NEXT_PUBLIC_BASE_URL=http://localhost:3000
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM=noreply@yourdomain.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_DEFAULT_PRICE_ID=price_...

九、验证清单（部署后）
- [ ] 访问 / -> 页面渲染良好（无 500）
- [ ] 请求 /api/og/png?name=张三&sign=双子 返回 PNG（或 SVG）并具有 Cache-Control
- [ ] 在主页提交邮箱，web/.data/subscribers.json 增加条目；若配置 SendGrid，收到欢迎邮件
- [ ] 点击购买，Stripe checkout 跳转（若配置 Stripe）
- [ ] Lighthouse 报告（性能/SEO）达到期望（目标 Performance >= 0.9）

如需我替你在 Vercel 上完成部署并替你填写环境变量（需要你提供访问或临时密钥），我可直接操作并完成最终验证。