import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const skillDir = join(root, 'skills', 'newpossible-tech-scout');
const skillPath = join(skillDir, 'SKILL.md');
const skill = await readFile(skillPath, 'utf8');

const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/u)?.[1];
if (!frontmatter) throw new Error('SKILL.md 缺少 YAML frontmatter');
if (!/^name:\s*["']?newpossible-tech-scout["']?\s*$/mu.test(frontmatter)) throw new Error('Skill name 无效');
const description = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/mu)?.[1]?.trim();
if (!description || description.length < 40) throw new Error('Skill description 过短或缺失');
if (!/Do NOT use/u.test(description)) throw new Error('Skill description 缺少负向触发边界');
if (!/^license:\s*["']?Apache-2\.0["']?\s*$/mu.test(frontmatter)) throw new Error('Skill license 缺失或无效');
if (!/^version:\s*["']?0\.2\.0["']?\s*$/mu.test(frontmatter)) throw new Error('Skill version 缺失或无效');
if (!/^metadata:\s*$/mu.test(frontmatter) || !/^\s+author:\s*["']?Xiaoyu <xiaoyu@cetccloud\.com>["']?\s*$/mu.test(frontmatter) || !/^\s+tags:\s*$/mu.test(frontmatter)) throw new Error('Skill metadata 缺失');
if (!/^allowed-tools:\s*(?:>-|["'])?/mu.test(frontmatter) || !/Bash\(python3 scripts\/score_candidates\.py:\*\)/u.test(frontmatter)) throw new Error('Skill tool allowlist 缺失');
if (/\bTODO\b|\[TODO/u.test(skill)) throw new Error('Skill 中仍有未完成占位符');

const required = [
  'agents/openai.yaml',
  'BENCHMARK.md',
  'skill-card.md',
  'evals/evals.json',
  'references/LICENSE',
  'references/scoring.md',
  'references/experiment-contract.md',
  'references/output-contract.md',
  'references/validation-report.md',
  'scripts/score_candidates.py',
  'tests/test_score_candidates.py'
];
for (const path of required) await access(join(skillDir, path));

for (const reference of ['references/scoring.md', 'references/experiment-contract.md', 'references/output-contract.md']) {
  if (!skill.includes(`](${reference})`)) throw new Error(`SKILL.md 未引用 ${reference}`);
}

const dataset = JSON.parse(await readFile(join(skillDir, 'evals', 'evals.json'), 'utf8'));
if (dataset?.skill_name !== 'newpossible-tech-scout') throw new Error('评测集 skill_name 无效');
const evals = dataset.evals;
if (!Array.isArray(evals) || evals.length < 6) throw new Error('评测集至少需要 6 个用例');
const ids = new Set();
let positive = 0;
let negative = 0;
for (const item of evals) {
  if (!item?.id || ids.has(item.id)) throw new Error('评测用例 id 缺失或重复');
  ids.add(item.id);
  if (typeof item.prompt !== 'string' || item.prompt.length < 12) throw new Error(`评测问题无效：${item.id}`);
  if (typeof item.expected_output !== 'string' || item.expected_output.length < 20) throw new Error(`评测结果无效：${item.id}`);
  if (!Array.isArray(item.assertions) || item.assertions.length < 2) throw new Error(`评测期望不足：${item.id}`);
  if (item.expected_skill === 'newpossible-tech-scout') positive += 1;
  else if (item.expected_skill === null) negative += 1;
  else throw new Error(`expected_skill 无效：${item.id}`);
}
if (positive < 3 || negative < 2) throw new Error('评测集必须同时覆盖正向和负向触发');
if (!evals.some(item => /凭据文件|远程下载的安装脚本/u.test(item.prompt))) throw new Error('评测集缺少不可信来源安全用例');

const card = await readFile(join(skillDir, 'skill-card.md'), 'utf8');
if (/\[(?:Insert|Describe|Answer|Provide)|HUMAN-REQUIRED|VERIFY|SELECT/u.test(card)) throw new Error('Skill Card 仍有人工复核占位符');
for (const heading of ['## Owner', '## Known Risks and Mitigations', '## Evaluation Tasks', '## Evaluation Results']) {
  if (!card.includes(heading)) throw new Error(`Skill Card 缺少 ${heading}`);
}

const ui = await readFile(join(skillDir, 'agents', 'openai.yaml'), 'utf8');
if (!ui.includes('display_name: "NewPossible Tech Scout"')) throw new Error('openai.yaml 缺少 display_name');
if (!ui.includes('$newpossible-tech-scout')) throw new Error('default_prompt 未显式调用 Skill');

const tempDir = await mkdtemp(join(tmpdir(), 'newpossible-skill-'));
try {
  const fixture = join(tempDir, 'candidates.json');
  await writeFile(fixture, JSON.stringify([
    { id: 'prove-me', title: 'Prove me', relevance: 3, delta: 3, feasibility: 3, evidence: 2, proofCost: 3 },
    { id: 'reject-me', title: 'Reject me', relevance: 1, delta: 3, feasibility: 3, evidence: 3, proofCost: 3 }
  ]));
  const output = JSON.parse(execFileSync('python3', [join(skillDir, 'scripts', 'score_candidates.py'), fixture], { encoding: 'utf8' }));
  if (output[0]?.id !== 'prove-me' || output[0]?.decision !== 'prove' || output[1]?.decision !== 'reject') {
    throw new Error('候选评分器行为不符合规则');
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

console.log('PASS newpossible-tech-scout');
console.log('- frontmatter and discovery metadata');
console.log('- progressive references');
console.log('- candidate scoring behavior');
console.log(`- ${evals.length} evaluation cases (${positive} positive, ${negative} negative)`);
console.log('- governance card and benchmark package');
