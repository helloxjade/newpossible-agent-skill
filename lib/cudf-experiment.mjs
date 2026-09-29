import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const defaultImage = 'nvcr.io/nvidia/rapidsai/base:26.08-cuda13-py3.14';
const defaultScript = fileURLToPath(new URL('../experiments/cudf_benchmark.py', import.meta.url));

function parseResult(stdout) {
  for (const line of String(stdout).trim().split('\n').reverse()) {
    try {
      const value = JSON.parse(line);
      if (value && typeof value === 'object') return value;
    } catch { /* NGC images may print a banner before the JSON result. */ }
  }
  throw new Error('cuDF 实验未返回 JSON 结果');
}

export class CudfExperimentRunner {
  constructor(run = exec, image = process.env.CUDF_EXPERIMENT_IMAGE || defaultImage, script = defaultScript) {
    this.run = run;
    this.image = image;
    this.script = script;
  }

  async runProof() {
    const started = performance.now();
    let output;
    try {
      output = await this.run('docker', [
        'run', '--rm', '--gpus=all',
        '-e', `BENCHMARK_ROWS=${process.env.CUDF_BENCHMARK_ROWS || '5000000'}`,
        '-e', 'BENCHMARK_ROUNDS=3',
        '-v', `${this.script}:/workspace/cudf_benchmark.py:ro`,
        this.image, 'python', '/workspace/cudf_benchmark.py'
      ], { timeout: 1_200_000, maxBuffer: 4_000_000, encoding: 'utf8' });
    } catch (error) {
      throw new Error(`cuDF 实验执行失败：${error.stderr?.trim() || error.message}`);
    }

    const result = parseResult(output.stdout);
    const valid = Number.isFinite(result.cpuMs) && Number.isFinite(result.gpuMs) &&
      Number.isFinite(result.speedup) && Number.isInteger(result.rows) && result.rows >= 100_000 &&
      typeof result.parity === 'boolean';
    if (!valid) throw new Error('cuDF 实验结果字段无效');

    const parityPassed = result.parity === true;
    const speedPassed = result.speedup >= 1.2;
    return {
      status: parityPassed && speedPassed ? 'passed' : parityPassed ? 'insufficient' : 'failed',
      runner: 'nvidia-cudf-adoption-experiment',
      actualExecution: true,
      fixtureType: 'workload-benchmark',
      measuredAt: new Date().toISOString(),
      candidate: {
        id: 'accelerated-computing-cudf',
        name: 'NVIDIA cuDF',
        version: '26.08',
        image: this.image,
        workload: '数值过滤 + 4096 分组聚合'
      },
      metric: {
        rows: result.rows,
        rounds: result.rounds,
        cpuMs: result.cpuMs,
        gpuMs: result.gpuMs,
        transferMs: result.transferMs,
        speedup: result.speedup,
        groups: result.groups,
        durationMs: Math.round(performance.now() - started)
      },
      samples: [
        { check: '计算结果一致', expected: 'CPU/GPU parity', actual: parityPassed ? 'matched' : 'mismatch', passed: parityPassed },
        { check: '加速值得采用', expected: '>= 1.2x', actual: `${result.speedup}x`, passed: speedPassed }
      ],
      logs: [
        `${result.rows.toLocaleString()} rows / ${result.rounds} measured rounds`,
        `CPU median ${result.cpuMs} ms`,
        `GPU median ${result.gpuMs} ms / transfer ${result.transferMs} ms`,
        `Observed speedup ${result.speedup}x / parity ${parityPassed ? 'confirmed' : 'failed'}`
      ]
    };
  }
}
