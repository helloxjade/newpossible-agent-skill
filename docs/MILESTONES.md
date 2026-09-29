# 比赛里程碑

## M1 · 低打扰产品主线（已完成）

- 项目目标卡成为持续过滤器。
- 首页显示扫描、忽略、观察和需要决定的数量。
- 原始来源降为可追溯依据。
- 验收：默认 10 条信号压缩为 1 条行动项。

## M2 · 候选技术受控实验（代码完成，待 GX10 联通）

- 固定 `cudf-pandas-benchmark` 任务。
- 检查 CPU/GPU 结果一致性、三轮中位耗时与实测加速。
- 主服务重新计算 adopt / watch / reject。
- 验收：GX10 返回当次真实指标，页面不接受 runner 伪造的通过状态。

## M3 · Skill 与演示（已完成本地部分）

- 完成实验后保存 evidence，并在公开仓库中提交固定的 `newpossible-tech-scout` Skill。
- 90 秒脚本切换到 Quiet Radar 叙事。
- 自动测试与桌面/移动浏览器 QA。
- 补齐 Skill Card、Apache-2.0、当前格式评测集、Benchmark 和验证报告。
- SkillEvaluator 质量 100/100；SkillSpector SAFE、0/100 风险、完整扫描。
- 验收：`npm test` 全通过；实际 GPU 证据、Tier 3 对照和最终录屏仍待真实环境完成。

## M4 · 比赛后扩展

- 增加新候选项目实验 manifest。
- 接入 GitHub Releases、官方 changelog 或用户提供 URL。
- 按材料 → Demo → API → CLI → GPU 的成本顺序路由。
- 增加静默周期和通知阈值。
