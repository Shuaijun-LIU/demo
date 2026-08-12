# Task Plan

## Goal
- 在 `3.our-demo/demo1-6` 维护一个可由 GitHub Pages 静态部署的六场景 Web 展厅。
- 产品只用于检查三臂/四臂 Franka Panda 工位的空间构型，不再提供动作播放、任务状态或版本切换。
- 页面和三维环境使用白、灰白、浅灰与少量低饱和工业色。
- 六场景初始姿态必须可编译、可在真实浏览器加载，并通过自动接触检查和人工截图复核。

## Phases
- [x] Phase 1: 盘点剧本、本地 Web/MuJoCo 仓库、模型资产和替代 benchmark
- [x] Phase 2: 确认交付路线、共享架构和 Franka 选型
- [x] Phase 3: 写入、审查并确认总体设计规格
- [x] Phase 3.5: 生成四份逐文件、逐测试的实施计划并完成自检
- [x] Phase 4: 早期动作运行时路线已由后续静态展厅范围取代
- [x] Phase 5: 六场景基础视觉、兼容性测试与静态部署基线完成
- [x] Phase 6: 保留 Line1，确认低饱和 Line2 六场景与 Line3 原生 MuJoCo 演进设计
- [x] Phase 7: 用户确认 Line2/Line3 书面规格，生成逐文件实施计划
- [x] Phase 8: 搭建六套 Line2 场景与真实资产，输出可视化检查点
- [x] Phase 9: Line2 产品路线终止；对应前端代码、场景和资产已删除
- [x] Phase 10: Line3 原生 MuJoCo 六任务失败原型已停止（人工视频验收拒绝，不再修复）
- [x] Phase 11: 合并为单版本明亮静态展厅，删除播放运行时并完成六场景几何复核
- [x] Phase 12: 完成全量回归、推送 main 并确认 GitHub Pages 部署
- [x] Phase 13: 删除全局页首并将六场景统一改为双蓝棋盘格 + 白线地面
- [x] Phase 14: 压深三维主体背景与两种棋盘蓝，保持白色 UI 和模型照明
- [x] Phase 15: 修复 Demo03/06 悬空设备并将主体背景改为近黑炭灰

## Status
- Initialized: 2026-08-11 16:43 UTC
- Current phase: 已完成 — 等待用户检查 Demo03/06 支撑结构与近黑背景版本
- Current product: 单版本静态展厅；无全局页首，六个场景共享近黑炭灰主体背景、较深双蓝棋盘格与白线；Demo03/06 悬空设备已补齐连续支撑；可切换、拖动旋转和滚轮缩放，无播放功能。
- Scene verification: 六个 MJCF 编译通过；网页实际 Panda 初始控制排列已修正为每臂 7 关节 + 1 夹爪；`mj_forward` 未发现超过 0.1 mm 的初始穿透。
- Visual verification: 支撑修复版六张 1600×1000 截图及总览已完成原分辨率检查；Demo03 显示器立柱和 Demo06 双门架可见，炭灰背景下 Franka/工装轮廓清楚。
- Pages asset verification: Panda 外观碎片已按刚体无损合并为约 2.4 MB MSH，模型依赖由 67 个降为 22 个，消除公网探针捕获的 HTTP/2 并发加载失败。
- Product cleanup: 旧 Line2 前端运行代码、专属场景与 GLB 资产已删除；历史文档和旧检查点仅作为过程记录保留，不进入产品构建。
- Line3 user acceptance: **FAILED / ABANDONED**。视频中机械臂基本无任务动作，物体自行移动且存在穿模；当前结果不可用。
- Line3 automated checks: 41/41 与 600/600 仅说明内部代码路径和自定义 oracle 可结束，不能证明机械臂运动或物理任务成立，不再作为完成证据。
- Line3 disposition: 现有代码、NPZ、报告和视频只保留为失败原型记录；除非用户明确重启，否则禁止继续修复或扩展。
- Line3 checkpoint: `project/checkpoints/2026-08-12-line3-native/`
- Review checkpoint: `project/checkpoints/2026-08-12-milestone/`
- Scene checkpoint: `project/checkpoints/2026-08-12-scene-alpha/`
- Final static checkpoint: `project/checkpoints/2026-08-12-static-showroom/`
- Deployment target: `https://shuaijun-liu.github.io/demo/?scene=demo01`
- Deployment verification: Actions run `31623647208` build/deploy success；公开 Demo03/06 XML 含三个新增支撑，视口底色 `rgb(37, 42, 46)`，MuJoCo ready、0 error / 0 request failure。
- Blockers: 无。
