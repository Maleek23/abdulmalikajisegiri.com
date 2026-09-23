---
title: "Agentic AI Model Risk Management Platform"
summary: "A personal project: an agentic platform that automates the model-risk identification lifecycle — SR 11-7 classification, validation artifact generation, and pipeline tracking with SLA enforcement and audit trails."
date: "2026-02-01"
tags: ["machine-learning", "risk-management", "software-engineering", "validation"]
draft: false
---

*Personal project, in active development. This is independent work — not affiliated with DTCC or any employer.*

## Overview

Model risk management is drowning in manual process. Classifying a model under SR 11-7, assembling validation artifacts, chasing owners for documentation, tracking review SLAs across a pipeline of dozens of models — most of this is coordination overhead wrapped around judgment calls that genuinely need humans.

This platform attacks the overhead, not the judgment. An agentic AI system that works the model-risk identification lifecycle end to end: ingesting model inventory, proposing SR 11-7 classifications with cited rationale, generating first-draft validation artifacts and memos, and tracking every model through the pipeline with SLA enforcement and a complete audit trail.

## What it does

**Classification.** Given a model's documentation and metadata, the platform proposes an SR 11-7 materiality classification — with the reasoning trace attached, so a human reviewer sees *why*, not just *what*. The human always signs off; the agent does the reading.

**Artifact generation.** Validation memos, finding write-ups, and evidence packets are drafted from structured templates fed by the model's actual documentation and test results. Reviewers edit instead of authoring from blank pages.

**Pipeline tracking.** Every model in the inventory moves through defined lifecycle stages with owners, due dates, and SLA clocks. Breaches escalate automatically. The audit trail records who decided what, when, and on what evidence — the part regulators actually ask about.

## Design principles

- **Humans decide, agents prepare.** No autonomous classification ships without human sign-off. The platform's job is to make the human's review faster and better-evidenced, never to replace it.
- **Evidence over assertions.** Every generated artifact links back to source documents and test outputs. If a claim can't be traced, it doesn't go in the memo.
- **Audit-first architecture.** The trail isn't bolted on afterward — every state transition, classification proposal, and edit is logged as a first-class event.

## Status

In active development since early 2026. The classification workflow and pipeline tracker are functional; artifact generation templates are being iterated against realistic model documentation. Lessons from this build feed directly into my [research notes on model validation](/research/validating-models-like-a-skeptic) — the skepticism in those pieces comes from watching where automation helps and where it confidently invents.
