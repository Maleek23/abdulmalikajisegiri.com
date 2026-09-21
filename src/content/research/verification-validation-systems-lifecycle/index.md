---
title: "Verification and Validation Across the Systems Lifecycle"
summary: "V&V isn't a phase — it's a thread. How verification and validation activities map across the lifecycle."
date: "2026-07-22"
tags: ["validation", "software-engineering"]
draft: true
---

*By [Abdulmalik Ajisegiri](/about)*

## The distinction that matters

Verification and validation answer two different questions, and confusing them is one of the most expensive mistakes in systems engineering:

- **Verification** asks: *did we build the system right?* Does the implementation conform to its specified requirements?
- **Validation** asks: *did we build the right system?* Does the system, in its actual operating environment, satisfy stakeholder needs?

A system can pass verification completely and fail validation utterly — every requirement met, every test green, and the stakeholders reject it because the requirements described the wrong system. Verification without validation produces precision without relevance. Validation without verification produces good intentions without evidence.

Note what this implies: validation can't be fully completed until the system exists in something close to its real environment, operated by something close to its real users. Verification, by contrast, can and should happen continuously — against requirements, against design, at every level of integration.

## V&V is not a phase

The most damaging mental model of V&V is treating it as a phase that happens after implementation — the "testing phase" at the end of the schedule, which is also the first thing compressed when the schedule slips. In reality, V&V is a thread that runs through the entire lifecycle. Different phases demand different V&V activities:

**Concept and requirements phase.** V&V here means validating the requirements themselves: are they complete, consistent, verifiable, traceable to stakeholder needs? Techniques include requirements reviews, traceability analysis, prototyping to validate concepts with stakeholders, and modeling to check feasibility. Catching a bad requirement here costs orders of magnitude less than catching it in system test — the cost-of-change curve is the entire economic argument for early V&V.

**Design phase.** Design verification asks whether the architecture and detailed design satisfy the requirements allocated to them. Methods: design reviews, traceability analysis (every requirement allocated somewhere, every design element justified by a requirement), simulations, and analysis (timing analysis, reliability predictions, interface verification). This is also where test planning begins — verification requirements should be shaping the design while the design is still fluid, not discovered afterward.

**Implementation phase.** Unit and component verification: does each element do what its specification says? Code reviews, static analysis, unit testing, and inspection of non-software elements. The discipline here is matching the verification rigor to the criticality of the component — not everything deserves the same intensity, and pretending it does just spreads effort thin.

**Integration phase.** This is where interface assumptions go to die. Integration verification proceeds bottom-up: components into subsystems, subsystems into the system, each level verified against its allocated requirements before the next level is attempted. Interface testing deserves its own emphasis — a large share of integration failures are interface failures, and interfaces should be verified as early as possible, including with stubs and simulators before the real counterpart exists.

**System test and acceptance.** System-level verification against the full requirements baseline, in an environment as close to operational as achievable. Then validation: acceptance testing with stakeholders, operational test scenarios, and confirmation that the system solves the actual problem. Acceptance criteria should have been agreed during requirements — negotiating them at delivery is a sign the thread broke much earlier.

**Operations and maintenance.** V&V doesn't stop at delivery. Every change, patch, and upgrade needs regression verification; operational data feeds validation (is the system still meeting needs as the environment evolves?); and periodic revalidation catches the slow drift between what the system does and what stakeholders now need.

**Disposal and transition.** Often forgotten entirely. Decommissioning has requirements too — data migration, sanitization, continuity of service during transition — and they need verification like any others.

## Independent V&V

The fox shouldn't guard the henhouse, at least not alone. **Independent verification and validation (IV&V)** — V&V performed by an organization separate from the development team — exists because developers are systematically bad at finding their own errors. They test what they intended to build, not what they built; they share the development team's blind spots and schedule pressures.

Independence comes in degrees, from a separate test team within the same organization to a fully independent contractor. The right degree depends on criticality: for safety-critical or high-consequence systems, genuine organizational independence with its own reporting chain is the standard. For lower-consequence work, separate personnel with separate accountability may suffice.

What independence must not become is isolation. IV&V works when the independent team engages early — reviewing requirements and design, not just testing the finished product. An independent team that first sees the system at acceptance testing can find bugs, but it can't fix the requirements errors that are already cast in concrete.

## Traceability: V&V's infrastructure

Traceability is what makes V&V more than a pile of test reports. The chain runs: stakeholder need → requirement → design element → implementation → verification activity → result. Breaks in this chain are V&V findings in themselves:

- A requirement with no verification activity is an unverified claim.
- A verification activity with no parent requirement is effort without purpose (or a requirement that was never written down).
- A design element with no parent requirement is scope without a customer.

Coverage analysis over these links — run regularly, not once before delivery — is one of the cheapest and most effective V&V activities available. It finds the gaps that testing never will, because testing can only check what someone thought to test.

## V&V planning and reporting

V&V needs its own plan, written early: what will be verified and validated, by whom, using what methods, in what environments, to what criteria, and on what schedule. The plan should be risk-driven — verification intensity follows consequence of failure, not uniformity. A credible plan also defines entry and exit criteria for each V&V activity: under what conditions do we start, and what constitutes "done"?

Reporting should answer three questions for decision-makers: what was verified/validated, what were the results (including failures and their disposition), and what residual risk remains. That last one is the point. V&V doesn't prove a system is correct — it builds a structured, evidence-backed understanding of where confidence is warranted and where it isn't. A V&V report that claims everything passed and mentions no limitations is either describing a trivial system or an unserious process.

## Common failure modes

- **Testing as the only V&V.** Reviews, inspections, analysis, and traceability are V&V too — and they catch different defect classes, earlier and cheaper.
- **Verifying against the design instead of the requirements.** Testing that the system does what the design says, when the design doesn't match the requirements, verifies the wrong thing.
- **Environment infidelity.** Verifying in an environment that doesn't represent operations, then being surprised by operational failures. The gap between test and reality is where risk hides.
- **No regression discipline.** Changes verified in isolation while the system they integrate into is assumed unchanged. Every change re-opens verification obligations.
- **Validation deferred to delivery.** Discovering at acceptance that the requirements were wrong is the most expensive possible time to learn it. Validate early with prototypes, models, and stakeholder reviews.

## The thread, not the gate

V&V done right is continuous, risk-driven, independent where it counts, and traceable end to end. It's not the gate at the end of the process — it's the thread that runs through it, the mechanism by which a project maintains an honest, evidence-backed understanding of what it built and whether it was worth building. Projects that treat V&V as a phase get testing. Projects that treat it as a thread get confidence.

## Related

- [Systems Engineering](/systems-engineering)
- [Model-Based Systems Engineering](/mbse)
- [Engineering](/engineering)
