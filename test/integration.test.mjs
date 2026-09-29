import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyze, parseUserCandidates } from '../lib/analysis.ts';
import { RemoteRunner } from '../lib/proof.mjs';

const sources = JSON.parse(await readFile(new URL('../data/sources.json', import.meta.url), 'utf8'));
const goal = { objective: '处理 500 万行设备日志并完成分组聚合', stack: 'Python、pandas、Docker、GX10', constraints: '优先最小实验', desired: '让数据处理热路径明显加速' };

test('user can submit up to five candidate technologies', () => {
  const candidates = parseUserCandidates('候选一\n候选二 https://example.com\n候选三\n候选四\n候选五\n候选六');
  assert.equal(candidates.length, 5);
  assert.deepEqual(candidates.map(item => item.id), ['user-1', 'user-2', 'user-3', 'user-4', 'user-5']);
});

test('a user-supplied candidate can be selected for a non-cuDF project without executing unknown code', async () => {
  const userGoal = { objective: '优化前端构建速度', stack: 'TypeScript、Vite', constraints: '不改变部署平台', desired: '缩短开发反馈时间', candidate: 'Bun 官方运行时 https://bun.sh' };
  const result = await analyze(userGoal, sources, async () => ({
    candidateId: 'user-1', candidateTitle: 'Bun 官方运行时', sourceUrl: 'https://bun.sh', action: 'watch',
    scores: { relevance: 2, delta: 2, feasibility: 2, evidence: 1, proofCost: 2 },
    before: '当前构建反馈较慢', now: '出现了可评估的新运行时', relation: '可能缩短本地反馈时间'
  }));
  assert.equal(result.agentPlan.source, 'user-input');
  assert.equal(result.agentPlan.action, 'watch');
  assert.equal(result.runnable, false);
});

test('an official GitHub candidate can use the registered read-only project adapter', async () => {
  const userGoal = { objective: '选择 TypeScript Agent 框架', stack: 'TypeScript、Node.js', constraints: '只读取官方元数据', desired: '判断是否具备试点条件', candidate: 'https://github.com/vercel/ai' };
  const result = await analyze(userGoal, sources, async () => ({
    candidateId: 'user-1', candidateTitle: 'Vercel AI SDK', sourceUrl: 'https://github.com/vercel/ai', action: 'prove',
    scores: { relevance: 3, delta: 2, feasibility: 3, evidence: 3, proofCost: 3 }, before: '尚未核验', now: '可以读取官方仓库元数据', relation: '适配当前 TypeScript Agent'
  }));
  assert.equal(result.runnable, true);
  assert.equal(result.proofKind, 'github-project-readiness');
  assert.equal(result.agentPlan.tool, 'github-project-readiness');
});

test('Agent loads the Skill, plans the registered proof and normalizes its capability schema', async () => {
  const originalKey = process.env.STEPFUN_API_KEY;
  process.env.STEPFUN_API_KEY = 'test-key';
  try {
    const result = await analyze(goal, sources, async context => {
      assert.equal(context.providerName, 'StepFun');
      assert.ok(context.sources.some(item => item.id === 'accelerated-computing-cudf'));
      return { candidateId: 'accelerated-computing-cudf', candidateTitle: 'NVIDIA cuDF', action: 'prove', scores: { relevance: 3, delta: 3, feasibility: 3, evidence: 2, proofCost: 3 }, before: '旧状态', now: '新线索', relation: '目标关联' };
    });
    assert.equal(result.provider, 'stepfun');
    assert.equal(result.before, '旧状态');
    assert.equal(result.now, '新线索');
    assert.equal(result.relation, '目标关联');
    assert.equal(result.agentPlan.skill, 'newpossible-tech-scout');
    assert.equal(result.agentPlan.action, 'prove');
    assert.deepEqual(result.sourceIds, ['accelerated-computing-cudf']);
  } finally {
    if (originalKey === undefined) delete process.env.STEPFUN_API_KEY;
    else process.env.STEPFUN_API_KEY = originalKey;
  }
});

test('StepFun incomplete output clearly falls back to demo analysis', async () => {
  const originalKey = process.env.STEPFUN_API_KEY;
  process.env.STEPFUN_API_KEY = 'test-key';
  try {
    const result = await analyze(goal, sources, async () => { throw new Error('模型输出未正常结束'); });
    assert.equal(result.provider, 'demo-rules');
    assert.match(result.providerLabel, /StepFun Agent 不可用：模型输出未正常结束/);
  } finally {
    if (originalKey === undefined) delete process.env.STEPFUN_API_KEY;
    else process.env.STEPFUN_API_KEY = originalKey;
  }
});

test('local NVIDIA NIM analyzes sources through its chat endpoint', async () => {
  const originalBaseUrl = process.env.NIM_BASE_URL;
  const originalModel = process.env.NIM_MODEL;
  process.env.NIM_BASE_URL = 'http://spark.test:8000/v1';
  process.env.NIM_MODEL = 'local-model';
  try {
    const result = await analyze(goal, sources, async context => {
      assert.equal(context.providerName, 'NVIDIA NIM');
      assert.equal(context.baseUrl, 'http://spark.test:8000/v1');
      return { candidateId: 'accelerated-computing-cudf', candidateTitle: 'NVIDIA cuDF', action: 'prove', scores: { relevance: 3, delta: 3, feasibility: 3, evidence: 2, proofCost: 3 }, before: '旧状态', now: '本地模型分析', relation: '目标关联' };
    });
    assert.equal(result.provider, 'nvidia-nim');
    assert.equal(result.now, '本地模型分析');
  } finally {
    if (originalBaseUrl === undefined) delete process.env.NIM_BASE_URL;
    else process.env.NIM_BASE_URL = originalBaseUrl;
    if (originalModel === undefined) delete process.env.NIM_MODEL;
    else process.env.NIM_MODEL = originalModel;
  }
});

test('cuDF adoption decision is recomputed from parity and observed speedup', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => {
      assert.deepEqual(JSON.parse(options.body), { task: 'cudf-pandas-benchmark' });
      return { ok: true, json: async () => ({
        status: 'passed', runner: 'nvidia-cudf-adoption-experiment', actualExecution: true,
        fixtureType: 'workload-benchmark', candidate: { id: 'accelerated-computing-cudf' },
        metric: { speedup: 0.9, cpuMs: 90, gpuMs: 100, rows: 5000000 },
        samples: [
          { check: '计算结果一致', expected: 'CPU/GPU parity', actual: 'matched', passed: true },
          { check: '加速值得采用', expected: '>= 1.2x', actual: '0.9x', passed: false }
        ]
      }) };
    };
    const result = await new RemoteRunner('http://spark.test/run').runCudfExperiment();
    assert.equal(result.status, 'insufficient');
  } finally { globalThis.fetch = originalFetch; }
});
