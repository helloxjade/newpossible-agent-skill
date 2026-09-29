# NewPossible 比赛实现状态

## 目标

交付可安装的 `newpossible-tech-scout` Skill：它把多源技术信号压缩成一个候选，通过最低成本的受控证明给出 `adopt`、`watch` 或 `reject`。Web 是可观测的 Agent Harness，GX10 是 GPU 性能证据节点。

## 已完成架构

1. **Scout Agent**：根据项目目标查询 NVIDIA Catalog，并选择 GitHub 或 Hugging Face 作为公开生态来源。
2. **Decision Agent**：把侦察结果、本地信号和用户候选放入同一五维评分规则，只提交一个候选。
3. **Proof Contract**：在运行前固定基线、候选、输入、门槛和验证边界。
4. **Evidence Adapter**：只执行登记过的 cuDF、GitHub 或 Hugging Face 证据路径。
5. **Adoption Card**：保存原始观测并返回采用、观察或拒绝决定。

## 已完成工程项

- pandas CPU / cuDF GPU 固定对照负载，500 万行、三轮中位数、正确性校验和 1.2x 门槛。
- GX10 runner 只监听本机地址，只接受登记任务；主服务重新计算远端结论。
- GitHub 项目与 Hugging Face 模型的只读元数据核验，不下载或执行未知代码和权重。
- Vercel AI SDK 双 `ToolLoopAgent`、StepFun 工具调用、Zod 参数校验和显式 fallback。
- 固定 Skill、8 条 eval、评分脚本、Skill Card、Benchmark 和验证报告。
- 桌面与窄屏 Web 页面，展示多源搜索、角色交接、五维评分、Proof Contract 和证据。

## 最后验收

1. GX10 启动 `npm run remote-runner`。
2. Mac 建立 SSH 3211 本地端口转发。
3. Mac 启动 Agent Web 服务。
4. 页面跑通 pandas / cuDF 实验并记录真实指标。
5. 运行 `npm test`、`npm run typecheck`、`npm run validate:skill` 和 `npm run smoke:agent`。
6. 提交公开仓库、B 站视频、表单和团队资料。

