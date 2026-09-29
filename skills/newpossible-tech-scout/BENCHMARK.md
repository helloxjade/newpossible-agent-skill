# NewPossible Tech Scout Benchmark

## Status

Development benchmark prepared on 2026-09-28. The authored evaluation dataset, local structural checks, and static security checks are complete. Live Tier 3 baseline-versus-skill results must come from an actual supported agent run and are recorded below only after execution.

## Evaluation configuration

| Field | Value |
|---|---|
| Skill | `newpossible-tech-scout` 0.2.0 |
| Dataset | `evals/evals.json` |
| Cases | 8 total: 5 positive/safety-sensitive, 3 negative triggers |
| Primary agent | Codex |
| Method | Same agent, model, prompt, and sandbox with and without the skill |
| Dimensions | Security, Correctness, Discoverability, Effectiveness, Efficiency |

## Verified local checks

| Check | Result |
|---|---|
| SKILL.md frontmatter and discovery metadata | PASS |
| Progressive references resolve | PASS |
| Candidate scoring behavior | PASS |
| Evaluation dataset shape and positive/negative coverage | PASS |
| Skill Card has no review placeholders | PASS |
| Credential values excluded from the skill package | PASS |
| SkillEvaluator quality | PASS — 100/100, Grade A |
| SkillSpector static security | PASS — SAFE, 0/100 risk, 100% coverage |
| SkillEvaluator Tier 3 dataset validation | PASS — 8 current-format entries |
| SkillEvaluator Tier 1 | INCOMPLETE — Gitleaks optional binary not installed; all other static checks passed |
| SkillEvaluator Tier 2 | NOT RUN — embedding provider not configured |

Detailed evidence and tool limitations are in [references/validation-report.md](references/validation-report.md).

## Tier 3 results

| Dimension | Baseline | With skill | Evidence |
|---|---:|---:|---|
| Security | Pending live run | Pending live run | No result claimed |
| Correctness | Pending live run | Pending live run | No result claimed |
| Discoverability | N/A | Pending live run | Includes negative trigger cases |
| Effectiveness | Pending live run | Pending live run | No result claimed |
| Efficiency | Pending live run | Pending live run | No result claimed |

## Verdict

`PENDING_TIER3` — the package is ready for live evaluation. This document must not be presented as evidence of agent uplift until actual baseline and with-skill results are attached.

## Reproduction

```bash
npm run validate:skill
skillevaluator quality-check skills/newpossible-tech-scout
skillspector scan skills/newpossible-tech-scout --no-llm --fail-on-incomplete --fail-on-findings
skillevaluator tier1 skills/newpossible-tech-scout
skillevaluator tier2 skills/newpossible-tech-scout
skillevaluator tier3 validate skills/newpossible-tech-scout
skillevaluator tier3 skills/newpossible-tech-scout
```

Record the SkillEvaluator version or commit, provider, model, agent, sandbox mode, date, raw report path, and per-case results before changing the verdict.
