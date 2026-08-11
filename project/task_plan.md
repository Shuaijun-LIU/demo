# Task Plan

## Goal
- 在 `3.our-demo/demo1-6` 构建一个可静态部署的投资人展示型 Web 应用，统一承载六个三臂/四臂协作场景。
- 六个场景均需具备可运行的多臂动作、任务状态、异常闭环、结果验收、暂停/复位和回放。
- 主视觉与运动学模板统一采用 Franka Panda，并保留未来替换机械臂品牌/型号的接口。
- 首版以稳定、确定性的事件驱动编排为主，只在收益明确的接触环节选择性启用 MuJoCo。

## Phases
- [x] Phase 1: 盘点剧本、本地 Web/MuJoCo 仓库、模型资产和替代 benchmark
- [x] Phase 2: 确认交付路线、共享架构和 Franka 选型
- [x] Phase 3: 写入、审查并确认总体设计规格
- [x] Phase 3.5: 生成四份逐文件、逐测试的实施计划并完成自检
- [ ] Phase 4: 建立共享运行时并实现 Demo 01–06（Foundation Task 1–3 已完成，Task 4 暂停在 RED 检查点）
- [ ] Phase 5: 视觉精修、性能与兼容性测试、静态部署和演示资料

## Status
- Initialized: 2026-08-11 16:43 UTC
- Current phase: Phase 4 / Foundation Task 4 — TaskRuntime（应用户要求暂停，等待阶段视觉反馈）
- Completed this phase: Task 1 工程基线、Task 2 场景契约、Task 3 多臂协调原语
- Review checkpoint: `project/checkpoints/2026-08-12-milestone/`
- Blockers: 无
