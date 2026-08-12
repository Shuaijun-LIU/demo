# Standup Log

- 2026-08-11 16:43 UTC — Initialized tracking.
- 2026-08-11 16:45 UTC
  - What: 完成六份剧本、28个Web/机器人仓库和本地替代benchmark的只读盘点；确认采用方案A；主模型锁定Franka Panda；采用共享运行时加六个场景模块。
  - Next: 确认总体架构与交互设计；写入设计规格并自检；规格获批后生成逐文件实现计划。

- 2026-08-11 17:00 UTC
  - What: 总体设计规格已写入并完成主审+独立审查；已补齐对象保管、多锚点、SimulationStateBridge、逐对象终态oracle、多臂必要性反事实、唯一超时语义、静态HTTP部署与测试追踪矩阵。
  - Next: 请用户最终审阅书面规格；确认后立即生成逐文件实现计划并进入测试驱动实现。

- 2026-08-12
  - What: 用户确认总体设计、Franka Panda 选型与直接开工；本机 mujoco-js 0.0.7 已成功编译四个带独立前缀的 Panda（36 qpos / 32 actuators）。
  - Decision: 多 Panda 采用原生 attach/prefix，不引入 XML 全量命名空间改写器。
  - Next: 完成四阶段实施计划、自检并提交；直接执行第一阶段共享运行时与 Demo 01。

- 2026-08-11 17:27 UTC
  - What: 四份实施计划共约 2000 行已落盘；完成必需头、占位符、代码围栏、类型一致性与核心规格覆盖自检。
  - Fixed: 统一 `ScenarioManifest.oracle`、`ScenarioDefinition.taskGraph`、`TaskRuntime.getEvents` 和六场稳定节点命名。
  - Decision: 依用户授权不再停下选择执行模式，直接使用 subagent-driven development。
  - Next: 提交计划里程碑；建立工程基线并按 TDD 交付 Demo 01。
- 2026-08-11 19:06 UTC
  - What: Foundation Task 1–3 已完成并经独立复审；Task 4 主动暂停在仅含三个 RED 测试、尚无生产实现的安全点；生成真实页面截图与静态投资人控制台视觉检查稿。
  - Next: 等待用户阶段反馈后，从 Task 4 RED 测试继续，再完成仿真桥、四 Panda 编译门和 Demo 01 纵切。
- 2026-08-11 19:31 UTC
  - What: 按视觉优先顺序交付 Demo 01 三臂场景 Alpha：三台本地 Franka MJCF、中央电子工位、P1–P5、检测/测试/分流工装、轨道相机和关节运动预览已在浏览器接通；Task 4 RED 测试完整归档到本地 WIP。
  - Next: 先收集用户对三臂空间构型的反馈，再把关节预览升级为 P1 抓取、交接、检测和分流动作。

- 2026-08-11 20:59 UTC
  - What: 用户确认保留 Line1 并新增 Line2/Line3 路线；完成 Line2 低饱和视觉系统、六套任务闭环、真实资产注册/许可/大小预算，以及 Line3 原生 MuJoCo 统一接口和六任务物理梯度规格。Demo05 按原剧本恢复为四臂。
  - Decision: 优先一次搭建六套 Line2 场景并输出截图，再接完整任务运行时；真实 GLB 与 MuJoCo 代理共享 canonical object ID。
  - Next: 用户短复核书面规格；随后生成逐文件计划并直接开始六场景搭建。

- 2026-08-11 21:42 UTC
  - What: Line2 六套独立 MJCF 工位全部完成；接入 8 类 RoboTwin2 真实 GLB、低饱和界面、协作/故障/恢复/oracle 信息和五阶段任务路径。Demo01/03/06 为三臂，Demo02/04/05 为四臂。
  - Verification: 60/60 单元测试、TypeScript、Vite build 通过；Playwright 在真实 Chromium 中逐套加载 MuJoCo，六场景、零 HTTP/控制台错误、Line1 保留回归全部通过。
  - Evidence: 六张 1600×1000 截图与一张总览图位于 `project/checkpoints/2026-08-12-line2-scenes/`。
  - Deployment: 个人 SSH 已推送 main；Actions run 31539783981 build/deploy success；公开 Demo01 完成 MuJoCo/WebGL 实载，六个 MJCF 与八个 GLB 均 HTTP 200。
  - Next: 用户检查公开 Line2 六场景与总览图；根据视觉反馈进入定点优化或 Phase 9 对象级连续动作。

- 2026-08-12
  - What: Line3 独立原生 MuJoCo 包完成；六个 3/4 Franka 任务全部具备连续专家动作、多臂阶段图、一次业务故障与恢复、typed oracle、Gymnasium 注册和精确状态恢复。
  - Physics: 使用 MuJoCo 3.6 真实 `mj_step`、关节位置执行器、碰撞分组、场景工装、任务对象 pose 与 16 维任务传感器；8 类 RoboTwin2 资产有来源、SHA、SI 物性和 drop/settle 验证。
  - Verification: 当前全量 Python 测试通过；每个任务 100/100 固定种子成功，总计 600/600；每个 accepted episode 恰好一次业务故障；所有机械臂禁用反事实失败。
  - Evidence: 六份专家 NPZ、六段 GPU/EGL 原生 MuJoCo MP4、逐回合矩阵 JSON、六张预览与总览图已归档。
  - Decision: 当前基线先锁定任务与数据接口；下一轮视觉重点是 Menagerie Franka mesh 与高保真任务接触，而不是推翻任务图。
  - Next: 完成最终干净环境验证、报告、提交与个人 GitHub SSH 推送；随后等待用户对原生视觉与场景布局的反馈。

- 2026-08-12
  - What: Line3 共享内核由紧凑兼容树升级为真实 MuJoCo Menagerie Franka Panda；六个运行时和六份展开式可移植 MJCF 均含原始视觉/碰撞网格、独立前缀和 EE site。
  - Physics: 修正 Panda 双指总开度与 0–255 tendon actuator 映射；工作件启用 MuJoCo 碰撞并随活动阶段连续运动；observation 输出逐臂原生接触力。
  - Verification: 聚焦环境/任务/恢复测试通过；六份导出模型单独编译通过；最终全量记录口径为 41/41；600 固定种子重新运行均成功，平均 real-time factor 12.02–14.05。
  - Evidence: 六份专家 NPZ、六段最终 Menagerie/EGL MP4、六张中段预览和 1920×960 总览图已重新生成。
  - Next: 用户先检查真实 Panda 六场布局与动作；随后按反馈升级任务物体 OBJ/STL 视觉网格及 Demo02/06 接触模型。
- 2026-08-12 03:39 UTC
  - What: Line3 release 5a98d14 pushed to Shuaijun-LIU/demo main via github-Shuaijun-LIU SSH; GitHub Pages Actions run 31560620866 succeeded; public Pages URL returns HTTP 200; remote main and local HEAD match.
  - Next: User reviews the six-scene contact sheet and native videos; next fidelity pass converts audited GLB visuals and strengthens Demo02/Demo06 contact models.
