# Poker Chip Workflow Simulation (Arena)

This project simulates a sequential workflow using Rockwell Arena, inspired by a classroom-based construction process game. It evaluates system performance under different probabilistic distributions of work transfer using discrete-event simulation.

## 📌 Objective

To determine which die configuration results in fewer required rolls by the final participant (Person 4) to complete processing 100 units (poker chips) through a 4-stage system.

## 🧩 Problem Setup

* 4 participants (Persons 1 through 4)
* Each player passes poker chips based on a custom 8-sided die roll
* Chips are passed downstream if possible; otherwise, partial batches are moved
* The only metric: total number of rolls required by Person 4 (P4)

## 🎲 Die Configurations (DISC function)

* **Team 1 Die:** `DISC(0.5, 2, 1.0, 8)`
* **Team 2 Die:** `DISC(0.5, 1, 1.0, 9)`

## 🛠️ Tools & Methodology

* Arena Simulation Software (Student Edition)
* 100 chips created and passed through full cycle in each replication
* 120 replications per die configuration
* P4 rolls counted via global tallying logic per replication
* Comparison analyzed via paired t-test at 90% confidence level

## 📈 Results

| Metric                  | Team 1 (2/8 Die) | Team 2 (1/9 Die) |
| ----------------------- | ---------------- | ---------------- |
| **Mean Rolls (P4)**     | 1.30             | 2.01             |
| **Standard Deviation**  | 0.18             | 0.18             |
| **Confidence Interval** | ±0.03            | ±0.03            |
| **T-Test p-value**      |                  |                  |
