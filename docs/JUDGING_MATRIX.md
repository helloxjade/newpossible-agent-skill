# 评审标准与证据对照

本表把比赛评审项映射到仓库中的可检查证据。未完成项保持“待完成”，不把计划写成成果。

| 评审项 | 项目实现 | 可检查证据 | 状态 |
|---|---|---|---|
| 实用性与行业价值 25% | 把资讯阅读转成项目相关的采用决定；无值得关注候选时保持安静 | README“项目说明”；Web 目标卡、Capability Delta、adopt/watch/reject | 已完成 |
| 技术创新性 | 四个候选入口、一次只选一个、Proof Contract、受控证据适配器 | `lib/analysis.ts`、`lib/ecosystem-proof.mjs`、`lib/proof.mjs` | 已完成 |
| DGX Spark 优势 | GPU 只在性能主张确实需要时启用；固定数据同时对比 pandas CPU 与 cuDF GPU | `remote-runner.js`、`lib/cudf-experiment.mjs`、`experiments/cudf_benchmark.py`、`docs/evidence/cudf-gx10-2026-09-29.json` | 真实 GX10 指标已完成 |
| 多智能体协作 | Scout Agent 负责多源发现，Decision Agent 读取压缩报告并进行五维评分与唯一选择 | `lib/analysis.ts`；页面 Agent 飞行记录器；真实 StepFun 冒烟结果 | 已完成 |
| 模型优化深度 | 角色分离、最小上下文、温度 0、Zod 工具参数、显式 fallback；不依赖微调 | README“大模型使用与优化”；`lib/analysis.ts` | 已完成 |
| Skills 设计与融合 | 固定 Skill 定义触发边界、评分、实验合同、输出合同和工具白名单 | `skills/newpossible-tech-scout/SKILL.md`、`references/`、`evals/` | 已完成 |
| 差异化方案 | 模型负责理解和选择，程序负责执行白名单、验证指标和重新计算结论 | `server.js`、`lib/proof.mjs`、Skill 安全边界 | 已完成 |
| 项目完整性 20% | Web、API、双 Agent、GPU runner、三类证据适配器、文档和测试 | 14 项测试、TypeScript 类型检查、Skill 校验 | 已完成 |
| 平台适配性 15% | CUDA 13、NVIDIA Container Toolkit、NGC RAPIDS cuDF 26.08、GX10/GB10；StepFun 3.7 | README 技术栈、`docs/GX10_SETUP.md`、固定 NGC 镜像、真实 evidence | 实测完成，视频待录 |
| 演示效果 10% | 目标卡 → 多源发现 → 唯一候选 → Proof Contract → GX10 实测 → 决定 | `docs/VIDEO_SUBMISSION.md`、`docs/DEMO_SCRIPT.md` | 脚本完成，视频待上传 |
| 赛事征文 5% | 完整开发实践文章公开发布在 GitHub | `docs/HACKATHON_ARTICLE.md` | 已完成 |

## 技术栈的真实边界

- 实际模型调用：StepFun `step-3.7-flash`。
- 实际 NVIDIA 栈：DGX Spark / GB10、CUDA 13、NVIDIA Container Toolkit、NGC RAPIDS cuDF。
- NVIDIA NIM 仅保留兼容接口；没有配置和运行时，不在 Demo 中宣称已经使用 NVIDIA 模型。
- GitHub 与 Hugging Face 适配器只证明候选具备进入试点的基础条件，不证明功能质量或生产性能。
- cuDF 结果只适用于演示中的过滤与分组聚合负载，不推广到全部 pandas 工作负载。

## 提交材料状态

- 公开代码仓库 URL：<https://github.com/helloxjade/newpossible-agent-skill>。
- B 站视频 URL：待录制并上传。
- 征文 URL：<https://github.com/helloxjade/newpossible-agent-skill/blob/main/docs/HACKATHON_ARTICLE.md>。
- 团队资料与合影：由参赛者后补。
