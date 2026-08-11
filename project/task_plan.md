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
- [x] Phase 6: 保留 Line1，确认低饱和 Line2 六场景与 Line3 原生 MuJoCo 演进设计
- [x] Phase 7: 用户确认 Line2/Line3 书面规格，生成逐文件实施计划
- [x] Phase 8: 搭建六套 Line2 场景与真实资产，输出可视化检查点
- [ ] Phase 9: 接通 Line2 对象级连续动作、故障恢复执行与运行时 oracle
- [ ] Phase 10: 编写并执行 Line3 原生 MuJoCo 六任务实施计划

## Status
- Initialized: 2026-08-11 16:43 UTC
- Current phase: Line2 本轮交付收束 / GitHub Pages 上线验收
- Completed this phase: Task 1 工程基线、Task 2 场景契约、Task 3 多臂协调原语
- Scene alpha: 已接通三台真实 Franka MJCF、中央工位、P1–P5、检测/测试/分流工装和关节运动预览
- Line1: 六套场景均已搭建并推送；作为版本基线保留
- Line2: 六套独立 MJCF、低饱和 UI、8 类真实 GLB、任务闭环证据和五阶段路径均已接通；Demo05 为四臂
- Line2 verification: 60 项单元测试、TypeScript、生产构建和 2 项真实 Chromium 验收通过；六张截图与总览图已落盘
- Line3: 原生 MuJoCo 统一接口、六任务物理梯度、资产工程、数据与验收计划已落盘；遵守本轮仅规划边界
- Deferred: Task 4 三个 RED 测试完整归档于本地 SDD WIP，待场景构型确认后恢复
- Review checkpoint: `project/checkpoints/2026-08-12-milestone/`
- Scene checkpoint: `project/checkpoints/2026-08-12-scene-alpha/`
- Line2 checkpoint: `project/checkpoints/2026-08-12-line2-scenes/`
- Blockers: 无；本地交付已完成，当前执行远端推送与 Pages 验收
