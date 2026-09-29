# Validation report

Validated on 2026-09-28 with SkillEvaluator 0.3.0 and SkillSpector 2.12.0.

| Check | Result | Evidence |
|---|---|---|
| Project validator | PASS | Frontmatter, references, scorer behavior, eight evaluation cases, Skill Card, and benchmark files |
| SkillEvaluator quality | PASS, 100/100, Grade A | All four quality dimensions scored 100 |
| SkillSpector static security | PASS | SAFE, risk 0/100, 12 of 12 files fully inspected, no findings |
| Schema and repository governance | PASS | 11 checks passed |
| PII and Unicode scans | PASS | No PII or invisible Unicode findings |
| License compliance | PASS | Apache-2.0 |
| Bandit and Semgrep code risk | PASS | No security issues found |
| Dependency audit | PASS | No dependency files in the skill package |
| Tier 3 dataset validation | PASS | Current agentskills.io format, eight entries |
| Gitleaks secret scan | NOT RUN | Optional local binary was not installed; Tier 1 therefore reports incomplete rather than pass |
| Tier 2 semantic deduplication | NOT RUN | No NVIDIA Build or OpenAI embedding provider was configured |
| Tier 3 live comparison | NOT RUN | No supported public LLM provider and Harbor runtime were configured |

The static security result used `--no-llm`. Semantic SkillSpector analysis was not run because it would transmit the local skill content to an external model provider. The live baseline comparison remains the acceptance gate before claiming that the skill improves an agent.

Raw Tier 1 reports are generated outside the skill package under `reports/tier1/`.
