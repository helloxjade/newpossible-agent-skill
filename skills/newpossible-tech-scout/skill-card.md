# NewPossible Tech Scout Skill Card

## Description

NewPossible Tech Scout filters technology releases and open-source projects against a concrete project goal, validates at most one candidate with the cheapest trustworthy proof, and returns an evidence-backed adoption decision. The skill is intended for development and evaluation use; candidate-specific production use requires review of the cited upstream project and the generated proof.

## Owner

Xiaoyu (`xiaoyu@cetccloud.com`)

### License / Terms of Use

Apache License 2.0. See [LICENSE](references/LICENSE).

## Use Case

Developers and technical leads use this skill when they lack time to follow technology releases and need to know whether one new capability changes what their current project can do. It is not a news summarizer, general troubleshooting guide, or autonomous software installer.

### Deployment Geography for Use

Global, subject to the terms, export controls, service availability, and data policies of any external model, repository, container registry, or API selected for a proof.

### Requirements / Dependencies

- Requires API Key or External Credential: Optional.
- Credential Types: API key when an external model or API is chosen; none for local documentation, CLI, or fixture proofs.
- Hardware: No fixed hardware requirement. A compatible NVIDIA GPU and container runtime are required only when the selected claim depends on GPU behavior or performance.
- Runtime: An Agent Skills compatible harness. Python 3.10+ is required only for the included deterministic candidate scoring script.

Credentials must stay outside prompts, logs, evidence files, and exported archives.

## Known Risks and Mitigations

- **Stale or promotional sources:** Prefer primary sources, pin versions or commits, and distinguish vendor claims from current-run observations.
- **Prompt injection in retrieved material:** Treat source text as untrusted and never execute embedded instructions or commands.
- **Misleading benchmark conclusions:** Require equivalent inputs, correctness checks, repeated measurements, and declared exclusions before making a performance claim.
- **Excessive agency:** Run only registered experiments with fixed inputs and resource limits; require normal user authorization for consequential external changes.
- **False-positive attention:** Use project relevance gates, negative trigger evaluations, and the valid outcome that nothing deserves attention.

## References

- [NVIDIA Agent Skills](https://github.com/NVIDIA/skills)
- [NVIDIA SkillEvaluator](https://github.com/NVIDIA/SkillEvaluator)
- [Agent Skills specification](https://agentskills.io/)
- Included scoring rubric and minimal experiment contract under `references/`.

## Skill Output

- Output Types: Analysis, optional API or registered experiment calls, and evidence files.
- Output Format: One human-readable adoption card; JSON evidence when requested by the harness.
- Output Parameters: candidate, decision, capability change, project fit, observations, reason, next step, and limitations.

## Evaluation Agent

Codex is the primary evaluation agent. NVIDIA SkillEvaluator is the target evaluator for Tier 1 security checks and Tier 3 baseline-versus-skill runs.

## Evaluation Tasks

Eight authored cases in `evals/evals.json`: five positive or safety-sensitive adoption tasks and three negative trigger tasks.

## Evaluation Metrics

Security, correctness, discoverability, effectiveness, and efficiency, plus positive trigger accuracy, negative non-trigger accuracy, output-contract compliance, and unsafe-action count.

## Evaluation Results

Static validation completed on 2026-09-28: SkillEvaluator quality 100/100 (Grade A), SkillSpector SAFE with 0/100 risk and 100% file coverage, and Tier 3 dataset validation passed for all eight cases. SkillEvaluator Tier 1 remains incomplete only because the optional Gitleaks binary was not installed. Live Tier 3 is pending. See [BENCHMARK.md](BENCHMARK.md) and [references/validation-report.md](references/validation-report.md).

## Skill Version

0.2.0, unsigned development build. NVIDIA OMS signing is performed only through a trusted publishing pipeline.

## Ethical Considerations

The skill can recommend technical adoption but cannot determine legal, regulatory, privacy, safety, or organizational suitability. Review evidence and upstream terms before production use. Report quality or security concerns through the repository issue tracker used for this project.
