---
title: "Codifying Engineering Judgment: What an Automated Code-Review Pipeline Should Actually Check"
summary: "Not all review belongs in the pipeline. This article maps the layers of automated code review — deterministic formatting, static analysis, and the semantic layer where it gets interesting (API contracts, migration safety, per-line test coverage, performance budgets) — shows how to codify judgment as checkable review rules, and draws the line automation must not cross."
date: "2026-07-27"
tags: ["software-engineering"]
draft: true
---

*By [Abdulmalik Ajisegiri](/about)*

*Note: this is a general engineering how-to, informed by the approach of codifying agent skills in the public QuantEdgeResearch repo (Maleek23 on GitHub), whose `.agents/skills/` directory ships a code-reviewer skill built around checklists and scripted checks. It is not a description of that repo's internal code or any employer system, and all code and configuration below is illustrative — realistic patterns you can adapt, not copied implementations.*

> **Companion repository:** [QuantEdgeResearch](https://github.com/Maleek23/QuantEdgeResearch)

Most automated code review is theater. A linter runs in CI, a bot comments "consider using a const here," and the team congratulates itself on having a "review pipeline" while the real bugs — the unvalidated request body, the migration that locks the table, the endpoint with no contract test — sail through untouched. Meanwhile, the reviews that do matter get drowned in noise: twelve advisory comments about line length, zero about the fact that the new API route has no input validation.

The problem isn't tooling. It's that teams never decided what belongs in the pipeline and what doesn't. This article draws that line: the three layers of automated review, how to codify real engineering judgment as checkable rules, the pipeline shape that runs them, and the failure modes that turn good rules into cargo cult.

## The three layers

### Layer 1: Formatting and lint — solved, deterministic

Formatting, import ordering, basic style rules: this layer is a solved problem and has no business appearing in human review. `prettier --check`, `ruff format --check`, `gofmt -l`, `cargo fmt --check` — run them as pre-commit hooks or CI gates, fail the build, done. Any comment a human reviewer has ever made that a formatter could have made instead is a process failure, not a code smell.

The rule for this layer: **if the check is deterministic and the fix is mechanical, it should never reach a human.** Not as a comment, not as a suggestion — the diff should arrive pre-formatted. Auto-fix where safe (`--fix` in a pre-commit hook), gate where not.

### Layer 2: Static analysis — bug patterns and taint

One step up: tools that find known-bad patterns without running the code. Type checkers (`tsc --noEmit`, `mypy --strict`), security scanners (Semgrep, CodeQL, Bandit), taint trackers that follow untrusted input from source to sink. This layer catches a real class of defects — SQL injection via string concatenation, use of deprecated crypto, missing null checks — with a manageable false-positive rate *if* you curate the ruleset.

The discipline here is subtraction. A static analysis tool with 400 rules enabled will produce 400 reasons to ignore the tool. Start with a small, high-signal ruleset: the OWASP-relevant rules, the type-checker at strict, the half-dozen project-specific patterns you've actually been bitten by. Every rule must earn its place by having caught a real bug; rules that have never fired on a genuine defect get disabled. Signal-to-noise is the entire game at this layer.

### Layer 3: Semantic checks — the interesting layer

This is where automated review stops being about *form* and starts being about *meaning* — and it's the layer most teams never build. Semantic checks verify properties of the change that require understanding what the code *does*, not just how it looks:

- **API contract enforcement.** Every new public endpoint must declare its request/response shape. If the project uses Zod (or Pydantic, or JSON Schema), the rule isn't "consider validating input" — it's "no `req.body` access without a schema parse in the same handler." Checkable, precise, falsifiable.
- **Migration safety.** Does the migration add a `NOT NULL` column without a default on a table with rows? Does it create an index without `CONCURRENTLY` (or the equivalent) on a large table? These are judgment calls senior engineers make from scar tissue — and they're entirely encodable.
- **Test coverage of changed lines.** Not aggregate coverage (a vanity metric), but: *every line this PR adds or modifies must be executed by the test suite, and every new branch must be asserted on both sides.* `diff-cover` plus a branch-coverage requirement turns "we have 87% coverage" into "this change is actually tested."
- **Performance budgets.** The new endpoint must respond within the p95 budget in the load test. The migration must complete within the deploy window on a production-sized dataset. The bundle size delta must stay under the threshold. Budgets are just contracts with numbers.

The semantic layer is where codified judgment lives, because every check here encodes a lesson: *we got burned by X, so now X is a rule.* Which brings us to the mechanism.

## Codifying judgment as review rules

The pattern that works — and the one the QuantEdgeResearch project's skills library gestures at — is to write review knowledge the way you'd write it for a smart, tireless, literal-minded junior reviewer: precise, checkable instructions, each with a rationale and a severity. A rule that says "validate your inputs" is a platitude. A rule that says what *counts* as validation is a check.

Here's what that looks like in practice. A YAML rule pack for an API-heavy TypeScript service:

```yaml
# review-rules/api-safety.yaml
# Illustrative review rules — adapt the specifics to your stack.
version: 1
rules:
  - id: API-001
    title: "Public endpoints must validate request bodies"
    severity: block
    check: >
      For every new or modified exported route handler, assert that
      every access to req.body, req.query, or req.params is preceded
      (in the same handler or its middleware chain) by a parse call
      against a Zod schema (z.object(...).parse / .safeParse).
    rationale: >
      Unvalidated input is the root cause of most injection and
      type-confusion bugs. "The client sends the right shape" is
      not a validation strategy.
    exempt_when:
      - "handler is internal-only and documented as such"
      - "framework-level validation already applied (e.g. tRPC procedure input)"

  - id: API-002
    title: "New public endpoints need a contract test"
    severity: block
    check: >
      For every new route, assert the existence of a test that sends
      a request and asserts on the response *shape* (status + schema),
      not just that it doesn't throw. A 200 with the wrong payload
      is a silent contract break.
    rationale: >
      Endpoints without contract tests drift. The test is the
      executable version of the API documentation.

  - id: API-003
    title: "Error responses must not leak internals"
    severity: advisory
    check: >
      Flag any error path that returns err.message, stack traces,
      or database error strings directly to the client.
    rationale: >
      Information disclosure aids attackers and confuses clients.
      Log the detail server-side; return a stable error code.
```

And the markdown skill-file form — the same knowledge written for an agent rather than a script. This is the shape agent-skills libraries use: a named skill with a checklist the agent works through on every review:

```markdown
# Skill: migration-safety-review
# Illustrative — the shape of a codified review skill.

## When to apply
Any PR that adds or modifies a database migration.

## Checklist
1. **Backwards compatibility.** Can the old code run against the new
   schema? If the migration renames a column, the deploy breaks
   between the migration step and the code step. Prefer additive
   changes: add the new column, backfill, then remove the old one
   in a later release.
2. **Lock behavior.** Flag `ADD COLUMN ... NOT NULL` without a
   default, `CREATE INDEX` without CONCURRENTLY, and any
   `ALTER TABLE` that rewrites the table, on tables above the
   size threshold documented in `docs/db/table-sizes.md`.
3. **Down migration.** Every `up` must have a tested `down`.
   "We'll never roll back" is famous last words — verify the
   down migration actually runs against a migrated database.
4. **Data migration vs. schema migration.** If the migration
   transforms data (not just schema), it belongs in a separate,
   idempotent, resumable job — not in the deploy-time migration.

## Output
For each violation: the migration file and line, which checklist
item failed, and the concrete fix (e.g. "split into add-column
migration + backfill job").
```

Notice what makes these *rules* rather than *advice*: each one names the exact condition to check, the severity if it fails, and the exemption conditions. A rule without an exemption clause is a rule that will be circumvented — engineers route around checks that can't distinguish legitimate exceptions, and once they learn to ignore one rule, they learn to ignore all of them.

The implementation can be scripts (AST greps, Semgrep rules, small checkers run in CI), agent prompts, or both. The format matters less than the property: **a new team member — human or agent — should be able to apply the rule the same way twice.** If two reviewers read the rule and reach different verdicts, the rule isn't finished.

## The pipeline shape

Rules are only as good as their placement. Slow, thorough checks in the wrong stage get skipped; fast checks in the wrong stage waste everyone's time. The shape that works:

**Pre-commit: the fast, deterministic layer.** Formatters, import sorting, the quick linter pass. Under a few seconds, runs locally, auto-fixes where safe. Nothing here should ever produce a CI failure that surprises the author — if it fails in CI, it should have failed locally, which means the hook setup is broken, not the code.

**PR-time: the deep layer.** Type checking, the curated static-analysis ruleset, the semantic checks (contract tests, migration safety, diff coverage), the agent reviewer working through its skills. This is allowed to take minutes. Results post as review comments with severity attached.

**Severity tiers with teeth:**

- **Block:** the PR cannot merge. Reserved for checks with near-zero false positives: unvalidated input on a public endpoint, a migration that locks a large table, type errors, failing tests. A block that fires incorrectly is an emergency — fix the rule the same day, because every false block teaches the team that the pipeline lies.
- **Advisory:** the PR can merge, but the comment stands as a record. Style-adjacent concerns, performance observations, "this works but here's the cheaper query." Advisory comments that are never acted on are noise — track the action rate per rule.
- **FYI / informational:** metrics, not judgments. Coverage delta, bundle size delta, dependency diff. No action expected; the data is there for the human reviewer.

The critical invariant: **block-tier checks must be fast enough and accurate enough that nobody develops a habit of overriding them.** The moment "just bypass the check" becomes normal workflow, the tier system is dead. Keep the block list short — five to ten rules, each one a hill worth dying on.

## What automation must NOT do

Here's the line, and it's load-bearing: automation encodes judgment that has already been earned. It cannot substitute for judgment that hasn't been.

**Architecture decisions stay human.** "Should this be a new service or a module?" "Is eventual consistency acceptable here?" "Do we take the dependency on this library?" These questions require intent — knowledge of where the product is going, what the team can maintain, which trade-offs the business has chosen. No rule pack encodes that, because the answers change as the context changes. A reviewer bot that opines on architecture is a random-number generator with extra steps.

**Product trade-offs stay human.** Shipping the slightly-wrong thing fast versus the right thing slow is a judgment call about the market, the users, and the runway. The pipeline can tell you the code is correct; it cannot tell you the code is *worth writing*.

**Anything requiring intent stays human.** The pipeline sees what the code does. It doesn't know what the author meant. "This function is subtly wrong" is checkable; "this function solves the wrong problem" requires understanding the problem, which requires being in the room where the problem was discussed.

So what does the human reviewer actually do, once the robots handle the mechanical layer? The job description gets *better*, not smaller:

1. **Verify intent alignment.** Does this change do what the PR description claims? Does it solve the problem it claims to solve? The pipeline checks the code; the human checks the story.
2. **Judge the trade-offs.** Performance versus readability. Generality versus simplicity. The pipeline can flag that a query is slow; only a human can decide the slowness is acceptable because the feature is temporary.
3. **Own the exemptions.** Every rule has exemption clauses, and someone has to adjudicate them honestly. "This is internal-only" is a claim that needs a skeptical reader.
4. **Evolve the rules.** Every production incident should end with the question: *is there a check that would have caught this?* The human reviewer is the pipeline's product manager — curating the ruleset, killing rules that rot, writing new ones from fresh scar tissue.

The reviewer stops being a human linter and becomes what they were always supposed to be: the person who understands *why*.

## Failure modes

Automated review fails in predictable ways. Knowing them in advance is half the defense.

**Rule rot.** A rule written for last year's architecture fires on this year's code. The Zod rule blocks a tRPC migration where validation happens at the procedure layer. Nobody updates the rule; everybody learns to click "override." Then the override habit spreads to the rules that still matter. Defense: every rule has an owner and a review date. Rules without owners get deleted — an unmaintained rule is worse than no rule, because it trains contempt.

**Alert fatigue.** The advisory tier grows unboundedly because adding a rule is easier than removing one. The PR has forty comments; the author reads none of them; the one comment that mattered drowns. Defense: budget the advisory tier. If a rule's comments are actioned less than, say, a quarter of the time over a rolling window, it gets demoted to FYI or deleted. Attention is the scarcest resource in review — spend it like money.

**The cargo-cult checklist.** The checklist exists, so the thinking stops. "All boxes ticked" becomes the definition of good code, and reviewers stop asking whether the boxes are the *right* boxes for this change. This is the subtlest failure because it looks like success: green checks everywhere, and a codebase slowly filling with code that passes every rule and solves nothing well. Defense: the checklist is a floor, not a ceiling, and the human reviewer's job description (above) says so explicitly. The moment "the pipeline passed" is treated as "the code is good," you've automated the appearance of review while deleting its substance.

**Metric gaming.** Diff-coverage requirements produce tests that execute lines without asserting anything. Contract-test requirements produce tests that assert `status === 200` and nothing else. Any check that can be satisfied without the underlying property becomes a tax on honesty. Defense: write the checks to verify the *property*, not the *artifact* — the rule above says "asserts on the response shape, not just that it doesn't throw" for exactly this reason. And spot-check: periodically audit whether the checks are catching real defects or just generating green.

## The close

The through-line of all of this is simple: **automation should encode the judgment you've already earned, never substitute for the judgment you haven't.**

Every block-tier rule should trace back to a real incident, a real outage, a real 2 a.m. page. That's what "earned" means — the team paid for the lesson, and the rule is how the team keeps the receipt. Rules written from imagined futures ("someone *might* forget to validate input") rot; rules written from real pasts ("the unvalidated webhook took down prod in March") stick, because everyone remembers March.

And the corollary: if the team hasn't earned the judgment yet — if you're still figuring out the architecture, still discovering what matters — don't automate the review. A young codebase needs human reviewers arguing about trade-offs far more than it needs a pipeline enforcing rules nobody believes in yet. Codify late, not early. The checklist is a monument to lessons learned; building the monument before the lessons is just superstition with YAML.

Build the layers. Write the rules precisely. Keep the block list short and honest. Let the humans do the thinking. And every time the pipeline catches something real, remember: it caught it because someone once got burned — and was disciplined enough to write it down.

## Related reading

- [Zod at the Boundary: Validating Every Byte That Enters Your API](/research/zod-at-the-boundary-api-validation/)
- [Validating Models Like a Skeptic: The Outcomes-Analysis Playbook](/research/validating-models-like-a-skeptic/)
