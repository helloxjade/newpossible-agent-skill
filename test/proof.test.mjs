import test from 'node:test';
import assert from 'node:assert/strict';
import { CudfExperimentRunner } from '../lib/cudf-experiment.mjs';

test('cuDF experiment produces an adoption decision from measured evidence', async () => {
  const fakeExec = async (name, args) => {
    assert.equal(name, 'docker');
    assert.ok(args.includes('--gpus=all'));
    assert.ok(args.includes('test-rapids-image'));
    return { stdout: 'container banner\n{"rows":5000000,"rounds":3,"cpuMs":240,"gpuMs":40,"transferMs":80,"speedup":6,"parity":true,"groups":4096}\n', stderr: '' };
  };
  const evidence = await new CudfExperimentRunner(fakeExec, 'test-rapids-image', '/tmp/benchmark.py').runProof();
  assert.equal(evidence.status, 'passed');
  assert.equal(evidence.metric.speedup, 6);
  assert.equal(evidence.samples[0].passed, true);
  assert.equal(evidence.runner, 'nvidia-cudf-adoption-experiment');
});
