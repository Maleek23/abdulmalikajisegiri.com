---
title: "From Stakeholder Needs to Verification: Requirements Engineering for Complex Systems"
summary: "Elicitation to verification: writing requirements that are actually verifiable and tracing them end to end."
date: "2026-07-18"
tags: ["software-engineering"]
draft: false
image: "/research/requirements-engineering-complex-systems/og.png"
---

*By [Abdulmalik Ajisegiri](/about)*

*Running example: this article threads one toy system through every section — a fictional automated parcel-sorting facility, invented to make the method concrete. Nothing in it describes a real program, product, or employer process.*

Most system failures are requirements failures. The hardware usually does what it was built to do — the problem is it wasn't built to do the right thing. Somewhere between a stakeholder saying what they want and an engineer testing what got delivered, intent got lost. Requirements engineering is the discipline of making sure that doesn't happen: eliciting real needs, writing them as verifiable requirements, decomposing and allocating them to the pieces of the system, managing them through change, and tracing them all the way to verification.

It is a lifecycle discipline, not a document. The output isn't a specification that gets thrown over a wall — it's a living structure that design answers, implementation realizes, and verification checks. Everything below describes how to build and maintain that structure.

## Needs are not requirements

The first and most common error is treating stakeholder needs as requirements. They aren't. A need is a problem statement: "the sort facility can't clear the peak-season backlog without expensive temp shifts." A requirement is a verifiable statement about the system: "SYS-014 — the system shall sort at least 2,400 parcels per hour at peak load with the standard crew of one operator per line."

The translation from needs to requirements is where engineering judgment lives. Needs are fuzzy, often contradictory, and expressed in the language of pain rather than design. Requirements must be precise, consistent, and testable. Every requirement that survives this translation should be justifiable: if nobody can articulate which stakeholder need it serves, it shouldn't exist. Untraceable requirements are scope without a customer.

Two traps sit inside this translation. The first is **solutioneering in disguise**: stakeholders describe needs in terms of the system they imagine ("we need a faster conveyor"), and the requirement gets written as the imagined solution rather than the underlying need. The real need might be throughput, or it might be fewer mis-sorts, or it might be faster exception handling — and each of those decomposes into a completely different system. The second trap is **conflict avoidance**: two stakeholders want incompatible things, and the analyst writes a requirement vague enough to satisfy both in the meeting. That ambiguity doesn't resolve the conflict; it schedules it for integration testing, where it costs ten times more.

## Elicitation without chaos

Elicitation is often treated as "asking people what they want." That produces wish lists. Disciplined elicitation uses several techniques because no single one surfaces the full picture:

- **Interviews** — structured conversations with stakeholders, focused on goals and constraints rather than solutions. The hardest question to ask is also the most useful: "what would happen if this system didn't exist?"
- **Workshops and scenario walkthroughs** — getting stakeholders in one room to act out operational scenarios. Contradictions between stakeholders surface here instead of in integration testing, where they cost ten times more.
- **Observation** — watching the actual work being done. What people say they do and what they do routinely differ, and the system has to support the real workflow.
- **Prototype and mock feedback** — putting something concrete in front of users early. People critique specifics far better than they articulate abstractions.
- **Analysis of existing systems and documents** — legacy systems, regulations, and interface agreements contain requirements nobody remembers but everyone depends on.

The word "elicitation" matters: it implies the needs are *drawn out*, not gathered. "Gathering" suggests requirements lie around waiting to be picked up; they don't. They have to be constructed from fragments — a complaint here, an observed workaround there, a constraint buried in a ten-year-old interface document.

Two more practices separate real elicitation from theater. **Map the stakeholders before you interview them**: primary users, operators, maintainers, acquirers, regulators, and the people who suffer when the system fails but never get asked. Each group has different needs and different authority, and missing a group means missing requirements that surface late. **Prioritize explicitly**: not everything can be a must-have. A simple must/should/could ranking, done with the stakeholders and recorded with the requirements, forces the hard tradeoffs early — when they're cheap — instead of during acceptance testing.

The output of elicitation is not a requirements document — it's an understanding. Requirements come next.

## Writing requirements that can be verified

A requirement you can't verify is a wish. The classic criteria, in the spirit of the SMART framing, are that each requirement should be:

- **Unambiguous** — one plausible interpretation. "Fast response time" means nothing; "95th-percentile response under 200 ms at rated load" means one thing.
- **Verifiable** — there must exist a feasible method (test, demonstration, inspection, analysis) that can determine whether it's satisfied. If you can't describe how you'd verify it, rewrite it.
- **Singular** — one requirement per statement. Compound requirements can't be traced or tested cleanly.
- **Feasible** — achievable within the project's constraints. Aspirational requirements masquerading as real ones poison the baseline.
- **Traceable** — linked to its source need and forward to design, implementation, and verification.

A few more rules from hard experience. Use **"shall"** for requirements and reserve "should," "may," and "will" for their standard meanings — "will" describes facts about the environment, not system behavior. Banish vague qualifiers: *robust, efficient, user-friendly, state-of-the-art* have no place in a requirement; each must be replaced with something measurable. Write requirements about the system, not the design: "the system shall authenticate users" is a requirement; "the system shall use OAuth 2.0" is a design decision wearing a requirements costume (unless the interface constraint genuinely comes from a stakeholder).

Watch for the quiet killers in draft requirements: **TBD placeholders** that survive into the baseline ("throughput shall be TBD parcels per hour") — a requirement with a hole in it is not a requirement, it's a deferred argument. **Passive voice that hides the actor** ("parcels shall be diverted") — diverted by what, under whose control? And **"as appropriate" clauses**, which hand the requirement's meaning to whoever reads it last. Each of these reads fine in a review and fails in verification.

A requirement also needs more than its sentence. Give each one a small set of attributes:

| Attribute | Example (SYS-015, toy system) |
|---|---|
| ID | SYS-015 |
| Statement | The system shall mis-sort no more than 1 parcel in 5,000 at peak load. |
| Rationale | Mis-sorts are the top driver of customer complaints during peak season. |
| Source | Operations stakeholder workshop |
| Verification method | Test: 10,000 parcels with known destinations at rated load |
| Priority | Must |
| Status | Baselined |

The rationale field is the one teams skip and later wish they hadn't. It's the difference between "SYS-015 exists because mis-sorts drive the top complaint" and an archaeology project six months later when someone proposes relaxing it.

Finally, **assign the verification method when the requirement is written**, not when the test plan is due. Declaring "verified by test at rated load" forces the requirement to be phrased in testable terms; declaring it later lets untestable phrasing calcify. (More on the methods below.)

## Decompose and allocate: one need, many owners

A system-level requirement like SYS-014 doesn't get built by anyone in particular — and that's the problem decomposition solves. **Decomposition** partitions a parent requirement into child requirements whose combined satisfaction guarantees the parent. **Allocation** assigns each child to the architectural element (and the team) responsible for it. Until a requirement has an owner, it's everyone's aspiration and nobody's job.

The discipline is in the arithmetic. The children must **cover** the parent completely — no gaps, no overlaps that double-count margin. If SYS-014 demands 2,400 parcels per hour, the decomposition might allocate a divert-gate cycle time to controls, a belt speed tolerance to mechanical, and an exception-handling budget to the operator interface — and someone has to check that the three together actually deliver 2,400, not 2,100. Gaps here are silent: each team meets its requirement and the system still fails.

![Requirement decomposition and allocation: stakeholder need SN-01 decomposes into system requirements SYS-014, SYS-015, and SYS-022, each allocated to subsystem owners; DER-003 is a derived requirement tracing to a design decision rather than a stakeholder need](./diagram-decomposition-allocation.svg)

*Figure — decomposition turns one system requirement into several owned ones; allocation assigns each to a subsystem. DER-003 shows a derived requirement, which traces to a design decision instead of a stakeholder need.*

**Derived requirements** deserve their own callout: they emerge from design decisions rather than from stakeholder needs. Choosing a particular sensor forces a debounce-filter requirement; choosing a distributed architecture forces a clock-synchronization requirement. Derived requirements are legitimate, but they must be recorded as derived, with the design decision as their parent — otherwise they look like stakeholder demands and can never be traded away when the design changes.

Three rules keep decomposition honest: **one owner per allocated requirement** (shared ownership is no ownership); **no orphan children** (every child traces to exactly one parent); and **no parent left uncovered** (the union of the children satisfies the parent — verified, not assumed).

An allocation table makes the arithmetic explicit. Each row should say how the child's satisfaction rolls up to the parent — if you can't write that sentence, the decomposition is incomplete:

| Parent (system) | Allocated to | Child (subsystem) | How it covers the parent |
|---|---|---|---|
| SYS-014: ≥ 2,400 parcels/hr | Controls | CTL-041: divert-gate cycle ≤ 300 ms | Gate-cycle budget × lane count sustains the rate |
| SYS-014 | Mechanical | MEC-103: belt speed 2.5 m/s ± 2% | Throughput model at rated speed |
| SYS-015: mis-sort ≤ 1/5,000 | Controls | CTL-052: misread detection within 2 s | Seeded-misread test at rated load |
| SYS-022: one operator per line | HMI software | HMI-207: exception resolved in ≤ 2 taps | Timed demonstration with operators |

## Classification: functional, non-functional, constraints

Not all requirements are the same shape, and they don't get verified the same way:

- **Functional requirements** — what the system does: inputs, behaviors, outputs. Usually verified by test.
- **Non-functional requirements** — how well it does it: performance, reliability, availability, safety, security, usability, maintainability. These are where projects most often fail, because they're harder to write measurably and easier to defer. A system that meets every functional requirement but misses its availability target has failed.
- **Constraints** — boundaries on the solution space: standards compliance, interface requirements, technology mandates, regulatory obligations, cost and schedule limits. Constraints aren't negotiable the way other requirements are; they come from outside the project.

Non-functionals deserve special attention because they drive architecture. "Sort 2,400 parcels per hour at 99.5% availability" and "recover from a primary controller failure within 60 seconds" are architectural commitments disguised as bullet points. Identifying them early — and writing them verifiably — is one of the highest-leverage activities in systems engineering.

The classification also guides the verification method — each type has a natural default:

| Type | Toy-system example | Typical verification |
|---|---|---|
| Functional | SYS-022: exception flow | Test |
| Non-functional: performance | SYS-014: throughput at rated load | Test at rated load |
| Non-functional: reliability | Controller MTBF target | Analysis, then test |
| Non-functional: usability | HMI-207: two-tap resolution | Demonstration with operators |
| Constraint | Chute interface per ICD-7 | Inspection |

## Managing change

Requirements change. Pretending otherwise produces a baseline that's fiction on arrival. What matters is *controlled* change:

- **Baseline and version** requirements like code. Every change is recorded, reviewed, and approved — not because bureaucracy is fun, but because an uncontrolled change in week 40 breaks a design decision made in week 6.
- **Assess impact before approving.** A requirement change ripples through design, implementation, test plans, and other requirements. Impact analysis — what touches this requirement, and what does this requirement touch — should precede approval, not follow it.
- **Keep the rationale.** When a requirement changes, record *why*. Six months later, someone will ask whether the old version can come back, and the rationale is the only thing standing between you and relearning the lesson the expensive way.

A small **change control board** — the analyst, the architect, and the test lead, not a committee of twelve — makes this workable. Most changes are routine and should flow fast; the board exists for the ones with blast radius. And bidirectional traceability (below) is what makes impact analysis possible at all: without forward traces, "what does this requirement touch" is a guess.

One metric is worth tracking: **requirements volatility** — the rate at which requirements change per unit time. Some churn is healthy; a persistently high rate means the needs were never stable, the elicitation was shallow, or stakeholders are designing through change requests. Volatility is a leading indicator of schedule trouble, and it's measurable from week one.

The enemy isn't change; it's untracked change. A project where requirements drift silently will eventually discover that the system being verified is not the system that was designed.

## Tracing end to end

Traceability is the connective tissue: every requirement links backward to its source need and forward through design elements, implementation, and verification activities. A complete traceability structure answers four questions for any requirement:

1. Where did it come from? (source need or constraint)
2. What design realizes it? (architecture elements, components)
3. How is it implemented? (code, configuration, procedures)
4. How is it verified? (test case, inspection, analysis)

The classic artifacts are the **requirements traceability matrix** and, in model-based practice, trace links inside the system model itself. But the artifact is secondary; what matters is coverage analysis. Untraced design elements are gold-plating. Requirements with no verification activity are unverified. Verification activities with no parent requirement are testing without a purpose. Running these checks regularly — not once before delivery — is what keeps the chain honest.

Traceability also runs in the other direction, and the reverse question matters just as much: for every stakeholder need, is there a chain of requirements, design, and verification that satisfies it? Forward tracing catches orphans in the design; **backward tracing catches unmet needs**. A need with no requirement is a promise the project never made — and the stakeholder will still expect it kept.

## Verification methods per requirement type

Every requirement should declare its verification method at the time it's written, because the method constrains how the requirement must be phrased:

- **Test** — exercising the system under controlled conditions and measuring the outcome. The default for functional and performance requirements.
- **Demonstration** — operating the system in a realistic scenario and observing behavior, without quantitative measurement. Useful for usability and operational workflows.
- **Inspection** — visual or documentary examination: code review, drawing review, checking that a label exists. Cheap and underused.
- **Analysis** — using models, simulations, or calculations to show a requirement is met where testing is impractical (reliability predictions, structural margins, worst-case timing analysis).

The method must be credible for the claim. Claiming a reliability requirement is "verified by inspection" is the kind of thing that looks fine in a matrix and collapses under any serious review. And note the direction of influence: choosing the method early is what forces requirements into verifiable shape. "The system shall be maintainable" survives until someone has to declare *how* — inspection against a coding standard, analysis of mean-time-to-repair, demonstration of a module swap — and then it gets rewritten into something real, or exposed as a wish.

## The thread, not the phase

Requirements engineering is sometimes treated as a phase that ends when design begins. It doesn't end — it becomes the thread that every other activity hangs from. Design answers requirements; implementation realizes design; verification confirms requirements are met; validation confirms the requirements were the right ones. When the thread breaks anywhere, the system fails in ways that no amount of downstream excellence can fix.

Write requirements as if the person verifying them has never met you, has no goodwill toward your design, and will hold you to the letter of every word. Because eventually, that's exactly who verifies them.

## Related

- [Systems Engineering](/systems-engineering)
- [Model-Based Systems Engineering](/mbse)
- [Engineering](/engineering)
