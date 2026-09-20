---
title: "SR 11-7 Concepts Applied to AI/ML Model Risk"
summary: "How the Federal Reserve's model-risk guidance maps onto modern AI/ML systems — explained in general, public-knowledge terms."
date: "2026-09-20"
tags: ["model-risk", "ai-ml", "governance"]
---

*By [Abdulmalik Ajisegiri](/about)*

*Note: this discusses SR 11-7 — the Federal Reserve's public 2011 guidance on model risk management — in general terms only. It is educational commentary on a public document, not a description of any institution's internal practices.*

## What SR 11-7 actually requires

SR 11-7, the Federal Reserve's guidance on model risk management, organizes the discipline around three pillars that have shaped the industry for over a decade:

1. **Model development, implementation, and use** — disciplined development practices, sound implementation, and controls on how models are actually used versus what they were approved for.
2. **Model validation** — independent, rigorous review of conceptual soundness, ongoing monitoring, and outcomes analysis. "Independent" does heavy lifting here: validators must be free from the incentives of the development team.
3. **Governance** — policies, roles and responsibilities, and documentation standards that make the first two pillars repeatable rather than heroic.

The guidance is deliberately technology-neutral. It doesn't say "regression" or "neural network" — it says *models*, defined broadly as quantitative methods that process inputs into estimates. That neutrality is exactly why it still matters for AI/ML.

## Model risk vs. model validation

A distinction the guidance insists on: **model risk** is the potential for adverse consequences from decisions based on incorrect or misused model outputs. **Model validation** is one of the primary controls *against* that risk — not the only one, and not a substitute for governance.

This matters because organizations routinely confuse passing validation with eliminating risk. Validation reduces uncertainty; it doesn't remove it. Residual risk — from known limitations, from use outside approved scope, from the world changing — has to be owned explicitly, usually through governance: use restrictions, performance monitoring, and escalation paths.

## Where AI/ML breaks the traditional mold

SR 11-7's framework was written when "model" typically meant an interpretable statistical model with a stable specification. AI/ML strains it in specific ways:

- **Opacity vs. conceptual soundness.** How do you assess the conceptual soundness of a model whose "theory" is ten million learned parameters? The guidance's demand doesn't vanish — it shifts to the learning formulation, the data, and the evaluation design (see my [practical ML validation framework](/research/ml-model-validation-framework)).
- **Non-stationarity by design.** Models that retrain continuously challenge the guidance's assumption of a distinct validation event. The answer isn't to exempt them — it's to validate the *retraining process itself* and monitor more aggressively.
- **Data as the model.** In ML, the training data effectively is the specification. That elevates data validation from a preprocessing chore to a first-class validation activity.
- **Emergent behavior.** Large models exhibit capabilities (and failure modes) not present in their components. Traditional outcomes analysis — backtesting against history — may not cover behaviors with no historical precedent.

None of this makes the guidance obsolete. It makes mechanical compliance insufficient: checking the boxes of a 2011 framework without adapting it to how ML actually fails is the kind of validation that passes audits and misses risks.

## Governance structures that work

What adapts well: tiered model inventories with risk-based validation intensity, independent validation functions with real authority to block deployment, model use restrictions tied to validated scope, and change control that treats retraining as a model change. What doesn't: treating validation as a launch gate that, once passed, is never revisited.

For AI/ML specifically, effective governance adds: approval of the *monitoring and retraining regime* alongside the model, defined triggers for revalidation (performance thresholds, data drift limits, elapsed time), and clear ownership of the residual risk the validation explicitly did not cover.

## Documentation expectations

The guidance's documentation standard survives contact with ML intact: a third party should be able to understand what the model does, why it was built that way, what was tested, what the limitations are, and under what conditions its use is approved. For ML systems, that means documenting the data lineage, the leakage controls, the evaluation design, and the monitoring plan with the same seriousness as the architecture.

If your documentation couldn't convince a skeptical reviewer who has never met your team, it isn't documentation — it's marketing.

## Related

- [Model Risk & Validation](/model-risk)
- [Conceptual Soundness: The Most Skipped Step in Model Validation](/research/conceptual-soundness-model-validation)
- [Model Validation in AI/ML Systems: A Practical Framework](/research/ml-model-validation-framework)
