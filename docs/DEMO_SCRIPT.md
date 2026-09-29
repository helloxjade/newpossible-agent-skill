# 90 秒比赛演示

## 录制前

GX10 启动 `npm run remote-runner`；Mac 保持 SSH 3211 端口转发并启动 `npm start`。页面应显示 `GX10 EXPERIMENT READY`。录制前先完整跑通一次，正式录制时刷新页面重新开始。

## 镜头与口播

| 时间 | 画面 | 口播 |
|---|---|---|
| 0–12 秒 | 首页标题和 10 → 7 → 2 → 1 雷达 | “我没有精力每天追技术新闻。NewPossible 只在一项变化值得决定时出现。” |
| 12–26 秒 | 目标卡和候选入口 | “我给出项目目标，也能指定关注的技术。Scout Agent 同时查 NVIDIA Catalog、GitHub 或 Hugging Face。” |
| 26–42 秒 | 飞行记录器 | “Scout 负责发现，Decision Agent 按相关性、能力增量、可行性、证据和验证成本只选一个。” |
| 42–58 秒 | Capability Delta 与 Proof Contract | “Skill 不相信宣传数字。这个证明固定 500 万行输入、正确性检查、三轮中位数和 1.2 倍门槛。” |
| 58–78 秒 | 点击 GX10 实验并展示指标 | “GX10 用 NVIDIA RAPIDS cuDF 对比 pandas。只有结果一致且实测达标，系统才建议采用。” |
| 78–90 秒 | 最终决定和 Skill 目录 | “结论和原始证据被保存。参赛交付是仓库中的 NewPossible Tech Scout Skill，Web 是它的可观测 Harness。” |

## 失败备用

如果正式录制时 GX10 连接中断，停止录制并恢复 runner 后重录。不要用模拟结果代替 GPU 指标。已经保存的 evidence 只能用于解释历史运行，不能冒充当前实验。

