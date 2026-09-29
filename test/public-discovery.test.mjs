import test from 'node:test';
import assert from 'node:assert/strict';
import { searchPublicEcosystem } from '../lib/public-discovery.ts';

test('public project discovery returns traceable GitHub candidates', async () => {
  const fetcher = async url => {
    assert.match(url, /api\.github\.com\/search\/repositories/);
    return { ok: true, json: async () => ({ items: [{ full_name: 'acme/new-runtime', description: 'Fast runtime', html_url: 'https://github.com/acme/new-runtime', updated_at: '2026-09-29T00:00:00Z', stargazers_count: 42 }] }) };
  };
  const [candidate] = await searchPublicEcosystem('github', 'runtime', fetcher);
  assert.equal(candidate.id, 'github:acme/new-runtime');
  assert.equal(candidate.url, 'https://github.com/acme/new-runtime');
  assert.equal(candidate.signal, '42 stars');
});

test('public model discovery returns traceable Hugging Face candidates', async () => {
  const fetcher = async url => {
    assert.match(url, /huggingface\.co\/api\/models/);
    return { ok: true, json: async () => [{ id: 'acme/new-model', tags: ['text-generation'], downloads: 1200, lastModified: '2026-09-29T00:00:00Z' }] };
  };
  const [candidate] = await searchPublicEcosystem('huggingface', 'model', fetcher);
  assert.equal(candidate.id, 'huggingface:acme/new-model');
  assert.equal(candidate.url, 'https://huggingface.co/acme/new-model');
  assert.equal(candidate.signal, '1,200 downloads');
});
