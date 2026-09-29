import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import './lib/config.mjs';
import { analyze, matchesDemoGoal } from './lib/analysis.ts';
import { RemoteRunner } from './lib/proof.mjs';
import { proveGithubProject, proveHuggingFaceModel } from './lib/ecosystem-proof.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(root, 'public');
const runDir = join(root, 'work', 'runs');
const sources = JSON.parse(await readFile(join(root, 'data', 'sources.json'), 'utf8'));
const defaultGoal = {
  objective: '用 pandas 处理 500 万行设备日志，完成过滤与分组聚合',
  stack: 'Python、pandas、Docker；可使用 NVIDIA GPU',
  constraints: '结果必须一致；验证控制在 10 分钟内；不改动生产环境',
  desired: '判断是否有新技术能让当前数据处理热路径至少加速 1.2 倍',
  candidate: ''
};
const gpuRunnerUrl = process.env.GPU_RUNNER_URL || process.env.DGX_RUNNER_URL;
const radarSummary = sources.reduce((summary, source) => {
  summary.scanned += 1;
  summary[source.radarState === 'actionable' ? 'actionable' : source.radarState === 'watching' ? 'watching' : 'filtered'] += 1;
  return summary;
}, { scanned: 0, filtered: 0, watching: 0, actionable: 0 });
await mkdir(runDir, { recursive: true });

function json(response, code, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
  response.end(body);
}

async function requestJson(request) {
  let data = '';
  for await (const chunk of request) {
    data += chunk;
    if (data.length > 20000) throw new Error('输入超过 20 KB');
  }
  return JSON.parse(data || '{}');
}

function validateGoal(goal) {
  if (!goal || typeof goal !== 'object') throw new Error('请填写项目目标卡');
  const fields = ['objective', 'stack', 'constraints', 'desired'];
  for (const key of fields) {
    if (typeof goal[key] !== 'string' || !goal[key].trim() || goal[key].length > 300) throw new Error('项目目标卡四项均需填写，且每项不超过 300 字');
  }
  const validated = Object.fromEntries(fields.map(key => [key, goal[key].trim()]));
  if (goal.candidate !== undefined && (typeof goal.candidate !== 'string' || goal.candidate.length > 1000)) throw new Error('用户候选总长度不超过 1000 字');
  if ((goal.candidate || '').split(/\r?\n|；|;/).filter(item => item.trim()).length > 5) throw new Error('用户候选最多填写 5 项，每行一项');
  return { ...validated, candidate: goal.candidate?.trim() || '' };
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
      let experimentAvailable = false;
      if (gpuRunnerUrl) {
        try {
          const health = await fetch(new URL('/health', gpuRunnerUrl), { signal: AbortSignal.timeout(2000) });
          if (health.ok) {
            const status = await health.json();
            experimentAvailable = status.cudfExperimentAvailable === true;
          }
        } catch { /* The proof request will report the connection error. */ }
      }
      return json(response, 200, { sources, defaultGoal, radarSummary, harness: 'vercel-ai-sdk-dual-agent', skill: 'newpossible-tech-scout', provider: process.env.NIM_BASE_URL ? process.env.NIM_MODEL ? 'nvidia-nim' : 'nvidia-nim-incomplete' : process.env.STEPFUN_API_KEY ? 'stepfun' : 'demo-rules', runner: gpuRunnerUrl ? 'remote-gpu-host' : 'not-connected', experimentAvailable });
    }
    if (request.method === 'POST' && url.pathname === '/api/analyze') {
      const goal = validateGoal((await requestJson(request)).goal);
      const delta = await analyze(goal, sources);
      return json(response, 200, { goal, delta, message: delta ? null : '今天没有发现与该目标相关、且值得占用你注意力的可验证能力。' });
    }
    if (request.method === 'POST' && url.pathname === '/api/proof') {
      const body = await requestJson(request);
      const goal = validateGoal(body.goal);
      let evidence;
      if (body.deltaId === 'cudf-pandas-adoption-proof' && matchesDemoGoal(goal)) {
        if (!gpuRunnerUrl) return json(response, 409, { error: 'GPU runner 尚未连接；请配置 GPU_RUNNER_URL 后运行 cuDF 采用实验' });
        evidence = await new RemoteRunner(gpuRunnerUrl).runCudfExperiment();
      } else if (body.proofKind === 'github-project-readiness') {
        evidence = await proveGithubProject(body.sourceUrl);
      } else if (body.proofKind === 'huggingface-model-readiness') {
        evidence = await proveHuggingFaceModel(body.sourceUrl);
      } else {
        return json(response, 400, { error: '当前候选没有已登记的证据适配器' });
      }
      const passed = evidence.status === 'passed';
      const run = {
        id: randomUUID(), goal, deltaId: body.deltaId, dataset: evidence.kind || 'cudf-5m-groupby', evidence,
        sourceIds: body.deltaId === 'cudf-pandas-adoption-proof' ? ['accelerated-computing-cudf'] : [],
        recommendation: evidence.kind === 'github-project-readiness'
          ? passed ? 'PILOT：项目的许可证、维护状态和基础仓库条件明确，可以进入最小集成试点；功能质量仍需单独验证。' : 'WATCH：项目基础采用条件尚不完整，先补齐许可证或维护证据。'
          : evidence.kind === 'huggingface-model-readiness'
            ? passed ? 'PILOT：模型卡的许可、任务、加载框架和访问条件明确，可以进入小样本试用；尚未验证质量和性能。' : 'WATCH：模型采用前提不完整，暂不下载权重。'
            : evidence.status === 'passed'
              ? `ADOPT（GPU 常驻热路径）：结果一致，GPU 计算实测 ${evidence.metric.speedup}x 加速。当前传输耗时 ${evidence.metric.transferMs} ms；只有数据保持在 GPU 上或连续算子能够摊薄传输成本时才建议迁移，单次 CPU 来源任务仍应 WATCH。`
              : evidence.status === 'insufficient'
                ? `WATCH：结果一致，但 ${evidence.metric.speedup}x 加速未达到 1.2x 采用门槛。`
                : 'REJECT：CPU 与 GPU 结果不一致，不建议迁移当前负载。'
      };
      await writeFile(join(runDir, `${run.id}.json`), JSON.stringify(run, null, 2));
      return json(response, 200, run);
    }
    if (request.method !== 'GET') return json(response, 405, { error: '不支持的请求方法' });
    const file = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const path = resolve(publicDir, file);
    if (!path.startsWith(`${publicDir}/`) && path !== join(publicDir, 'index.html')) return json(response, 404, { error: '未找到页面' });
    const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' }[extname(path)] || 'application/octet-stream';
    const content = await readFile(path);
    response.writeHead(200, { 'Content-Type': `${mime}; charset=utf-8` });
    response.end(content);
  } catch (error) {
    json(response, error.code === 'ENOENT' ? 404 : 400, { error: error.message });
  }
});

const port = Number(process.env.PORT || 3210);
server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`NewPossible running at http://localhost:${server.address().port}`));
