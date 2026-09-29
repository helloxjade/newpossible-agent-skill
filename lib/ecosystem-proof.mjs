function daysSince(value) {
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000)) : null;
}

async function getJson(url, fetcher) {
  const response = await fetcher(url, {
    headers: { Accept: 'application/vnd.github+json, application/json', 'User-Agent': 'newpossible-tech-scout' },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`候选证据接口返回 HTTP ${response.status}`);
  return response.json();
}

async function getText(url, fetcher, optional = false) {
  const response = await fetcher(url, { headers: { Accept: 'text/html, text/plain, application/atom+xml', 'User-Agent': 'newpossible-tech-scout' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    if (optional) return '';
    throw new Error(`候选证据接口返回 HTTP ${response.status}`);
  }
  return response.text();
}

function detectLicense(text) {
  if (/MIT License/i.test(text)) return 'MIT';
  if (/Apache License[\s\S]{0,80}Version 2/i.test(text)) return 'Apache-2.0';
  if (/BSD 3-Clause|Redistribution and use in source and binary forms/i.test(text)) return 'BSD';
  if (/GNU GENERAL PUBLIC LICENSE[\s\S]{0,80}Version 3/i.test(text)) return 'GPL-3.0';
  if (/Mozilla Public License[\s\S]{0,80}2\.0/i.test(text)) return 'MPL-2.0';
  return text.trim() ? 'PRESENT' : 'UNKNOWN';
}

function parseCandidateUrl(sourceUrl, expectedHost) {
  const url = new URL(sourceUrl);
  if (url.protocol !== 'https:' || url.hostname !== expectedHost) throw new Error(`只允许核验 ${expectedHost} 官方页面`);
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2) throw new Error('候选链接缺少项目或模型标识');
  return parts.slice(0, 2);
}

export async function proveGithubProject(sourceUrl, fetcher = fetch) {
  const [owner, repo] = parseCandidateUrl(sourceUrl, 'github.com');
  const root = `https://github.com/${owner}/${repo}`;
  const raw = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD`;
  const [page, licenseText, readme, commits] = await Promise.all([
    getText(root, fetcher),
    getText(`${raw}/LICENSE`, fetcher, true).then(value => value || getText(`${raw}/LICENSE.md`, fetcher, true)),
    getText(`${raw}/README.md`, fetcher, true),
    getText(`${root}/commits/HEAD.atom`, fetcher, true)
  ]);
  const updated = commits.match(/<updated>([^<]+)<\/updated>/)?.[1];
  const updatedDays = daysSince(updated);
  const license = detectLicense(licenseText);
  const samples = [
    { check: '许可证明确', expected: 'SPDX license', actual: license, passed: !['UNKNOWN', 'NOASSERTION'].includes(license) },
    { check: '官方仓库可访问', expected: 'github.com repository', actual: page ? 'accessible' : 'unavailable', passed: Boolean(page) },
    { check: '近期仍在维护', expected: 'updated within 365 days', actual: updatedDays === null ? 'unknown' : `${updatedDays} days`, passed: updatedDays !== null && updatedDays <= 365 },
    { check: '项目说明存在', expected: 'README', actual: readme ? 'present' : 'missing', passed: Boolean(readme) }
  ];
  const passed = samples.every(sample => sample.passed);
  return {
    kind: 'github-project-readiness', status: passed ? 'passed' : 'insufficient', runner: 'github-metadata-proof', actualExecution: true,
    fixtureType: 'official-project-metadata', measuredAt: new Date().toISOString(),
    candidate: { id: `${owner}/${repo}`, name: `${owner}/${repo}`, url: root },
    metric: { updatedDays, license, officialFiles: [licenseText && 'LICENSE', readme && 'README', commits && 'COMMITS'].filter(Boolean).length },
    samples,
    logs: [`GitHub repository ${owner}/${repo}`, `License ${license} / updated ${updatedDays ?? 'unknown'} days ago`, 'Read-only evidence: repository page, LICENSE, README and commits feed']
  };
}

export async function proveHuggingFaceModel(sourceUrl, fetcher = fetch) {
  const [owner, model] = parseCandidateUrl(sourceUrl, 'huggingface.co');
  const id = `${owner}/${model}`;
  const data = await getJson(`https://huggingface.co/api/models/${encodeURIComponent(owner)}/${encodeURIComponent(model)}`, fetcher);
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const license = data.cardData?.license || tags.find(tag => String(tag).startsWith('license:'))?.slice(8) || 'UNKNOWN';
  const task = data.pipeline_tag || 'UNKNOWN';
  const library = data.library_name || 'UNKNOWN';
  const updatedDays = daysSince(data.lastModified);
  const accessible = data.private !== true && data.gated !== true && data.gated !== 'manual';
  const samples = [
    { check: '许可证明确', expected: 'model card license', actual: license, passed: license !== 'UNKNOWN' },
    { check: '任务类型明确', expected: 'pipeline tag', actual: task, passed: task !== 'UNKNOWN' },
    { check: '加载框架明确', expected: 'supported library', actual: library, passed: library !== 'UNKNOWN' },
    { check: '无需额外授权', expected: 'public and ungated', actual: accessible ? 'public' : 'gated/private', passed: accessible }
  ];
  const passed = samples.every(sample => sample.passed);
  return {
    kind: 'huggingface-model-readiness', status: passed ? 'passed' : 'insufficient', runner: 'huggingface-model-card-proof', actualExecution: true,
    fixtureType: 'official-model-metadata', measuredAt: new Date().toISOString(),
    candidate: { id, name: id, url: `https://huggingface.co/${id}` },
    metric: { downloads: Number(data.downloads || 0), likes: Number(data.likes || 0), updatedDays, license, task, library },
    samples,
    logs: [`Hugging Face model ${id}`, `Task ${task} / library ${library} / license ${license}`, `${Number(data.downloads || 0).toLocaleString()} downloads / updated ${updatedDays ?? 'unknown'} days ago`]
  };
}
