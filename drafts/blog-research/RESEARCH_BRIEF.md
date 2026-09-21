# Research Brief — Abdulmalik Ajisegiri Technical Blog Push (2026-09-20)

Author byline for all articles: Abdulmalik Ajisegiri. These are the ONLY verified facts you may use.
NEVER invent employers, job titles, dates, degrees, certifications, or biographical claims.
No "at my job at X", no resume content, no proprietary details. Stick to the public repos below
(user Maleek23 on GitHub) plus general technical knowledge. Where code is illustrative rather than
the literal repo code, keep it realistic and correct — never present pseudo-code as the actual repo.

## Repo 1: cardiac-surgery-predictive-model
- ML-based clinical support tool predicting postoperative risk in cardiac surgery from preoperative patient data.
- Outcomes predicted: operative mortality (primary focus), renal failure, prolonged ventilation, stroke.
- Designed in alignment with Society of Thoracic Surgeons (STS) database standards; supports 3-star STS program rating initiatives.
- Context: replace/augment traditional Excel-based STS calculators; streamline data entry, reduce human error, eventually support real-time decision-making.
- Pipeline (from public README):
  - Preprocessing: filled missing values, dropped rows with NaNs, MinMaxScaler normalization.
  - One-hot encoded categoricals: gender, insurer, procedure type.
  - Feature selection guided by correlation analysis and model-based importance (correlation heatmap in repo).
  - Models: GradientBoostingRegressor for non-linear relationships; Stacking Ensemble of Random Forest + Gradient Boosting.
  - Hyperparameter tuning with RandomizedSearchCV; optional Yeo-Johnson transformation to improve residuals.
  - Evaluation: R² 0.78 (main.py model), R² 0.81 (stacked ensemble).
- Repo files: Surgical_Predictive_Model_Final.ipynb, main_fresh_complete_data_only.ipynb, ModelData_2425.xlsx.
- DO NOT claim hospital deployment, patient counts, or clinical outcomes beyond the above.

## Repo 2: Poker-Chip-Simulation
- Discrete-event simulation (Rockwell Arena, Student Edition) of a 4-stage sequential workflow (poker-chip classroom game).
- Setup: 4 participants (P1–P4); each passes chips downstream based on a custom 8-sided die roll; partial batches move when full transfer isn't possible.
- Question: which die configuration minimizes rolls required by the final participant (P4) to push 100 units through.
- Die configs (Arena DISC function): Team 1 `DISC(0.5, 2, 1.0, 8)`; Team 2 `DISC(0.5, 1, 1.0, 9)`.
- Method: 100 chips per replication; 120 replications per die configuration; P4 rolls counted via global tallying; comparison via paired t-test at 90% confidence.
- Results: Team 1 mean P4 rolls 1.30 (SD 0.18, CI ±0.03); Team 2 mean 2.01 (SD 0.18, CI ±0.03). The t-test p-value cell is EMPTY in the README — do NOT invent a p-value; you may describe the analysis setup but not its missing result.

## Repo 3: Weekend-Pet-Feeder
- Automated weekend pet feeder; embedded systems project by Abdulmalik Ajisegiri, Dec 2023.
- MCU: TM4C123. 3D-printed parts + commercial off-the-shelf components (water bottle, food container, dish, delivery tube, auger, base, capacitive sensor, motors, MOSFETs, PIR, EEPROM).
- Software capabilities:
  - Water-level detection: capacitive sensor circuit → analog comparator + timer modules, real-time volume measurement.
  - Scheduled feeding: feed amounts/times programmed and stored in EEPROM (persistent across power cycles).
  - UART CLI for configuration: set current time, program feeds, calibrate water volume, toggle motion-activated refills, low-resource alerts.
  - Input validation: user data parsed into fields (parseFields/isCommand) and validated before execution.
  - Precision control: PWM + MOSFET-driven motors dispense measured food/water amounts.
  - Power management: RTC initialization and interrupts, hibernation module (initHm).
- Key functions: initHw, initUart0, initHm, initEeprom, initpwm, parseFields, isCommand.
- Safety: food-safe containers, sealed prints.

## Repo 4: Embedded-Systems-II---AoA-of-Multidirectional-Audio-System
- Angle-of-arrival (AoA) audio localization on a budget; TM4C123GH6PM (ARM Cortex-M4F).
- Hardware: 4 precision microphones (-44 dBV/Pa sensitivity), amplification circuits with 40 dB gain.
- DMA buffers move ADC microphone data to memory without CPU involvement — prevents data loss, enables continuous processing.
- UART0 to host via virtual COM port (USB endpoint) for real-time monitoring/configuration UI.
- Objectives: accurate AoA calculation, low power consumption, robust real-time monitoring UI.
- AoA concept (general knowledge you may explain): time-difference-of-arrival (TDOA) between mic pairs → phase/time-delay estimation → direction estimate; cross-correlation/GCC-PHAT as the standard approach; trade-offs: mic spacing vs. aliasing, sample rate vs. resolution, compute on M4F.

## Repo 5: Files-System-Calls
- A small teaching operating system written in C.
- Kernel (earth/): bus_gpio, bus_uart, cpu_intr, cpu_mmu, dev_disk, dev_page, dev_tty, SD-card drivers (sd_init, sd_rw, sd_utils), earth.S startup, earth.c, linker scripts.
- System layer (apps/system): sys_dir.c, sys_file.c, sys_proc.c, sys_shell.c — the actual syscall implementations.
- Userland (apps/user): cat, cd, clock, crash1, crash2, echo, kill, ls, ps, pwd, setprio, ult — tiny programs that exercise the syscalls.
- Build: Makefile, app.lds/earth.lds linker scripts, COMPILING.md/RUNNING.md docs.
- Good article angle: what a system call really is — the trap, the dispatch table, user/kernel boundary — grounded in this real (if small) codebase's structure.

## Repo 6: QuantEdgeResearch
- Contains `.agents/skills/` — a library of engineering agent skills with scripts:
  - code-reviewer: code_review_checklist, coding_standards, common_antipatterns, code_quality_checker.py, pr_analyzer.py, review_report_generator.py
  - senior-data-engineer: data_quality_validator.py, etl_performance_optimizer.py, pipeline_orchestrator.py, dataops_best_practices
  - senior-data-scientist: experiment_designer.py, feature_engineering_pipeline.py, model_evaluation_suite.py, statistical_methods_advanced
  - senior-architect, senior-backend, senior-frontend, scroll-experience skills similarly.
- Article angle: codifying engineering judgment into reviewable, scripted checks — what an automated code-review pipeline should actually check (with real checklist content).

## General technical context (public knowledge, safe to use)
- His public profile lists interests: ML metaheuristics, simulation modeling, embedded AI for reliability-critical applications; stack: Python, C/C++, SQL, ARM Assembly, TensorFlow, scikit-learn, OpenCV, LLM evaluation, NLP/transformers, Simulink/MBSE, AWS, Linux, Airflow.
- LLM evaluation (general knowledge): BLEU/ROUGE measure n-gram overlap against references (precision-oriented vs recall-oriented); SBERT gives semantic similarity via sentence embeddings; a real harness needs: dataset of prompts + references, metric computation, failure/risk tagging (hallucination, toxicity, instruction-following), regression tracking across model versions, human spot-check sampling. Write this as a general technical how-to — do NOT claim any of it is his shipped product.
- SR 11-7 (general knowledge): Federal Reserve model-risk guidance built on three pillars — conceptual soundness, ongoing monitoring, outcomes analysis — plus governance and documentation. His site already has conceptual notes on this; your articles must be the APPLIED, code-heavy companions, not rehashes.
