# 2026-08-13 支撑结构与炭灰背景检查点

本检查点修复 Demo 03 与 Demo 06 的悬空设备，并将三维主体背景改为近黑炭灰。

## 几何修复

- Demo 03：增加称重显示器立柱，使 `scale → scale_display_post → scale_display` 连续接触。
- Demo 06：增加去核机左右门架立柱，使 `pitter_base → posts → pitter_bridge → heads` 连续连接。
- 没有移动食品、水果、纸盒、果核、机械臂、桌面或现有任务工装。

## 视觉

- Three.js 背景、雾和视口底色统一为 `#252a2e`。
- 较深双蓝棋盘、白线、模型灯光和页面白色 UI 保持不变。
- `demo01.png`–`demo06.png` 为六张 1600 × 1000 MuJoCo ready 浏览器截图。
- `supported-fixtures-charcoal-contact-sheet.png` 为 2424 × 1016 的 3 × 2 总览。

## 验证

- 54/54 单元测试，包含两项实际 AABB 支撑链测试。
- 6/6 契约测试与 6/6 Chromium 端到端测试。
- 六份 MJCF 编译通过，未发现超过 0.1 mm 的初始穿透。
- GitHub Pages run `31623647208` 构建/部署成功；公网 Demo03/06 均 MuJoCo ready，三个新增支撑均出现在部署 XML 中，0 页面错误、0 请求失败。
