# 悬空设备修复与炭灰主体背景设计

## 目标

修复食品装盒和岭南果品场景中缺失支撑结构的静态设备，并将三维主体背景调整为接近黑色的中性深灰；页面白色 UI、棋盘白线与模型照明保持不变。

## 根因与修复

- Demo 03 的 `scale_display` 底面为 `z=0.86`，称台顶面为 `z=0.765`，两者间存在 95 mm 无支撑间隙。增加 `scale_display_post`，连续接触称台顶面和显示器底面。
- Demo 06 的 `pitter_bridge` 与两个 `pitter_head` 相连，但横梁没有连接到底座。增加 `pitter_frame_post_left/right`，两根立柱从 `pitter_base` 顶面连续连接到横梁底面。
- 不移动食品、水果、纸盒或果核；它们已与传送带、桌面、料箱或料仓接触。

## 背景

- Three.js 背景、雾和视口容器底色统一改为近黑炭灰 `#252a2e`。
- 当前较深蓝色棋盘 `#456c8e / #7193ae`、白线、页面白灰 UI 和全部灯光保持不变。
- 不修改相机、机械臂姿态、物理地面或碰撞阈值。

## 验收

- 自动测试按 AABB 接触关系验证 `scale → post → display` 和 `pitter_base → posts → bridge → heads` 支撑链。
- 六份 MJCF 编译并通过 0.1 mm 静态穿透门。
- 六场景在真实 Chromium 中进入 MuJoCo ready；重点检查 Demo 03/06 无悬空设备且深灰背景下模型轮廓清楚。
