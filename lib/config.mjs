import { readFile } from 'node:fs/promises';

let content = '';
try { content = await readFile(new URL('../.env', import.meta.url), 'utf8'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

for (const line of content.split(/\r?\n/)) {
  const match = line.match(/^(STEPFUN_API_KEY|STEPFUN_MODEL|STEPFUN_BASE_URL|NIM_BASE_URL|NIM_MODEL|NIM_API_KEY|GPU_RUNNER_URL|GPU_RUNNER_HOST|GPU_RUNNER_PORT|DGX_RUNNER_URL|DGX_RUNNER_HOST|DGX_RUNNER_PORT|DGX_RUNNER_TIMEOUT_MS|CUDF_EXPERIMENT_IMAGE|CUDF_BENCHMARK_ROWS)=(.*)$/);
  if (match) process.env[match[1]] ??= match[2].trim().replace(/^(["'])(.*)\1$/, '$2');
}
