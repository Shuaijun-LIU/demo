# Task Plan

## Goal
- 在 `3.our-demo/demo1-6` 构建一个可静态部署的投资人展示型 Web 应用，统一承载六个三臂/四臂协作场景。
- 六个场景均需具备可运行的多臂动作、任务状态、异常闭环、结果验收、暂停/复位和回放。
- 主视觉与运动学模板统一采用 Franka Panda，并保留未来替换机械臂品牌/型号的接口。
- 首版以稳定、确定性的事件驱动编排为主，只在收益明确的接触环节选择性启用 MuJoCo。

## Phases
- [x] Phase 1: 盘点剧本、本地 Web/MuJoCo 仓库、模型资产和替代 benchmark
- [x] Phase 2: 确认交付路线、共享架构和 Franka 选型
- [ ] Phase 3: 写入并审查设计规格与逐文件实现计划（规格已写入并自检，等待用户审阅）
- [ ] Phase 4: 建立共享运行时并实现 Demo 01–06
- [ ] Phase 5: 视觉精修、性能与兼容性测试、静态部署和演示资料

## Status
- Initialized: 2026-08-11 16:43 UTC
- Current phase: Phase 3 — 设计规格与实现计划
- Blockers: 无；等待书面规格最终审阅
