import test from 'node:test';
import assert from 'node:assert/strict';
import { proveGithubProject, proveHuggingFaceModel } from '../lib/ecosystem-proof.mjs';

test('GitHub adapter proves project readiness without executing repository code', async () => {
  const evidence = await proveGithubProject('https://github.com/acme/runtime', async url => {
    const bodies = {
      'https://github.com/acme/runtime': '<html>repository</html>',
      'https://raw.githubusercontent.com/acme/runtime/HEAD/LICENSE': 'MIT License',
      'https://raw.githubusercontent.com/acme/runtime/HEAD/README.md': '# Runtime',
      'https://github.com/acme/runtime/commits/HEAD.atom': `<feed><updated>${new Date().toISOString()}</updated></feed>`
    };
    return { ok: url in bodies, text: async () => bodies[url] || '' };
  });
  assert.equal(evidence.status, 'passed');
  assert.equal(evidence.kind, 'github-project-readiness');
  assert.ok(evidence.samples.every(sample => sample.passed));
});

test('Hugging Face adapter stops at model-card readiness', async () => {
  const evidence = await proveHuggingFaceModel('https://huggingface.co/acme/model', async url => {
    assert.equal(url, 'https://huggingface.co/api/models/acme/model');
    return { ok: true, json: async () => ({ id: 'acme/model', tags: ['text-generation'], cardData: { license: 'apache-2.0' }, pipeline_tag: 'text-generation', library_name: 'transformers', private: false, gated: false, lastModified: new Date().toISOString(), downloads: 1000, likes: 10 }) };
  });
  assert.equal(evidence.status, 'passed');
  assert.equal(evidence.kind, 'huggingface-model-readiness');
  assert.equal(evidence.metric.library, 'transformers');
});

test('metadata adapters reject non-official hosts', async () => {
  await assert.rejects(proveGithubProject('https://example.com/acme/runtime'), /只允许核验 github.com/);
  await assert.rejects(proveHuggingFaceModel('https://example.com/acme/model'), /只允许核验 huggingface.co/);
});
