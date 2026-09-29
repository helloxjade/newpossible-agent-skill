import http from 'node:http';
import { CudfExperimentRunner } from './lib/cudf-experiment.mjs';
import './lib/config.mjs';

const runnerName = 'nvidia-gpu-controlled-runner';

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 256_000) throw new Error('请求超过 256 KB');
  }
  return JSON.parse(body || '{}');
}

function json(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  response.end(body);
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (request.method === 'GET' && url.pathname === '/health') {
      return json(response, 200, { status: 'ok', runner: runnerName, cudfExperimentAvailable: true });
    }
    if (request.method !== 'POST' || url.pathname !== '/run') {
      return json(response, 404, { error: '未找到 runner 接口' });
    }

    const body = await readJson(request);
    if (body.task === 'cudf-pandas-benchmark') {
      return json(response, 200, await new CudfExperimentRunner().runProof());
    }
    return json(response, 400, { error: 'runner 只接受预定义的 GPU 实验任务' });
  } catch (error) {
    return json(response, 400, { error: error.message });
  }
});

const host = process.env.GPU_RUNNER_HOST || process.env.DGX_RUNNER_HOST || '127.0.0.1';
const port = Number(process.env.GPU_RUNNER_PORT || process.env.DGX_RUNNER_PORT || 3211);
server.listen(port, host, () => console.log(`${runnerName} listening at http://${host}:${server.address().port}`));
