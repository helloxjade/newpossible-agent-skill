export class RemoteRunner {
  constructor(url) { this.url = url; }

  async request(body) {
    let response;
    try {
      response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Number(process.env.DGX_RUNNER_TIMEOUT_MS || 30000))
      });
    } catch (error) {
      throw new Error(`DGX runner 连接失败：${error.message}`);
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `远程 runner HTTP ${response.status}`);
    return result;
  }

  async runCudfExperiment() {
    const result = await this.request({ task: 'cudf-pandas-benchmark' });
    if (result.runner !== 'nvidia-cudf-adoption-experiment' || result.fixtureType !== 'workload-benchmark' ||
        !['passed', 'failed', 'insufficient'].includes(result.status) || !Array.isArray(result.samples) ||
        result.samples.length !== 2 || !result.metric || !result.candidate) {
      throw new Error('cuDF 采用证据格式无效');
    }
    const parity = result.samples.find(sample => sample.check === '计算结果一致')?.passed === true;
    const speedup = Number(result.metric.speedup);
    const speedPassed = Number.isFinite(speedup) && speedup >= 1.2;
    const status = parity && speedPassed ? 'passed' : parity ? 'insufficient' : 'failed';
    return { ...result, status, actualExecution: true };
  }
}

