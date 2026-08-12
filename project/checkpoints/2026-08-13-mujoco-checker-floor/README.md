# 2026-08-13 MuJoCo 棋盘地面检查点

本检查点对应六场景静态展厅的页首精简和地面视觉更新。

## 改动

- 删除 `FRANKA PANDA · STATIC WORKCELLS`、`多机械臂场景展示` 和全局说明文字。
- 六个场景使用相同的 7 m × 7 m 双蓝棋盘格，共 28 × 28 个方格。
- 每个方格边界叠加细白线；棋盘只属于 Three.js 显示层，不改变 MuJoCo 碰撞平面。
- 场景选择、当前场景说明、Franka 数量和静态轨道视角保持不变。

## 产物

- `demo01.png`–`demo06.png`：真实 Chromium 中等待 MuJoCo ready 后生成的 1600 × 1000 截图。
- `mujoco-checker-floor-contact-sheet.png`：六场景 3 × 2 总览。

## 验证

- 单元测试：52/52。
- 契约测试：6/6。
- 浏览器端到端：6/6。
- 六份 MJCF 均编译通过；静态前向检查未发现超过 0.1 mm 的穿透。
- GitHub Pages run `31620939411` 构建和部署成功；公网 Chromium 确认 MuJoCo ready、0 页面错误、0 请求失败。
