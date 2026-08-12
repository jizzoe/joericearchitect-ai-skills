# Research Topic Workflow Notes

This note records decisions from the interactive dry run that will later become
the `research-topic-workflow` skill.

## Findings Structure

Use this durable repo structure for research outputs:

```text
docs/research/
  <topic-category-slug>/
    <research-topic-slug>/
      <research-topic-slug>-findings.md
      sources.md
```

Example:

```text
docs/research/aidlc/harness-engineering/
  harness-engineering-findings.md
  sources.md
```

## Research Depths

| Depth | Use when | Source target | Output |
| --- | --- | ---: | --- |
| Quick scan | Orientation or go/no-go read | 5-8 sources | Short summary, core concepts, top tools/products, key links |
| Standard research | Planning, architecture, or skill design | 10-18 sources | Structured findings with use cases, SDLC fit, OSS/paid options, tutorials, articles, and project fit |
| Deep research | Roadmap, procurement, architecture, or reusable-skill decisions | 25+ sources | Comparative analysis, tradeoffs, maturity signals, implementation patterns, risks, recommendations, and source quality notes |

## Model Guidance Policy

The skill should display model guidance before execution based on selected
depth. It should not silently switch the user's active CLI session model.

Use durable model roles in the skill and resolve exact model names from current
provider documentation when possible:

- `cheap-triage`
- `balanced-standard`
- `highest-quality`

### Codex / OpenAI

| Depth | Role | Last-known recommendation |
| --- | --- | --- |
| Quick scan | `cheap-triage` | `gpt-5.6-luna` |
| Standard research | `balanced-standard` | `gpt-5.6-terra` |
| Deep research | `highest-quality` | `gpt-5.6-sol` |

### Claude

| Depth | Role | Last-known API recommendation | Last-known Claude Code recommendation |
| --- | --- | --- | --- |
| Quick scan | `cheap-triage` | Claude Haiku 3.5 | `sonnet`, unless Haiku is explicitly available |
| Standard research | `balanced-standard` | Claude Sonnet 4 | `sonnet` |
| Deep research | `highest-quality` | Claude Opus 4.1 | `opus` |

## Tool Detection

The skill should support both display modes:

- Auto-detect the active tool when reliable and show that provider's model
  recommendation.
- If detection is uncertain, show both Codex/OpenAI and Claude recommendations.

## Staleness Rule

Model names, availability, and pricing move quickly. Before giving exact model
names or prices, the skill should check current official provider docs when
network access is available:

- Codex/OpenAI: official OpenAI model guidance and pricing/model comparison.
- Claude: official Anthropic model and pricing docs.

If current docs cannot be checked, show last-known recommendations and label
them as stale-risk. Each findings document should record the model guidance
source URLs and lookup date when model advice is included.

## Multi-Model Execution

A normal CLI skill should recommend the model and ask the user to switch through
the tool's normal mechanism, such as Codex `/model` or Claude Code
`claude --model`.

A future API-backed pipeline may explicitly route phases to different models,
for example cheap triage, balanced extraction, and high-quality synthesis, but
only with explicit cost controls, credentials handling, logging, and user
approval.
