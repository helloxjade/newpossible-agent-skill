# 我们不缺技术资讯，缺的是一次可信的采用决定

## 用 DGX Spark 和 Agent Skills 构建 NewPossible

每天都有新模型、新框架和新开源项目出现。对开发者而言，真正昂贵的部分不是知道“又发布了什么”，而是判断它是否与当前项目相关、能否在现有环境运行、验证成本多高，以及一次漂亮的官方 benchmark 是否能转化为自己的能力提升。信息越多，这项判断越容易被推迟。

在第三届 NVIDIA DGX Spark Hackathon 中，我们开发了 NewPossible。它是一个低打扰技术能力雷达，也是一项可安装的 `newpossible-tech-scout` Agent Skill。它不会每天生成十条新闻，而是先读取项目目标、技术栈、约束和期望能力，再过滤可追溯的官方信号。只有一项变化同时满足“相关、可执行、值得验证”时，它才要求用户做决定。没有值得关注的变化，也是一种正确结果。

## 从新闻摘要转向 Capability Delta

NewPossible 的第一层创新是改变输出对象。普通资讯产品输出标题、摘要和链接，我们输出 Capability Delta：这项技术让当前项目新增了什么能力，以前为什么困难，现在为什么值得验证，最低成本的证明是什么。如果候选只是新、热门或带有 NVIDIA 标签，却不能改善用户的项目，它会被过滤掉。

模型在这里负责理解和选择，而不是控制执行。Scout Agent 使用 StepFun 生成一次 NVIDIA Catalog 与 GitHub 或 Hugging Face 的多源检索；Decision Agent 只读取压缩后的候选报告、本地信号和用户指定项，按五个维度选择唯一候选。两个角色通过类型安全工具交接，返回结果还会经过字段归一化和完整性校验；模型不可用时，系统明确回退到规则结果。这样既减少上下文噪音，也防止界面把一次失败请求包装成“AI 结论”。

## 用 Proof Contract 限制 Agent 的执行边界

仅靠模型认为某项技术“值得使用”还不够。NewPossible 在执行前生成 Proof Contract，固定基线、候选、输入、正确性指标、能力门槛、运行预算和回滚方式。GPU runner 只接受仓库中登记的任务名称，不会执行模型生成的 Shell，也不会把网页 README 中的指令当作授权。

比赛 Demo 选择 RAPIDS cuDF 作为完整案例。系统使用固定随机种子生成 500 万行数据，让 pandas CPU 和 cuDF GPU 完成同样的过滤与 4096 组聚合。两边各运行三轮并取中位数，先比较输出一致性，再计算包含数据传输成本的加速倍数。只有结果一致且加速达到 1.2 倍，系统才返回 adopt；结果一致但收益不足则是 watch；结果不一致则是 reject。

## DGX Spark 在项目中的实际作用

DGX Spark 不是展示页上的硬件标签，而是受控实验节点。电脑上的 Web Agent 通过 SSH 本地端口转发访问服务器的 runner；runner 在 NVIDIA Container Toolkit 中启动固定版本的 `rapidsai/base:26.08-cuda13-py3.14` 容器，并挂载只读实验脚本。容器提供 CUDA 13、Python 和 RAPIDS cuDF 环境，避免现场安装依赖造成版本漂移。

实验结束后，runner 返回 CPU/GPU 各轮耗时、数据传输时间、结果一致性和分组数量。主服务不直接相信 runner 的状态字段，而是重新校验结构并计算采用决定，随后保存 `evidence.json`。因此，GX10 证明的是一项具体工作负载上的真实能力，而不是“机器能看到 GPU”这种环境检查。

## Agent Skill 如何复用

参赛主体是 `newpossible-tech-scout` Skill，Web 页面只是它的可视化演示。Skill 本身不绑定 GX10，也不绑定 cuDF。它要求 Agent 按文档、API、CLI、本地 fixture、GPU 实验的成本顺序寻找最低有效证明。新候选不需要 GPU 时，系统不会为了展示硬件而强行使用 GPU。

Skill 包含触发边界、工具白名单、评分器、实验合同、输出合同、8 条正负评测用例、Skill Card 和 Benchmark。当前 SkillEvaluator 质量检查为 100/100、Grade A；SkillSpector 静态扫描结果为 SAFE、风险 0/100。真实 Tier 3 对照结果会在受支持的 provider 和 agent harness 中运行后记录，项目不会把静态结构检查写成模型能力提升。

## 我们做过的工程取舍

为了让比赛现场和后续复现更稳定，Web 与 API 使用轻量 Node.js 服务，Agent 依赖固定在 `package-lock.json`；GPU 镜像固定版本并提前拉取；CPU/GPU 使用同一输入；性能采用三轮中位数；远端只执行注册任务；`.env` 和运行记录与源码隔离。模型选择可以变化，但实验和安全边界不随模型变化。

我们最终希望解决的问题很朴素：技术更新不应该持续占用人的注意力。一个好的技术 Agent 应当先保持安静，在真正出现可验证的能力变化时，带着证据和一个明确决定回来。NewPossible 目前用 cuDF 展示这条链路，下一步可以把相同方法扩展到新的推理引擎、数据处理框架、模型服务和开发工具。

## 发布前补充

发布到 CSDN 或知乎前补充真实团队名称、成员分工、GX10 实测数字、项目仓库 URL、Demo 视频 URL 和一张真实实验截图。不要在文章中展示 API Key、服务器密码或可复用的 SSH 登录信息。
