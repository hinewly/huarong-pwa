# huarong-pwa（华容道）

DaoBox 家族子应用，**益智类**华容道游戏（中老年 + 全年龄）。

- 国内站：https://huarong.daobox.net.cn
- 海外站：huarong.daobox.app（worker 配置已备好，暂缓部署）
- 统一账号 / 时长体系：portal.js（游客 30 分钟/天、注册 60 分钟/天）

## 玩法

- **数字华容道**：3×3 / 4×4 / 5×5，点击与空格同行/同列的数字块整段滑动，排好顺序过关（随机合法步打乱，必有解）。
- **经典华容道**：横刀立马 / 指挥若定两个布局，点按或拖动棋子，把曹操移到底部出口即胜。
- 最少步纪录按模式/尺寸/布局分别保存。

## 结构

```
huarong-pwa/
├── public/         # 前端（index/style/app/manifest/sw/icons）
├── worker/         # Cloudflare Worker（海外：纯静态 ASSETS 托管，暂缓部署）
├── server/         # 国内阿里云 Node 静态服务器（端口 8798）
└── docs/handoff/   # 交接文档
```

## 部署

- 国内：`rsync -a --delete --exclude node_modules --exclude data --exclude .env public server root@47.108.83.209:/opt/huarong-pwa/ && ssh root@47.108.83.209 'systemctl restart huarong-pwa'`
- 海外（暂缓）：`wrangler deploy`
