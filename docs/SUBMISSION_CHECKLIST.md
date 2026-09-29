# 参赛交付清单

## 仓库内已经完成

- [x] 通用 `newpossible-tech-scout` Skill，不绑定 GX10 或单一 GPU 型号。
- [x] `SKILL.md` 包含触发边界、候选评分、最小验证流程、工具白名单和输出合同。
- [x] Scout Agent 与 Decision Agent 顺序协作，共享同一个 Skill 和结构化交接数据。
- [x] 多源候选发现：NVIDIA Catalog、GitHub、Hugging Face、本地信号和最多五个用户候选。
- [x] 三种受控证据路径：GX10 cuDF 性能实测、GitHub 项目元数据、Hugging Face 模型卡。
- [x] StepFun `step-3.7-flash` 真实工具调用冒烟测试，结果必须为 `fallback=false`。
- [x] agentskills.io 格式评测集：8 条用例，含 5 条正向或安全用例和 3 条负向用例。
- [x] Skill Card、Apache-2.0 许可、Benchmark 和验证报告。
- [x] 14 项 Web/API/Agent/runner 回归测试、TypeScript 类型检查和 Skill 校验。
- [x] README 超过 500 字，包含亮点、架构、部署、模型优化、Agent Skills 和技术栈。
- [x] 评审标准对照表、Demo 视频脚本、表单准备单和参赛征文。

## 提交前必须完成

- [x] 在 GX10 运行 `cudf-pandas-benchmark`：结果一致，GPU 计算热路径 3.33x，原始证据已保存到 `docs/evidence/`。
- [ ] 正式录屏时从页面再运行一次，并确认指标与仓库证据处于同一数量级。
- [x] 完整项目已推送到公开 GitHub：<https://github.com/helloxjade/newpossible-agent-skill>。
- [ ] 按 [VIDEO_SUBMISSION.md](VIDEO_SUBMISSION.md) 录制不超过 5 分钟的演示，上传 B 站并检查公开视频 URL。
- [ ] 填写并复核 [比赛提交表单准备单](SUBMISSION_FORM.md)，最后提交线上表单。

## 由参赛者后补

- [ ] 团队名称、真实成员姓名和所在地。
- [ ] 团队合影，20MB 以内。
- [ ] （可选加分）发布 CSDN 或知乎征文，并填写公开 URL。

## 可选评测，不阻塞基础提交

- [ ] 有 NVIDIA Build 或 OpenAI 评测 provider 时再执行 SkillEvaluator Tier 2/3。
- [ ] 本机安装 Gitleaks 后可补跑完整 Tier 1 密钥扫描。

比赛提交要求没有要求从页面导出 ZIP 或自行生成签名。固定 Skill 直接随公开仓库提交，真实运行证据通过页面、视频和 `work/runs` 本地记录展示。
