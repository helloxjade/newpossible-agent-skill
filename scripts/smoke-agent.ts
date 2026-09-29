import { readFile } from 'node:fs/promises';
import '../lib/config.mjs';
import { analyze } from '../lib/analysis.ts';

const sources = JSON.parse(await readFile(new URL('../data/sources.json', import.meta.url), 'utf8'));
const goal = {
  objective: '用 pandas 处理 500 万行设备日志，完成过滤与分组聚合',
  stack: 'Python、pandas、Docker；可使用 NVIDIA GPU',
  constraints: '结果必须一致；验证控制在 10 分钟内；不改动生产环境',
  desired: '判断是否有新技术能让当前数据处理热路径至少加速 1.2 倍'
};
const result = await analyze(goal, sources);

console.log(JSON.stringify({
  provider: result?.provider,
  providerLabel: result?.providerLabel,
  candidate: result?.sourceIds?.[0],
  agentPlan: result?.agentPlan,
  fallback: result?.provider === 'demo-rules'
}, null, 2));
