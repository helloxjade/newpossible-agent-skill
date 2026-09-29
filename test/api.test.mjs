import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

test('offline API filters signals and requires a real experiment', async () => {
  const child = spawn(process.execPath, ['--import', 'tsx', 'server.js'], { cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: '0', STEPFUN_API_KEY: '', GPU_RUNNER_URL: '', DGX_RUNNER_URL: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let root;
  try {
    root = await new Promise((resolve, reject) => {
      let output = '';
      child.stdout.on('data', chunk => {
        output += chunk;
        const match = output.match(/http:\/\/localhost:(\d+)/);
        if (match) resolve(`http://localhost:${match[1]}`);
      });
      child.once('exit', code => reject(new Error(`server exited ${code}`)));
      setTimeout(() => reject(new Error('server start timeout')), 5000);
    });
    const boot = await (await fetch(`${root}/api/bootstrap`)).json();
    assert.equal(boot.sources.length, 10);
    assert.equal(boot.provider, 'demo-rules');
    assert.equal(boot.runner, 'not-connected');
    assert.deepEqual(boot.radarSummary, { scanned: 10, filtered: 7, watching: 2, actionable: 1 });
    const analysis = await (await fetch(`${root}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: boot.defaultGoal }) })).json();
    assert.equal(analysis.delta.id, 'cudf-pandas-adoption-proof');
    assert.equal(analysis.delta.provider, 'demo-rules');
    const unrelated = await (await fetch(`${root}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: { objective: '优化财务报表流程', stack: '电子表格', constraints: '仅财务数据', desired: '自动汇总报表' } }) })).json();
    assert.equal(unrelated.delta, null);
    const proofResponse = await fetch(`${root}/api/proof`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: boot.defaultGoal, deltaId: analysis.delta.id }) });
    assert.equal(proofResponse.status, 409);
  } finally { child.kill(); }
});
