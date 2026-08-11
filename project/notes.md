# Notes

## Context
- 剧本目录：`../多机械臂Demo场景剧本_投资人展示版_2026-08/`。
- 目标目录初始化前为空，没有既有应用代码、模型副本或构建配置。
- 六个场景覆盖精密电子、汽车线束、食品包装、大构件装配、智能药房和岭南果品。

## Local resources
- Web/MuJoCo 总览：`../../README.md`
- 模型索引：`../../MODEL_ASSETS.md`
- 推荐运行库：`../../1.source-repos/noah-wardlow__mujoco-react/`
- Franka 模型：`../../1.source-repos/google-deepmind__mujoco_menagerie/franka_emika_panda/`
- 多臂结构参考：`../../1.source-repos/google-deepmind__mujoco_menagerie/aloha/`
- 替代 benchmark：RoboSuite 双臂项目和 RoboTwin2 可作为后续轨迹或真实性参考，不作为首版 Web 运行依赖。

## Findings
- `mujoco-react` 为 Apache-2.0，可复用模型加载、IK、接触/传感器、轨迹和状态快照能力。
- `mujoco-react-example` 技术参考价值高，但仓库本身缺少 LICENSE，不直接复制代码。
- Franka Menagerie 模型为 Apache-2.0，具备成熟视觉网格、碰撞体、7 自由度和夹爪。
- ALOHA 模型展示了双运动树命名空间化，可作为生成三/四臂 Franka MJCF 的结构参考。
- 六场景共享“选择场景→检查初态→启动→事件推进→异常恢复→结果确认→复位”用户旅程。
- 首版线束采用约束控制点驱动的可变形样条，不把真实柔性体动力学设为交付前置条件。

## Line2 / Line3 resource findings
- 本地 RoboTwin2 对象库位于 `/data/shared/user2/datasets/robotwin2_assets/assets/objects/`，对象 README 标注 MIT；共享目录只读，选定资产复制并优化后进入项目。
- 已确认候选对象覆盖苹果/水果、药瓶、托盘、扫码器、电子秤、电池、包装盒、板材、螺丝刀、电钻与锤子，可支撑 Demo01/03/04/05/06 的第一轮真实感升级。
- Demo02 的线束和卡扣需以程序化模型为主；NIST 制造任务板 CAD 只作为许可核验后的 Line3/后续候选。
- Google Scanned Objects 可作为 CC BY 4.0 的外部实物候选，但 Line2 优先复用本地资产，控制下载和页面体积。
- Line2 每个视觉资产绑定 canonical object ID；Line3 为视觉网格另建凸分解或 primitive 碰撞、质量、惯量和摩擦参数。
