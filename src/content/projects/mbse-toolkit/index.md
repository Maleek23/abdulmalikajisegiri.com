---
title: "MBSE Toolkit"
summary: "Utilities for model-based systems engineering: requirements parsing, traceability matrix generation, and SysML helpers."
date: "2026-09-18"
tags: ["mbse", "sysml", "requirements", "python"]
draft: true
# TODO: add repoUrl: https://github.com/Maleek23/mbse-toolkit once the repo exists
---

## Problem

Model-based systems engineering tooling sits at two unhelpful extremes: expensive, heavyweight enterprise suites that small teams can't justify, or nothing at all. Engineers doing real MBSE work in the middle — modeling in whatever tool is available, documenting in whatever format the project inherited — need lightweight utilities for the unglamorous chores: pull structured requirements out of documents, build traceability matrices, and sanity-check model exports without firing up a five-figure license.

Traceability is the specific casualty. Everyone agrees requirement-to-design-to-verification tracing matters; almost nobody maintains it by hand past the first design review. Without tooling that makes tracing cheap, it rots — and a rotted traceability matrix is worse than none, because it looks like coverage.

## Approach

The toolkit is a set of small, composable Python utilities, each doing one MBSE chore well. The philosophy is deliberately anti-framework: plain data structures in, plain data structures out, so the tools slot into whatever workflow a project already has instead of demanding a new one.

### Requirements parsing

Structured requirements documents (and the semi-structured ones projects actually produce) get parsed into a canonical requirement record: ID, text, rationale, source, and any verification method already stated. The parser is tolerant of the formatting inconsistencies real documents contain, and it reports what it couldn't parse instead of silently dropping it — a parser that quietly eats requirements is a hazard.

### Traceability that survives contact with projects

The traceability module builds matrices linking requirements to design elements to verification activities, then runs coverage and gap analysis: which requirements have no design coverage, which design elements trace to nothing, which verifications are orphaned. The key design decision is that the trace data lives in a simple, diffable format (so it works with version control and code review) rather than a proprietary database.

### SysML and verification helpers

Helpers for working with SysML model interchange (XMI) exports — extracting requirement and block structures for cross-checking against the parsed documents — plus requirement-to-test-plan coverage checks that flag the classic failure: a test plan that doesn't actually cover the requirements it claims to.

## Architecture

```
mbse_toolkit/
├── requirements/     # parsers for structured requirement documents
│   └── canonical.py  # the canonical requirement record
├── traceability/     # trace matrix builder, coverage & gap analysis
│   └── diffable.py   # version-control-friendly trace format
├── sysml/            # helpers for SysML model interchange (XMI)
└── verification/     # requirement-to-test-plan coverage checks
```

## Tech stack

Python · lxml · pandas · openpyxl

## Status

In development. Requirements parsing and traceability matrix generation are the first modules being built out, since they're the foundation the rest depends on. No public release yet.

## Related

- [Model-Based Systems Engineering](/mbse)
- [Systems Engineering](/systems-engineering)
- Model-Based Systems Engineering and Requirements Traceability — in the research pipeline
