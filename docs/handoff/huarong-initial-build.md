# 华容道（huarong-pwa）初始开发 交接

- last_updated: 2026-10-26 01:30
- status: active
- version: v0.1.0

## 任务目标

DaoBox 家族新子应用（用户 2026-10-26 拍板方案 A）：**益智类「华容道」**，面向中老年 + 全年龄，国内优先上线，海外暂缓。

## 当前状态

✅ 国内站已上线：DNS + HTTPS + E2E 全通过。待办=daobox-home 首页入口（跨项目待用户确认）、海外暂缓。

## 最近完成

- 游戏本体两种模式：
  - **数字华容道**：3×3 / 4×4 / 5×5，从终局随机合法步打乱（必有解），点同行/同列块整段滑动（每格计 1 步），通关判定 + 最少步纪录分尺寸保存
  - **经典华容道**：横刀立马 / 指挥若定两个布局，点按=唯一方向自动滑 1 格，多方向弹方向盘（4s 自动消失），拖动按距离折算格数（≈56px/格），曹操到 (3,1) 底部中口判胜
- 棋子体系：曹操 2×2 红、关羽 2×1 绿、四将 1×2 竖、四卒 1×1；freeSteps/movableDirs 通用滑动判定
- 计时器：首步启动，通关停止；步数/用时/最少步 HUD
- 家族接入：DB_HOME 双域名适配、portal.js data-app="huarong"、daobox:timeexceeded 超时锁、联系邮箱运行时拼接、顶栏版本号+刷新按钮
- PWA：manifest + SW（dbyrd-v1）+ 木纹底红「曹」字图标（PIL 生成）
- worker：纯静态 ASSETS 托管 + wrangler.toml（huarong.daobox.app 备用，未部署）
- server：node-server.mjs 端口 8798
- 本地 E2E：数字 4x4 连点 3 步+棋盘完整性（15 块 1 空格）、3x3 差一步通关（横幅+新纪录+localStorage dbyrd-save）、5x5 渲染、经典模式点卒滑落/拖卒/点关羽下滑、布局切换、反复模式切换 0 报错

## 修复过的 bug（防复发）

1. `row[N-1]=0` 误写在行循环内 → 每行末位清零（4 个空格、丢 3 个数）→ 移到循环外只清 grid[N-1][N-1]
2. numericTap 方向符号写反（dir = c > blank.c ? -1 : 1）→ 越界崩溃 → 改为 1/-1 正向
3. renderClassic 切布局时棋子新建但节点数同为 10 不触发重建 → p.el undefined 崩溃 → 加 `pieces.some(p => !p.el)` 判断

## 待办

- [x] 国内部署：rsync → /opt/huarong-pwa、systemd huarong-pwa（8798，active）、Caddy（2026-10-26 01:18）
- [x] DNS：A 记录 huarong → 47.108.83.209（2026-10-26 01:17，浏览器操作阿里云控制台；注意「添加并继续」会重置线路选择，需重开弹窗填写）
- [x] 线上 E2E：全资源 200、证书签发、数字 4x4 真实点击 +1 步、经典 10 棋子渲染、portal 悬浮胶囊「剩9分」（2026-10-26 01:22）
- [x] daobox-home：娱乐区入口卡片上线（v1.4.8-audit，2026-10-26 01:40，实测首页点击→子应用→portal 胶囊全链路）；打卡名单同步 huarong；PILL_ANCHORS 走悬浮胶囊兜底（与 2048/消消乐一致）
- [ ] 手机实测 + 海外部署（暂缓）

## 重要决策

- 目录名 huarong-pwa、data-app="huarong"、端口 8798
- 益智娱乐类，不进 CHECKIN_APPS 打卡名单（与 2048/消消乐口径一致）
- 点按=滑 1 格（唯一方向自动滑），拖动=多格；经典布局先收录横刀立马+指挥若定，后续可加
- 打乱用「从终局随机走合法步」保证有解（不要用随机排列+奇偶校验）

## 注意事项

- SW 缓存键 dbyrd-v1；改前端资源记得同步升 ?v= 和 SW CACHE
- Playwright 测试时棋子交互必须派发 PointerEvent（pointerdown/up），el.click() 不触发拖动检测逻辑
- 本地测试 portal.js 会因当日游客时长耗尽弹锁，stub `window.DaoBox={timeExceeded:false}` 即可

## 相关文件

- public/{index.html,style.css,app.js,manifest.json,service-worker.js,icons/}
- server/node-server.mjs · worker/{src/index.js,wrangler.toml}
