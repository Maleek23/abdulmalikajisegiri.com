---
title: "QuantEdge Labs"
summary: "An end-to-end trading research platform — ML-calibrated opportunity scoring, options analytics, and simulation-based verification, shipped as a full-stack web terminal."
date: "2025-01-15"
tags: ["quantitative-finance", "machine-learning", "software-engineering", "web-development", "risk-management"]
draft: false
demoUrl: "https://quantedgelabs.net"
repoUrl: "https://github.com/Maleek23/QuantEdgeResearch"
---

## Overview

QuantEdge Labs is a trading research platform I have been building since January 2025: an end-to-end system that scans daily opportunities, scores them with ML-calibrated probability models, and verifies strategies in simulation before any capital is risked. The live product runs at [quantedgelabs.net](https://quantedgelabs.net); the public research repository holds the platform and research codebase.

The core loop is deliberately unglamorous: generate candidate opportunities from technical-indicator modules, score each one with a calibrated probability model, size the position dynamically from the score and the risk budget, and define the entry and exit in risk-adjusted terms before the trade exists. Nothing enters the book without passing through simulation-based verification — across 150+ daily opportunities, the system replays its logic against historical conditions rather than trusting backtest summaries.

## Architecture

The public repository shows the platform as a TypeScript monorepo with three cooperating layers — a layout the architecture doc in the repo describes as a React frontend, an Express service layer, and a Postgres data layer:

- **Frontend (React terminal).** A multi-page trading terminal: watchlists, options chains, LEAPS screeners, backtest views, and research dashboards. The repo's component library is built on Radix primitives with a shared design system, and the terminal supports command-palette navigation across its views.
- **Server (Express services).** The service layer handles market-data ingestion, options analytics, screening pipelines, and research jobs. Drizzle ORM with Postgres (Neon serverless) backs persistence, with an in-memory layer for hot paths.
- **Research scripts.** A large collection of standalone analysis scripts — LEAPS screeners, upside analyzers, flow probes — that run outside the request path. This separation is deliberate: research iteration happens in disposable scripts, and only proven logic graduates into services.

Deployment is containerized (Dockerfile) with Railway configs for the web and worker processes, plus environment templates for API keys. LLM SDKs (Anthropic, Google) are wired in for research assistance — summarizing screen results, drafting research notes — not for making trading decisions.

## Key engineering decisions

**Simulation before conviction.** The most important architectural choice is procedural, not technical: every strategy change is verified in simulation across the full daily opportunity set before it touches anything real. A backtest that only reports aggregate returns is a story; replaying entry/exit logic bar-by-bar across hundreds of opportunities is evidence. The platform is built around the second.

**Automated OCC symbol generation.** Options workflows die on symbology friction — translating between human-readable contracts and OCC option symbols by hand is slow and error-prone. The platform generates OCC symbols programmatically from expiry, strike, and put/call, so screeners, chains, and order logic all speak the same contract language without manual mapping.

**ML calibration, not ML magic.** The probability scoring is framed as calibration: the question is not "will this trade win" but "when the model says 65%, does it win 65% of the time?" Indicator modules produce features; the model produces probabilities; a calibration layer keeps the probabilities honest. An uncalibrated 70% is worse than useless — it sizes positions on a lie.

**Dynamic position sizing from risk, not confidence alone.** Position size is a function of the calibrated edge and the portfolio's risk budget, with hard caps. The sizing logic treats a high-probability, low-edge setup differently from a moderate-probability, high-edge one — expected value per unit of risk, not raw win rate, drives capital allocation.

**Research scripts stay disposable.** The repo's dozens of scratch and probe scripts are a feature, not mess: they are the lab notebook. Anything that survives contact with data gets rewritten as a service with tests; anything that doesn't gets deleted. The `.agents` and audit documents in the repo record this discipline — periodic logic audits of the platform's own calculations.

## Results

As reported on the project: simulation-based verification runs across 150+ daily opportunities, with the full pipeline — indicator modules, calibrated scoring, OCC symbol generation, dynamic sizing, risk-adjusted entry/exit — operating as one system rather than a collection of notebooks. The platform's own documentation tracks its evolution through redesign audits and research-grade checklists, which is the honest state of an actively built system: improving, instrumented, and still being hardened.

## Repository

The public codebase — platform services, terminal client, research scripts, and architecture documentation — is at [github.com/Maleek23/QuantEdgeResearch](https://github.com/Maleek23/QuantEdgeResearch). The live product is at [quantedgelabs.net](https://quantedgelabs.net).

