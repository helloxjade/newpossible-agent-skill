# NewPossible Demo 视频提交稿

## 上传信息

**建议标题**

第三届 NVIDIA DGX Spark Hackathon｜NewPossible：让新技术先证明自己

**建议简介**

NewPossible 是以 `newpossible-tech-scout` Agent Skill 交付的技术采用决策 Agent。Vercel AI SDK 驱动 Scout Agent 和 Decision Agent：前者实时查询 NVIDIA Catalog、GitHub 或 Hugging Face，并接收用户指定候选；后者按统一规则只选择一个。StepFun `step-3.7-flash` 负责工具调用和结构化判断。演示在 NVIDIA DGX Spark / GB10 上运行 pandas CPU 与 RAPIDS cuDF GPU 的同输入对照实验，校验结果一致性并记录真实加速数据。

## 建议成片结构（约 3 分钟）

| 时间 | 画面 | 口播重点 |
|---|---|---|
| 0:00–0:20 | 标题、10→7→2→1 雷达 | 人没有精力持续追资讯，系统只呈现一项需要决定的能力。 |
| 0:20–0:50 | 目标卡与四个候选入口 | 展示 NVIDIA Catalog、GitHub、Hugging Face 和最多五个用户候选。 |
| 0:50–1:15 | Agent 飞行记录器 | Scout Agent 完成多源搜索，Decision Agent 五维评分后只选一个候选。 |
| 1:15–1:40 | Capability Delta 与 Proof Contract | 展示项目关联、固定基线、候选、输入、正确性和 1.2x 门槛。 |
| 1:40–2:25 | GX10 终端与页面实测 | 展示 runner、NVIDIA RAPIDS 容器、CPU/GPU 耗时、传输耗时和 parity。 |
| 2:25–2:45 | adopt/watch/reject 与证据 | 解释 3.33x 是 GPU 计算热路径指标；同时展示 350.71 ms 传输成本和适用边界。 |
| 2:45–3:00 | 仓库中的 Skill | 展示 `SKILL.md`、evals、Skill Card、Benchmark 和 README。 |

## 必拍证据

- 浏览器使用本地 HTTP 地址，页面显示 `GX10 EXPERIMENT READY`。
- 飞行记录器明确显示 Scout Agent、Decision Agent、实际公开来源及候选数量。
- GX10 终端显示真实 runner；页面显示 CPU、GPU、speedup、结果一致性和最终决定。
- 仓库能够看到 `skills/newpossible-tech-scout/SKILL.md`。
- 视频总时长不超过 5 分钟，终端与指标字号可读。

## 录制前

1. 提前拉取 RAPIDS 镜像并完整跑一次实验。
2. 重新同步最新代码，重启 GX10 runner 和 Mac Web 服务。
3. 关闭包含密码、API Key、个人通知和无关标签页的窗口。
4. 浏览器缩放到页面主要内容无需横向滚动。
5. 上传 B 站后使用无痕窗口验证视频 URL 可公开访问。

## 录制时不要展示

- `.env` 内容、StepFun API Key、服务器密码和 SSH 私钥。
- SSH 输入密码的过程。
- 旧版静态 `file://` 页面。
