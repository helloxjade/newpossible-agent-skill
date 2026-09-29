# GX10 比赛验证节点接入

GX10 是本次比赛提供的实验节点。参赛主体是 `newpossible-tech-scout` Skill；GX10 在 Demo 中执行 pandas CPU / cuDF GPU 对照，并产生 evidence.json。

## 已确认的设备条件

- NVIDIA GB10；
- Linux ARM64（`aarch64`）；
- 119 GiB 可见系统内存；
- CUDA 13；
- NVIDIA Container Toolkit 1.19；
- Docker GPU 容器可以读取 GB10。

## 在 GX10 启动 runner

先在电脑的本项目目录把代码复制到 GX10（将 `gx10-host` 换成实际登录地址）。本次 GX10 的 SSH 端口是 `6016`：

```bash
export GX10_LOGIN='asus_gx10@gx10-host'
rsync -av -e 'ssh -p 6016' --exclude=.git --exclude=.env --exclude=node_modules --exclude=work ./ "$GX10_LOGIN:~/nvidia-agent-skill/"
```

然后在 GX10 执行。`npm run` 必须在含有 `package.json` 的项目目录运行；在 `/home/asus_gx10` 等主目录直接运行会报 `ENOENT`。GPU runner 需要 Node.js 20+；若同时在 GX10 启动 Agent Web 服务，则需要 Node.js 22+ 并先运行 `npm install`：

```bash
cd ~/nvidia-agent-skill
test -f package.json && node --version
npm run remote-runner
```

runner 默认只监听 GX10 的 `127.0.0.1:3211`。它提供受控实验接口，本身不会在启动时运行 cuDF 测试；只有收到已注册的 `/run` 任务后才启动 Docker 实验。

另开一个 GX10 终端验证：

```bash
curl http://127.0.0.1:3211/health
```

响应中的 `cudfExperimentAvailable` 应为 `true`。这只证明 runner 正在运行，不代表 Docker 或 GPU 实验已经通过。

## 从电脑连接

在电脑保持 SSH 通道运行：

```bash
ssh -p 6016 -N -L 3211:127.0.0.1:3211 "$GX10_LOGIN"
```

`6016` 是 SSH 登录端口；`3211` 是 runner 在电脑和 GX10 两侧使用的端口。这里沿用上面设置的 `GX10_LOGIN`。

电脑项目的 `.env` 设置：

```env
GPU_RUNNER_URL=http://127.0.0.1:3211/run
```

`CUDF_EXPERIMENT_IMAGE` 和 `CUDF_BENCHMARK_ROWS` 由 GX10 上的 runner 读取，当前默认值分别是 `nvcr.io/nvidia/rapidsai/base:26.08-cuda13-py3.14` 和 `5000000`；只有改动实验配置时才需在 GX10 启动 runner 前设置。重启电脑上的 `npm start`。页面应显示 `GX10 EXPERIMENT READY`。

## 固定实验内容

`cudf-pandas-benchmark` 依次运行：

1. 拉取固定 NVIDIA RAPIDS 26.08 CUDA 13 容器；
2. 用固定随机种子生成 500 万行数据；
3. pandas CPU 运行三轮过滤与分组聚合；
4. cuDF GPU 运行相同负载；
5. 比对结果并计算中位耗时和加速比；
6. 返回 adopt、watch 或 reject 所需的原始证据。

实验只证明这一类数值过滤与分组聚合负载的采用价值。参赛交付是仓库中的固定 `newpossible-tech-scout` Skill；cuDF 是 Demo 案例，不会改变 Skill 的工作流。
