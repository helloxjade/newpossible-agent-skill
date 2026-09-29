const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let sources = [];
let goal = null;
let delta = null;
let experimentAvailable = false;

const presets = {
  data: {
    objective: '用 pandas 处理 500 万行设备日志，完成过滤与分组聚合',
    stack: 'Python、pandas、Docker；可使用 NVIDIA GPU',
    constraints: '结果必须一致；验证控制在 10 分钟内；不改动生产环境',
    desired: '判断是否有新技术能让当前数据处理热路径至少加速 1.2 倍',
    candidate: ''
  },
  project: {
    objective: '为 TypeScript Agent 选择一个成熟的工具调用框架，减少自建循环和结构化输出代码',
    stack: 'TypeScript、Node.js 22、OpenAI 兼容模型',
    constraints: '必须开源、有明确许可证、近期仍在维护；不执行陌生仓库代码',
    desired: '判断一个开源项目是否具备进入最小集成试点的条件',
    candidate: 'https://github.com/langchain-ai/langchainjs'
  },
  model: {
    objective: '为中文技术文档助手选择一个可本地部署的文本生成模型',
    stack: 'Python、Transformers、NVIDIA GPU',
    constraints: '模型卡需明确任务、许可证和加载框架；本轮不下载权重',
    desired: '判断一个模型是否具备进入小样本试用的基础条件',
    candidate: 'https://huggingface.co/Qwen/Qwen3-8B'
  }
};

const presetNotes = {
  data: '完整实测：在 GX10 上比较 pandas 与 cuDF。',
  project: '只读核验：检查 GitHub 官方仓库元数据，不执行项目代码。',
  model: '只读核验：检查 Hugging Face 模型卡，不下载模型权重。'
};

async function api(path, options) {
  const response = await fetch(path, options);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

function renderRadar(summary) {
  $('#radar-summary').innerHTML = [
    ['scanned', summary.scanned, '已查验 / SCANNED'],
    ['filtered', summary.filtered, '自动忽略 / FILTERED'],
    ['watching', summary.watching, '继续观察 / WATCHING'],
    ['actionable', summary.actionable, '需要决定 / READY']
  ].map(([state, value, label]) => `<div class="radar-stat ${state}"><strong>${escapeHtml(value)}</strong><span>${label}</span></div>`).join('');
}

function sourceDetail(source) {
  document.querySelectorAll('.source-item').forEach(button => button.classList.toggle('active', button.dataset.id === source.id));
  const state = source.radarState === 'actionable' ? '需要决定' : source.radarState === 'watching' ? '继续观察' : '自动忽略';
  $('#source-detail').innerHTML = `<span class="detail-label">${escapeHtml(state)} · ${escapeHtml(source.id)}</span><h3>${escapeHtml(source.title)}</h3><p>${escapeHtml(source.summary)}</p><p><strong>本轮判断：</strong>${escapeHtml(source.radarReason)}</p><div class="detail-meta"><span>${escapeHtml(source.kind)}</span><span>${escapeHtml(source.dateLabel)} ${escapeHtml(source.date)}</span></div><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">查看官方来源 ↗</a>`;
}

function renderSources() {
  const order = { actionable: 0, watching: 1, filtered: 2 };
  const sorted = [...sources].sort((a, b) => order[a.radarState] - order[b.radarState]);
  const labels = { actionable: 'READY', watching: 'WATCH', filtered: 'QUIET' };
  $('#source-list').innerHTML = sorted.map((source, index) => `<button type="button" class="source-item" data-id="${escapeHtml(source.id)}" data-state="${escapeHtml(source.radarState)}"><span class="source-number">${String(index + 1).padStart(2, '0')}</span><span class="source-name">${escapeHtml(source.title)}<small>${escapeHtml(source.tags.join(' · '))}</small></span><span class="source-state ${escapeHtml(source.radarState)}">${labels[source.radarState]}</span></button>`).join('');
  document.querySelectorAll('.source-item').forEach(button => button.addEventListener('click', () => sourceDetail(sources.find(source => source.id === button.dataset.id))));
  sourceDetail(sorted[0]);
}

function candidateCount() {
  return $('#candidate').value.split(/\r?\n|；|;/).filter(item => item.trim()).length;
}

function updateCandidateCount() {
  const count = candidateCount();
  $('#candidate-count').textContent = `${count} / 5`;
  $('#candidate-count').classList.toggle('over', count > 5);
}

function setPreset(name) {
  const preset = presets[name];
  for (const [key, value] of Object.entries(preset)) $(`#${key}`).value = value;
  document.querySelectorAll('.preset-button').forEach(button => button.classList.toggle('active', button.dataset.preset === name));
  $('#preset-note').textContent = presetNotes[name];
  updateCandidateCount();
}

function traceStep(index, title, detail, state = '') {
  return `<div class="trace-step ${state}"><span class="trace-dot">${String(index).padStart(2, '0')}</span><div><b>${escapeHtml(title)}</b><small>${escapeHtml(detail)}</small></div></div>`;
}

function renderTraceRunning() {
  $('#trace-state').textContent = 'AGENT RUNNING';
  $('#trace-state').className = 'runner-badge running';
  $('#agent-trace').innerHTML = [
    traceStep(1, 'Skill 已装载', 'Scout Agent + Decision Agent · 安全边界生效', 'done'),
    traceStep(2, 'Scout Agent 正在搜索', 'NVIDIA Catalog + GitHub / Hugging Face', 'active'),
    traceStep(3, 'Decision Agent 评分并选择', '等待多源候选返回'),
    traceStep(4, '进入证据闸门', '等待 PROVE / WATCH / REJECT')
  ].join('');
}

function renderTraceResult(plan) {
  if (!plan) {
    $('#trace-state').textContent = 'LOCAL FALLBACK';
    $('#trace-state').className = 'runner-badge';
    $('#agent-trace').innerHTML = [
      traceStep(1, 'Skill 已装载', 'newpossible-tech-scout', 'done'),
      traceStep(2, '模型服务未返回计划', '已使用本地受控规则', 'warning'),
      traceStep(3, '候选边界已检查', '不会执行未知代码', 'done'),
      traceStep(4, '等待实验', experimentAvailable ? 'GX10 runner 已连接' : 'GX10 runner 未连接')
    ].join('');
    return;
  }
  const sourceLabels = { 'user-input': '用户指定候选', 'github-public-search': 'GitHub 公开项目', 'huggingface-model-search': 'Hugging Face 模型', 'nvidia-online-catalog': 'NVIDIA 官方目录' };
  const source = sourceLabels[plan.source] || plan.source;
  const publicSource = plan.publicSource === 'huggingface' ? 'Hugging Face' : plan.publicSource === 'github' ? 'GitHub' : '公开生态';
  const publicStatus = plan.publicUnavailable ? `${publicSource} 暂不可用` : `${publicSource} ${plan.publicMatches} 项`;
  const discovery = `NVIDIA Catalog ${plan.catalogMatches} 项 · ${publicStatus}${plan.userCandidateCount ? ` · 用户 ${plan.userCandidateCount} 项` : ''}`;
  const webProof = plan.tool === 'github-project-readiness' || plan.tool === 'huggingface-model-readiness';
  const gate = plan.tool
    ? `${plan.tool} · ${webProof ? 'READ-ONLY WEB PROOF' : experimentAvailable ? 'GX10 READY' : '等待连接 GX10'}`
    : '当前候选先观察，不运行未知代码';
  $('#trace-state').textContent = plan.tool ? 'AWAITING PROOF' : 'PLAN COMPLETE';
  $('#trace-state').className = 'runner-badge complete';
  $('#agent-trace').innerHTML = [
    traceStep(1, '双 Agent 已装载 Skill', `${plan.skill} · ${plan.framework}`, 'done'),
    traceStep(2, 'Scout Agent 完成多源搜索', discovery, 'done'),
    traceStep(3, 'Decision Agent 选择唯一候选', `${source} · ${plan.model} · ${plan.score} / 36`, 'done'),
    traceStep(4, plan.tool ? '等待运行证据适配器' : '已进入观察队列', gate, plan.tool ? 'prove' : 'watch')
  ].join('');
}

function renderDelta() {
  const references = delta.sourceIds.map(id => sources.find(source => source.id === id)).filter(Boolean);
  const plan = delta.agentPlan;
  const sourceLinks = references.length
    ? references.map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)} ↗</a>`).join('')
    : delta.sourceUrl ? `<a href="${escapeHtml(delta.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看候选来源 ↗</a>` : '<span>用户提供的候选</span>';
  const scoreLabels = { relevance: '目标相关', delta: '能力增量', feasibility: '当前可行', evidence: '证据质量', proofCost: '验证成本' };
  const scorePanel = plan ? `<div class="agent-score"><div class="score-total"><span>AGENT SCORE</span><strong>${escapeHtml(plan.score)}<small>/36</small></strong><em>${escapeHtml(plan.action.toUpperCase())}</em></div><div class="score-factors">${Object.entries(plan.scores).map(([key, value]) => `<div><span>${scoreLabels[key]}</span><i><b style="width:${Number(value) / 3 * 100}%"></b></i><strong>${escapeHtml(value)}/3</strong></div>`).join('')}</div></div>` : '';
  $('#delta-content').className = 'delta-content';
  $('#delta-content').innerHTML = `<div class="delta-topline"><span class="status-chip">1 ACTION REQUIRED</span><span>${escapeHtml(delta.providerLabel)}</span></div><h3>${escapeHtml(delta.title)}</h3>${scorePanel}<div class="decision-meta"><div><span>验证路线</span><strong>${escapeHtml(delta.route)}</strong></div><div><span>注意力成本</span><strong>${escapeHtml(delta.proofCost)}</strong></div></div><div class="delta-grid"><div class="delta-block before"><span>为什么以前麻烦</span><p>${escapeHtml(delta.before)}</p></div><div class="delta-block now"><span>为什么现在值得验证</span><p>${escapeHtml(delta.now)}</p></div></div><div class="relation"><span>与你的项目相关</span><p>${escapeHtml(delta.relation)}</p></div><div class="conditions"><strong>进入实验的条件</strong><ul>${delta.conditions.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div><div class="source-links"><span>候选依据</span>${sourceLinks}</div>`;

  $('#proof-content').className = 'proof-ready';
  const proofAvailable = Boolean(delta.proofKind) || experimentAvailable;
  const proofButtonLabel = delta.proofKind === 'github-project-readiness' ? '核验 GitHub 项目采用条件' : delta.proofKind === 'huggingface-model-readiness' ? '核验模型卡采用条件' : '在 GX10 上实测这项新技术';
  const runControl = delta.runnable
    ? `<button id="run-button" type="button" class="run-button" ${proofAvailable ? '' : 'disabled'}><span class="run-symbol">▶</span><span>${proofAvailable ? proofButtonLabel : 'GX10 实验 runner 尚未连接'}</span><span>↗</span></button><p class="fixture-note">${delta.proofKind ? '适配器只读取候选的官方公开元数据，不下载或执行代码与模型。' : 'runner 只执行已注册的 cuDF 对照实验；采用决定来自实测结果。'}</p>`
    : '<p class="fixture-note">当前候选没有登记实验适配器，因此本轮只返回 WATCH，不执行未知代码。</p>';
  $('#proof-content').innerHTML = `<div class="proof-plan"><span>FIXED PROOF CONTRACT / 不执行任意命令</span><p>${escapeHtml(delta.experiment)}</p></div><div class="proof-contract"><div><span>基线</span><strong>${escapeHtml(delta.baseline)}</strong></div><div><span>候选技术</span><strong>${escapeHtml(delta.candidateLabel)}</strong></div><div><span>采用门槛</span><strong>${escapeHtml(delta.threshold)}</strong></div></div><div class="scope-note"><strong>验证边界</strong><p>${escapeHtml(delta.scope)}</p></div>${runControl}`;
  $('#runner-badge').textContent = delta.proofKind ? 'WEB EVIDENCE READY' : experimentAvailable ? 'GX10 EXPERIMENT READY' : 'GX10 EXPERIMENT OFFLINE';
  if (delta.runnable) $('#run-button').addEventListener('click', runProof);
  $('#evidence-content').className = 'evidence-empty';
  $('#evidence-content').innerHTML = '<span>AWAITING ADOPTION PROOF</span><p>运行后将显示 CPU/GPU 耗时、结果一致性和 adopt / watch / reject 决定。</p>';
}

function renderEvidence(run) {
  const evidence = run.evidence;
  if (evidence.kind) {
    const project = evidence.kind === 'github-project-readiness';
    const passed = evidence.status === 'passed';
    const metrics = project
      ? [['OFFICIAL FILES', evidence.metric.officialFiles], ['UPDATED', evidence.metric.updatedDays === null ? '—' : `${evidence.metric.updatedDays} days`], ['LICENSE', evidence.metric.license]]
      : [['DOWNLOADS', evidence.metric.downloads], ['TASK', evidence.metric.task], ['LICENSE', evidence.metric.license]];
    $('#evidence-content').className = 'evidence-content';
    $('#evidence-content').innerHTML = `<div class="evidence-banner ${passed ? 'pass' : 'fail'}"><div><span>READ-ONLY EVIDENCE / ${escapeHtml(evidence.runner)}</span><strong>${passed ? 'PILOT / 可以进入最小试点' : 'WATCH / 采用前提不完整'}</strong></div><span class="result-mark">${passed ? '✓' : '!'}</span></div><div class="metric-row">${metrics.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? '—')}</strong></div>`).join('')}</div><p class="evidence-note">${escapeHtml(evidence.candidate.name)} · ${project ? 'GitHub 官方仓库元数据' : 'Hugging Face 官方模型卡'}</p><div class="case-table"><div class="case-head"><span>试点前提</span><span>期望 / 实际</span><span>结果</span></div>${evidence.samples.map(sample => `<div class="case-row"><span>${escapeHtml(sample.check)}</span><span>${escapeHtml(sample.expected)} / ${escapeHtml(sample.actual)}</span><b class="${sample.passed ? 'ok' : 'bad'}">${sample.passed ? 'PASS' : 'WAIT'}</b></div>`).join('')}</div><details class="logs"><summary>查看官方元数据摘要</summary><pre>${escapeHtml((evidence.logs || []).join('\n'))}</pre></details><div class="recommendation"><strong>采用建议</strong><p>${escapeHtml(run.recommendation)}</p></div><p class="export-caption">这项证据只决定是否进入试点，不替代后续功能、质量和性能实验。</p>`;
    return;
  }
  const pass = evidence.status === 'passed';
  const statusLabel = pass ? 'ADOPT / 建议采用' : evidence.status === 'insufficient' ? 'WATCH / 继续观察' : 'REJECT / 不建议采用';
  const candidate = evidence.candidate || {};
  $('#evidence-content').className = 'evidence-content';
  $('#evidence-content').innerHTML = `<div class="evidence-banner ${pass ? 'pass' : 'fail'}"><div><span>OBSERVED ON / ${escapeHtml(evidence.runner)}</span><strong>${statusLabel}</strong></div><span class="result-mark">${pass ? '✓' : '!'}</span></div><div class="metric-row"><div><span>GPU COMPUTE SPEEDUP</span><strong>${escapeHtml(evidence.metric.speedup ?? '—')}<small>x</small></strong></div><div><span>PANDAS CPU</span><strong>${escapeHtml(evidence.metric.cpuMs ?? '—')} <small>ms</small></strong></div><div><span>cuDF GPU</span><strong>${escapeHtml(evidence.metric.gpuMs ?? '—')} <small>ms</small></strong></div></div><p class="evidence-note">${escapeHtml(candidate.name || '')} ${escapeHtml(candidate.version || '')} · ${escapeHtml(evidence.metric.rows?.toLocaleString?.() || evidence.metric.rows || '')} rows · transfer ${escapeHtml(evidence.metric.transferMs ?? '—')} ms · ${escapeHtml(candidate.workload || '')}</p><div class="case-table"><div class="case-head"><span>采用检查</span><span>期望 / 实际</span><span>结果</span></div>${evidence.samples.map(sample => `<div class="case-row"><span>${escapeHtml(sample.check)}</span><span>${escapeHtml(sample.expected)} / ${escapeHtml(sample.actual)}</span><b class="${sample.passed ? 'ok' : 'bad'}">${sample.passed ? 'PASS' : 'FAIL'}</b></div>`).join('')}</div><details class="logs"><summary>查看实验原始摘要</summary><pre>${escapeHtml((evidence.logs || []).join('\n'))}</pre></details><div class="recommendation"><strong>采用建议</strong><p>${escapeHtml(run.recommendation)}</p></div><p class="export-caption">本次实测证据已由 Agent 保存。参赛 Skill 是仓库中固定的 <code>skills/newpossible-tech-scout/</code>。</p>`;
}

async function runProof() {
  const button = $('#run-button');
  button.disabled = true;
  const runningLabel = delta.proofKind === 'github-project-readiness' ? '正在核验 GitHub 官方项目元数据…' : delta.proofKind === 'huggingface-model-readiness' ? '正在核验 Hugging Face 模型卡…' : 'GX10 正在运行 pandas / cuDF 对照…';
  button.innerHTML = `<span class="spinner"></span><span>${runningLabel}</span>`;
  $('#trace-state').textContent = delta.proofKind ? 'PROOF RUNNING' : 'GX10 RUNNING';
  $('#trace-state').className = 'runner-badge running';
  try {
    const run = await api('/api/proof', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal, deltaId: delta.id, proofKind: delta.proofKind, sourceUrl: delta.sourceUrl }) });
    button.innerHTML = `<span class="run-symbol">✓</span><span>${delta.proofKind ? '重新核验官方证据' : '重新运行采用实验'}</span><span>↗</span>`;
    renderEvidence(run);
    $('#trace-state').textContent = 'EVIDENCE SAVED';
    $('#trace-state').className = 'runner-badge complete';
    const finalStep = document.querySelector('.trace-step:last-child');
    if (finalStep) finalStep.innerHTML = delta.proofKind
      ? `<span class="trace-dot">04</span><div><b>官方元数据证据已保存</b><small>${escapeHtml(run.evidence.status.toUpperCase())} · ${escapeHtml(run.evidence.runner)}</small></div>`
      : `<span class="trace-dot">04</span><div><b>GX10 证据已保存</b><small>${escapeHtml(run.evidence.status.toUpperCase())} · ${escapeHtml(run.evidence.metric.speedup ?? '—')}x · 结果一致性已检查</small></div>`;
    $('#evidence-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    button.innerHTML = '<span class="run-symbol">▶</span><span>重试采用实验</span><span>↗</span>';
    $('#evidence-content').className = 'error-state';
    $('#evidence-content').textContent = `实验未完成：${error.message}`;
  } finally { button.disabled = false; }
}

$('#goal-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('#analyze-button');
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span><span>正在替你过滤技术信号…</span>';
  goal = Object.fromEntries(new FormData(event.currentTarget));
  renderTraceRunning();
  try {
    const result = await api('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal }) });
    delta = result.delta;
    $('#provider-badge').textContent = delta?.providerLabel || '本轮没有需要注意的能力';
    if (delta) {
      renderTraceResult(delta.agentPlan);
      renderDelta();
    }
    else {
      $('#trace-state').textContent = 'NO ACTION';
      $('#trace-state').className = 'runner-badge complete';
      $('#agent-trace').innerHTML = [traceStep(1, 'Skill 已装载', '筛选规则已执行', 'done'), traceStep(2, '候选已检查', '没有候选达到注意力门槛', 'done'), traceStep(3, '本轮无需决定', '保持安静', 'watch'), traceStep(4, '未触发实验', '没有浪费 GPU 资源')].join('');
      $('#delta-content').className = 'empty-state';
      $('#delta-content').innerHTML = `<span class="empty-glyph">0</span><h3>今天无需处理</h3><p>${escapeHtml(result.message)}</p>`;
      $('#proof-content').className = 'proof-intro';
      $('#proof-content').innerHTML = '<p>只有达到相关性、可执行性和注意力门槛的变化才会生成实验。</p>';
    }
    $('#delta-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    $('#delta-content').className = 'error-state';
    $('#delta-content').textContent = `筛选未完成：${error.message}`;
  } finally {
    button.disabled = false;
    button.innerHTML = '<span>重新检查今天的能力变化</span><span aria-hidden="true">↗</span>';
  }
});

document.querySelectorAll('.preset-button').forEach(button => button.addEventListener('click', () => setPreset(button.dataset.preset)));
$('#candidate').addEventListener('input', updateCandidateCount);

try {
  const boot = await api('/api/bootstrap');
  sources = boot.sources;
  experimentAvailable = boot.experimentAvailable;
  renderRadar(boot.radarSummary);
  for (const [key, value] of Object.entries(boot.defaultGoal)) $(`#${key}`).value = value;
  updateCandidateCount();
  $('#provider-badge').textContent = boot.provider === 'nvidia-nim' ? 'NVIDIA NIM 已配置' : boot.provider === 'nvidia-nim-incomplete' ? 'NVIDIA NIM 配置未完成' : boot.provider === 'stepfun' ? 'StepFun 已配置' : '本地规则筛选';
  $('#runner-badge').textContent = experimentAvailable ? 'GX10 EXPERIMENT READY' : 'GX10 EXPERIMENT OFFLINE';
  renderSources();
} catch (error) {
  $('#source-list').textContent = `雷达加载失败：${error.message}`;
}
