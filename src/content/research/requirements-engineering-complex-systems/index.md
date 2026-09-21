---
title: "From Stakeholder Needs to Verification: Requirements Engineering for Complex Systems"
summary: "Elicitation to verification: writing requirements that are actually verifiable and tracing them end to end."
date: "2026-07-18"
tags: ["software-engineering"]
draft: true
---

*By [Abdulmalik Ajisegiri](/about)*

Most system failures are requirements failures. The hardware usually does what it was built to do — the problem is it wasn't built to do the right thing. Somewhere between a stakeholder saying what they want and an engineer testing what got delivered, intent got lost. Requirements engineering is the discipline of making sure that doesn't happen: eliciting real needs, writing them as verifiable requirements, managing them through change, and tracing them all the way to verification.

## Needs are not requirements

The first and most common error is treating stakeholder needs as requirements. They aren't. A need is a problem statement: "operators can't keep up with alert volume during peak events." A requirement is a verifiable statement about the system: "The system shall allow an operator to acknowledge and categorize at least 40 alerts per minute with no more than two interactions per alert."

The translation from needs to requirements is where engineering judgment lives. Needs are fuzzy, often contradictory, and expressed in the language of pain rather than design. Requirements must be precise, consistent, and testable. Every requirement that survives this translation should be justifiable: if nobody can articulate which stakeholder need it serves, it shouldn't exist. Untraceable requirements are scope without a customer.

## Elicitation without chaos

Elicitation is often treated as "asking people what they want." That produces wish lists. Disciplined elicitation uses several techniques because no single one surfaces the full picture:

- **Interviews** — structured conversations with stakeholders, focused on goals and constraints rather than solutions. The hardest question to ask is also the most useful: "what would happen if this system didn't exist?"
- **Workshops and scenario walkthroughs** — getting stakeholders in one room to act out operational scenarios. Contradictions between stakeholders surface here instead of in integration testing, where they cost ten times more.
- **Observation** — watching the actual work being done. What people say they do and what they do routinely differ, and the system has to support the real workflow.
- **Prototype and mock feedback** — putting something concrete in front of users early. People critique specifics far better than they articulate abstractions.
- **Analysis of existing systems and documents** — legacy systems, regulations, and interface agreements contain requirements nobody remembers but everyone depends on.

The output of elicitation is not a requirements document — it's an understanding. Requirements come next.

## Writing requirements that can be verified

A requirement you can't verify is a wish. The classic criteria, in the spirit of the SMART framing, are that each requirement should be:

- **Unambiguous** — one plausible interpretation. "Fast response time" means nothing; "95th-percentile response under 200 ms at rated load" means one thing.
- **Verifiable** — there must exist a feasible method (test, demonstration, inspection, analysis) that can determine whether it's satisfied. If you can't describe how you'd verify it, rewrite it.
- **Singular** — one requirement per statement. Compound requirements can't be traced or tested cleanly.
- **Feasible** — achievable within the project's constraints. Aspirational requirements masquerading as real ones poison the baseline.
- **Traceable** — linked to its source need and forward to design, implementation, and verification.

A few more rules from hard experience. Use **"shall"** for requirements and reserve "should," "may," and "will" for their standard meanings — "will" describes facts about the environment, not system behavior. Banish vague qualifiers: *robust, efficient, user-friendly, state-of-the-art* have no place in a requirement; each must be replaced with something measurable. And write requirements about the system, not the design: "the system shall authenticate users" is a requirement; "the system shall use OAuth 2.0" is a design decision wearing a requirements costume (unless the interface constraint genuinely comes from a stakeholder).

## Classification: functional, non-functional, constraints

Not all requirements are the same shape, and they don't get verified the same way:

- **Functional requirements** — what the system does: inputs, behaviors, outputs. Usually verified by test.
- **Non-functional requirements** — how well it does it: performance, reliability, availability, safety, security, usability, maintainability. These are where projects most often fail, because they're harder to write measurably and easier to defer. A system that meets every functional requirement but misses its availability target has failed.
- **Constraints** — boundaries on the solution space: standards compliance, interface requirements, technology mandates, regulatory obligations, cost and schedule limits. Constraints aren't negotiable the way other requirements are; they come from outside the project.

Non-functionals deserve special attention because they drive architecture. "Support 10,000 concurrent users" and "recover from primary site failure within 15 minutes" are architectural commitments disguised as bullet points. Identifying them early — and writing them verifiably — is one of the highest-leverage activities in systems engineering.

## Managing change

Requirements change. Pretending otherwise produces a baseline that's fiction on arrival. What matters is *controlled* change:

- **Baseline and version** requirements like code. Every change is recorded, reviewed, and approved — not because bureaucracy is fun, but because an uncontrolled change in week 40 breaks a design decision made in week 6.
- **Assess impact before approving.** A requirement change ripples through design, implementation, test plans, and other requirements. Impact analysis — what touches this requirement, and what does this requirement touch — should precede approval, not follow it.
- **Keep the rationale.** When a requirement changes, record *why*. Six months later, someone will ask whether the old version can come back, and the rationale is the only thing standing between you and relearning the lesson the expensive way.

The enemy isn't change; it's untracked change. A project where requirements drift silently will eventually discover that the system being verified is not the system that was designed.

## Tracing end to end

Traceability is the connective tissue: every requirement links backward to its source need and forward through design elements, implementation, and verification activities. A complete traceability structure answers four questions for any requirement:

1. Where did it come from? (source need or constraint)
2. What design realizes it? (architecture elements, components)
3. How is it implemented? (code, configuration, procedures)
4. How is it verified? (test case, inspection, analysis)

The classic artifacts are the **requirements traceability matrix** and, in model-based practice, trace links inside the system model itself. But the artifact is secondary; what matters is coverage analysis. Untraced design elements are gold-plating. Requirements with no verification activity are unverified. Verification activities with no parent requirement are testing without a purpose. Running these checks regularly — not once before delivery — is what keeps the chain honest.

## Verification methods per requirement type

Every requirement should declare its verification method at the time it's written, because the method constrains how the requirement must be phrased:

- **Test** — exercising the system under controlled conditions and measuring the outcome. The default for functional and performance requirements.
- **Demonstration** — operating the system in a realistic scenario and observing behavior, without quantitative measurement. Useful for usability and operational workflows.
- **Inspection** — visual or documentary examination: code review, drawing review, checking that a label exists. Cheap and underused.
- **Analysis** — using models, simulations, or calculations to show a requirement is met where testing is impractical (reliability predictions, structural margins, worst-case timing analysis).

The method must be credible for the claim. Claiming a reliability requirement is "verified by inspection" is the kind of thing that looks fine in a matrix and collapses under any serious review.

## The thread, not the phase

Requirements engineering is sometimes treated as a phase that ends when design begins. It doesn't end — it becomes the thread that every other activity hangs from. Design answers requirements; implementation realizes design; verification confirms requirements are met; validation confirms the requirements were the right ones. When the thread breaks anywhere, the system fails in ways that no amount of downstream excellence can fix.

Write requirements as if the person verifying them has never met you, has no goodwill toward your design, and will hold you to the letter of every word. Because eventually, that's exactly who verifies them.

## Related

- [Systems Engineering](/systems-engineering)
- [Model-Based Systems Engineering](/mbse)
- [Engineering](/engineering)
