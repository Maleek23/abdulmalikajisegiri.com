---
title: "Clinical Risk Predictive Model — Cardiac Surgery Outcomes"
summary: "A stacked-ensemble ML pipeline predicting operative mortality in cardiac surgery from preoperative variables, built against STS-aligned outcomes."
date: "2025-06-01"
tags: ["machine-learning", "validation", "statistics", "risk-management", "software-engineering"]
draft: false
repoUrl: "https://github.com/Maleek23/cardiac-surgery-predictive-model"
---

## Overview

This project is a machine learning pipeline that predicts postoperative risk in cardiac surgery — operative mortality, renal failure, prolonged ventilation, stroke — from 20+ preoperative patient variables. It was developed against clinical requirements from HCA Houston Clear Lake, with the explicit goal of replacing Excel-based STS (Society of Thoracic Surgeons) calculators: streamlining data entry, reducing human error, and moving toward real-time decision support for surgical planning. The models are aligned with STS-defined outcomes and the expected/observed ratios behind STS star ratings.

The pipeline is a MATLAB/Python build centered on a stacked ensemble. As reported in the repository: R² of 0.78 for the main gradient-boosting model and 0.81 for the stacked TAVR variant. Those are the repository's reported figures on its dataset — I present them as such, not as independently verified clinical results, and the two numbers describe different model variants on different targets, which matters for how you read them.

## Approach

**Preprocessing with clinical data's messiness in mind.** Missing values filled, NaN rows removed, MinMax scaling, one-hot encoding for categoricals (gender, insurer, procedure type). Clinical datasets punish naive pipelines — the preprocessing is where most of the project's judgment lives.

**Multicollinearity pruning via VIF.** Before modeling, variance inflation factors were computed across predictors and collinear features removed. Correlated vitals and labs will happily let a model memorize noise; the VIF pass is what keeps the feature set honest. The repo's own writeup notes that pruning improved performance — a small, unglamorous step with outsized effect.

**Stacked ensemble: gradient boosting over random forest.** The final architecture stacks a Random Forest and a Gradient Boosting Regressor under a meta-learner, with hyperparameter tuning via `RandomizedSearchCV` and an optional Yeo-Johnson transformation to improve residual behavior. The rationale for stacking here is robustness to clinical variability: no single learner's inductive bias should dominate a mortality prediction.

**Residual bias analysis.** Beyond aggregate metrics, the project examines residual distributions for systematic bias — whether the model consistently over- or under-predicts for subgroups. The repo flags fairness across age and ethnicity as explicit future work, which is the right framing: the analysis started, and the hard part is acknowledged as unfinished.

## Key engineering decisions

**STS alignment as a design constraint.** Rather than predicting ad-hoc outcomes, every target maps to an STS-defined endpoint. This makes the model's outputs comparable to the expected/observed ratios hospitals already report, so a "3-star program rating" estimate means something inside existing quality workflows instead of inventing a parallel metric.

**Two models, two honest numbers.** The repo reports 0.78 (main pipeline) and 0.81 (stacked TAVR model) separately instead of cherry-picking the higher one. Keeping variant-level results distinct is a validation discipline: blended or best-of reporting is how clinical ML quietly overstates itself.

**Reproducibility as a deliverable.** The repo ships the full pipeline (`main.py`), the interactive notebook, the cleaned dataset, and exported model artifacts (`.pkl`) — plus the project proposal and stakeholder presentation. A clinical model that can't be rerun end-to-end is a claim, not a tool.

**Excel replacement, not AI theater.** The project's stated motivation is concrete: clinicians were estimating risk with spreadsheet STS calculators. The bar was never "beat a transformer" — it was "fewer transcription errors, faster turnaround, auditable logic." Scoping ambition to the actual workflow is why the project is useful.

## Results

Per the repository: the stacked ensemble reached a reported R² of 0.81 on the TAVR variant (0.78 main pipeline, MSE 0.04 and 0.12 respectively), with renal failure, prolonged ventilation, and short hospital stay emerging as the strongest mortality predictors. The model is positioned for integration into weekly surgical review workflows to help prioritize care — as decision support, with the fairness and real-time-feed validation work openly listed as next steps.

## Repository

Full pipeline, notebooks, dataset, and documentation: [github.com/Maleek23/cardiac-surgery-predictive-model](https://github.com/Maleek23/cardiac-surgery-predictive-model).

## Related reading

- [Stacking Ensembles That Actually Generalize: Lessons from Clinical Risk Modeling](/research/stacking-ensembles-clinical-risk-modeling/) — the methodology behind this pipeline
- [Validating Models Like a Skeptic: The Outcomes-Analysis Playbook](/research/validating-models-like-a-skeptic/) — the validation discipline this project follows
