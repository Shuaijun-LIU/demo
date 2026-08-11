# Skill Routing

本文件只记录建议路由，不自动触发任何技能。

## 当前开发流程

1. `project-flow-manager`：持续记录目标、决策、里程碑、进展和产物。
2. `superpowers:brainstorming`：Line2/Line3 方案已确认并落盘；书面规格复核后退出。
3. `superpowers:writing-plans`：把复核通过的 Line2/Line3 规格转成逐文件、逐测试实施计划。
4. `superpowers:test-driven-development`：每项运行时能力和场景先写失败测试。
5. `superpowers:subagent-driven-development`：按互不冲突的计划任务并行实现。
6. `gitnexus-code-intelligence`：索引新仓库并分析共享运行时结构、调用链和改动影响。
7. `superpowers:systematic-debugging`：任何失败或异常先定位根因再修复。
8. `superpowers:verification-before-completion`：每个里程碑和最终交付前执行证据化验证。

## 按需能力

- 场景纹理、标签或本地资产缺失的透明物体素材：`imagegen`；优先复用许可明确的 RoboTwin2 实物资产。
- 架构图或流程图：`drawio-diagramming`。
- GitHub 远端、分支、提交发布或 PR：仅在用户要求时使用 `github-repo-coordinator`。
- 如果后续接入真实模型权重：`hf-model-localizer`。

## 当前不使用

- 首版不需要论文写作、文献包、训练实验或数据 EDA 类技能。
- 首版不把在线 LLM/VLA、模型下载或 GPU 训练设为运行依赖。
