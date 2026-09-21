---
title: "Using Optimization and Metaheuristics for Engineering Decision Problems"
summary: "When gradient methods aren't enough: genetic algorithms, simulated annealing, and friends for messy engineering trade spaces."
date: "2026-07-13"
tags: ["software-engineering"]
draft: true
---

*By [Abdulmalik Ajisegiri](/about)*

## The decision problem, formalized

Engineering decisions are optimization problems wearing work clothes. Choosing a configuration, allocating resources, sizing components, scheduling operations — each is a search for the best element of some feasible set according to some measure of goodness. Formalizing that search — decision variables, objective function, constraints — is often half the work, because it forces the vague ("make it better") into the precise ("minimize cost subject to these reliability constraints").

The classical toolkit — linear programming, convex optimization, gradient descent and its relatives — handles the well-behaved cases beautifully. But real engineering trade spaces are rarely well-behaved. They are discrete (you can't buy 2.7 pumps), non-convex (the objective has many local optima), multi-objective (cost vs. reliability vs. schedule, with no single answer), noisy (objectives evaluated by simulation), and constrained in ways that are hard to write down. When gradient methods stall on such problems, metaheuristics earn their keep.

## Why classical methods stall

Gradient-based and convex methods make assumptions that messy problems violate:

- **Differentiability.** If the objective is a simulation with stochastic outputs or a lookup table of vendor catalogs, there is no gradient to follow.
- **Convexity.** Non-convex landscapes trap local methods in the nearest valley. Random restarts help, but they are a patch, not a strategy.
- **Continuity.** Discrete and combinatorial decisions — which components, which order, which assignments — live in spaces gradients cannot traverse.
- **Single objective.** Classical methods optimize one thing. Engineering decisions trade off several, and the answer is a Pareto frontier — the set of solutions where no objective improves without another worsening — not a point.

None of this means classical methods are obsolete. It means the first question of any optimization effort is *what kind of problem is this?* If it is convex, continuous, and single-objective, use the classical tools; they give guarantees metaheuristics cannot. Metaheuristics are for the rest.

## A metaheuristic tour

Metaheuristics are high-level search strategies that guide exploration of difficult spaces without requiring the problem's mathematical structure. Three workhorses cover most cases:

**Genetic algorithms (GAs)** maintain a population of candidate solutions and evolve it through selection, crossover, and mutation. They are natural for combinatorial and discrete problems — scheduling, layout, configuration — because the crossover operation combines partial solutions in ways that respect problem structure. Their strength is global exploration; their weakness is slow fine-grained convergence.

**Simulated annealing (SA)** walks a single solution through the space, accepting worse moves with a probability that decreases over time — the "temperature." The physics metaphor is apt: early heat lets the search escape local optima; cooling settles it into a good basin. SA shines on problems with a natural neighborhood structure (swap, insert, perturb) and is simpler to implement and tune than GAs.

**Particle swarm optimization (PSO)** flies a population of particles through continuous space, each pulled toward its own best position and the swarm's best. It is a strong default for continuous, non-convex, moderately-dimensioned problems — fewer moving parts than a GA, better global behavior than pure gradient descent.

Beyond the big three: **tabu search** for combinatorial problems where memory of visited solutions prevents cycling, **differential evolution** for continuous black-box optimization, and **Bayesian optimization** when each objective evaluation is expensive (a simulation taking hours) and the budget is dozens of evaluations, not thousands.

Multi-objective problems deserve **NSGA-II** or similar Pareto-based methods, which return the frontier rather than forcing the objectives into an arbitrary weighted sum. The weighted-sum hack collapses the trade-off before the decision-maker ever sees it — exactly backwards from how engineering decisions should be made.

## Tuning without superstition

Metaheuristics have parameters — population sizes, mutation rates, cooling schedules, inertia weights — and tuning them by folklore produces superstition, not performance. Discipline looks like this:

- **Separate the tuning problem from the decision problem.** Tune the optimizer on a representative test set of problem instances, then freeze the parameters and evaluate on held-out instances. Tuning on the same instance you report results on is the optimization analog of backtest overfitting.
- **Budget the evaluations.** Every method should be compared under the same objective-function evaluation budget — wall-clock fairness, not iteration-count fairness, since one GA generation may cost as much as a hundred SA steps.
- **Report distributions, not best runs.** Metaheuristics are stochastic. Report the mean, median, and spread across multiple random seeds. A method whose "best" beats everything but whose median loses is a lottery ticket.
- **Ablate before you believe.** If the fancy operator doesn't improve on random restarts of a simpler method, the complexity is unjustified. The burden of proof is on the elaborate configuration.

## Avoiding over-tuning to the problem instance

The deepest trap in applied optimization is solving *the instance* rather than *the problem*. An algorithm tuned, seeded, and operator-selected until it produces a beautiful answer on this year's configuration has been overfit to a single draw from the problem distribution — and engineering problems are distributions: next year's loads, costs, and constraints will differ.

Countermeasures mirror those in model validation, because the failure is the same failure:

- **Validate on perturbed instances.** Change the inputs within their realistic uncertainty bands and check that the chosen solution stays good — robust solutions beat brittle optimal ones.
- **Prefer robustness over optimality.** A solution within 2% of optimal across a wide range of scenarios dominates a solution that is exactly optimal for one scenario and terrible for the next.
- **Keep the human in the loop.** The Pareto frontier is a decision aid, not a decision. The optimizer's job is to shrink the trade space to its efficient frontier; the engineer's job is to choose on it, informed by the criteria the objective function couldn't capture.

Optimization is a tool for *making decisions under uncertainty*, and the uncertainty deserves as much modeling effort as the search. A metaheuristic that finds the global optimum of the wrong problem is precise, expensive, and useless.

## Related

- [Engineering](/engineering)
- [Quantitative Work](/quant)
- [Validating Models Like a Skeptic: The Outcomes-Analysis Playbook](/research/validating-models-like-a-skeptic)
