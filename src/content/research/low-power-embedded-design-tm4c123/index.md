---
title: "Low-Power Embedded Design on the TM4C123: Hibernation, EEPROM Persistence, and a UART CLI That Validates Everything"
summary: "Design notes from an unattended weekend pet feeder on the TM4C123: hibernating between feedings with RTC wake, persisting schedules in EEPROM, a UART command parser that validates before it acts, and measuring water level with an analog comparator instead of an ADC."
date: "2026-08-11"
tags: ["embedded-systems"]
draft: false
image: "/research/low-power-embedded-design-tm4c123/og.png"
---

*By [Abdulmalik Ajisegiri](/about)*

> **Companion repository:** [Weekend-Pet-Feeder](https://github.com/Maleek23/Weekend-Pet-Feeder)

## The design problem: nobody is home

In December 2023 I built an automated weekend pet feeder around TI's TM4C123 — 3D-printed mechanics, off-the-shelf food and water hardware, an auger driven through MOSFETs, a capacitive water-level sensor, and a PIR motion sensor. The functional requirements were ordinary: dispense food on a schedule, keep water topped up, alert when resources run low. The *design* requirements were the interesting part:

1. **Unattended for 48+ hours.** Nobody will press reset. A crash on Saturday morning means a hungry animal on Sunday.
2. **Low power.** The feeder should sip current between feedings, not idle at tens of milliamps for two days.
3. **Amnesia-proof.** A power glitch must not erase the feeding schedule.
4. **Operable by a non-engineer.** Configuration happens over a UART CLI — set the time, program feeds, calibrate the water sensor, toggle motion refills — and the CLI must refuse bad input rather than corrupt state.

*(A note on the code: the snippets below are illustrative reconstructions of the documented design — same module structure and function names as the project (`initHw`, `initUart0`, `initHm`, `initEeprom`, `initpwm`, `parseFields`, `isCommand`) — written in the TivaWare style. They show the patterns, not verbatim repo lines.)*

## Sleep is not a power strategy; hibernation is

The first architectural decision is how the MCU spends the 99% of its life when nothing is happening. On the TM4C123 you have a spectrum: run, sleep (CPU clock gated, peripherals optionally alive), deep sleep (most clocks off, SRAM retained), and **hibernate** — nearly everything powered down except the hibernation module itself, drawing on the order of microamps, with the real-time clock kept alive on VBAT.

For a feeder that acts a few times a day and idles for hours, hibernation is the right answer, and it reorganizes the whole firmware around a single question: *what is allowed to wake us?* The answer is two sources: the RTC hitting the next scheduled feed time, and the PIR motion sensor (a pin wake for motion-activated refills). Everything else stays off. The hibernation init looks like this:

```c
void initHm(void)
{
    SysCtlPeripheralEnable(SYSCTL_PERIPH_HIBERNATE);
    while (!SysCtlPeripheralReady(SYSCTL_PERIPH_HIBERNATE)) {}

    HibernateEnableExpClk(HibernateClockGet());   // hibernate module clock
    HibernateRTCEnable();                          // RTC runs on VBAT
    HibernateRTCMatchSet(0, nextFeedEpoch());      // wake at next feed
    HibernateIntEnable(HIBERNATE_INT_RTC_MATCH_0   // wake sources:
                       | HIBERNATE_INT_PIN_WAKE);  // RTC match or PIR pin
    HibernateIntClear(HIBERNATE_INT_PIN_WAKE | HIBERNATE_INT_RTC_MATCH_0);
}
```

And the main loop becomes almost comically simple:

```c
int main(void)
{
    initHw();          // clocks, GPIO, peripherals
    initUart0();       // CLI (only matters when USB/computer attached)
    initEeprom();
    loadSchedule();    // schedules live in EEPROM, see below

    if (wokeFromHibernate()) {
        handleWakeCause();   // RTC match -> feed; pin wake -> check motion
    }
    armNextWake();            // compute next feed, set RTC match
    HibernateRequest();       // back to ~microamps
    while (1) {}              // never reached until wake
}
```

Hibernation has one brutal consequence that shapes everything else: **SRAM is gone on wake.** The hibernate module can save a little state, but the sane design is to treat every wake as a cold boot and keep all configuration in nonvolatile memory. Which brings us to the EEPROM.

## Schedules belong in EEPROM — with a wear budget

The feeding schedule, water-sensor calibration, and feature flags must survive power cycles, so they live in the TM4C123's on-chip EEPROM (`initEeprom`), not in RAM and not as constants in flash. EEPROM is byte-programmable and rated for far more write cycles than flash, but "more" is not "infinite" — the endurance is on the order of hundreds of thousands of cycles per block, and a careless design can burn through that.

The wear strategy has three parts:

1. **Write only on configuration change.** The schedule is written when the user changes it via the CLI — a human-timescale event. It is *never* rewritten on the feed cycle itself. The firmware reads the schedule at boot and acts on it read-only. This single rule is what makes the endurance math work: dozens of writes per year, not thousands per day.
2. **A self-describing record.** Every stored blob starts with a magic number and ends with a CRC. On boot, the firmware verifies both; if either fails (brownout mid-write, first boot, corrupted block), it falls back to safe defaults rather than acting on garbage.
3. **Read-back verification.** After programming, read the record back and compare. EEPROM writes can be interrupted by power loss; verify-before-trust is cheap.

```c
#define SCHED_MAGIC 0xFEED0001u

typedef struct {
    uint32_t magic;
    uint8_t  feedHour[4];
    uint8_t  feedMin[4];
    uint16_t feedGrams[4];
    uint8_t  feedCount;        // how many of the 4 slots are active
    uint16_t waterFullCounts;  // timer counts at calibrated "full"
    uint16_t waterLowCounts;   // timer counts at "refill me"
    uint8_t  motionRefill;     // 0 = off, 1 = on
    uint16_t crc;
} Schedule;

bool eepromSaveSchedule(const Schedule *s)
{
    Schedule tmp = *s;
    tmp.magic = SCHED_MAGIC;
    tmp.crc = crc16(&tmp, offsetof(Schedule, crc));
    EEPROMProgram((uint32_t *)&tmp, EEPROM_ADDR_SCHEDULE, sizeof(tmp));
    // read-back verification: never trust a write you haven't read
    Schedule check;
    EEPROMRead((uint32_t *)&check, EEPROM_ADDR_SCHEDULE, sizeof(check));
    return memcmp(&tmp, &check, sizeof(tmp)) == 0;
}

bool eepromLoadSchedule(Schedule *s)
{
    EEPROMRead((uint32_t *)s, EEPROM_ADDR_SCHEDULE, sizeof(*s));
    if (s->magic != SCHED_MAGIC) return false;
    uint16_t crc = crc16(s, offsetof(Schedule, crc));
    return crc == s->crc;
}
```

Notice what is *not* in EEPROM: runtime state like "did the 8 AM feed already happen." That kind of state is derived from the RTC and the schedule at boot, so storing it would be redundant — and every redundant write spends endurance. Persist configuration, derive state. That rule generalizes far beyond this project.

## A CLI that refuses to act on bad input

The UART CLI (`initUart0`) is how the feeder gets configured: set the clock, program feed times and amounts, calibrate the water sensor, toggle motion-activated refills, and read low-resource alerts. Because the person typing might be a pet sitter, not the firmware author, the parser is built around a strict pipeline: **parse → validate → execute**. Nothing acts on unvalidated input, ever.

The input path has two documented functions. `parseFields` tokenizes a received line into fields; `isCommand` matches the command word and checks the argument count. Validation of each argument's *value* — ranges, types, consistency — happens before any state changes:

```c
#define MAX_FIELDS 8

typedef struct {
    char    *field[MAX_FIELDS];
    uint32_t count;
} Fields;

void parseFields(char *line, Fields *f)
{
    f->count = 0;
    char *tok = strtok(line, " \t\r\n");
    while (tok && f->count < MAX_FIELDS) {
        f->field[f->count++] = tok;
        tok = strtok(NULL, " \t\r\n");
    }
}

bool isCommand(const Fields *f, const char *cmd, uint32_t minArgs)
{
    return f->count > 0
        && strcmp(f->field[0], cmd) == 0
        && (f->count - 1) >= minArgs;
}
```

Then the dispatcher validates values before touching anything persistent:

```c
void handleLine(char *line)
{
    Fields f;
    parseFields(line, &f);

    if (isCommand(&f, "feed", 3)) {
        bool ok;
        int slot  = parseInt(f.field[1], &ok);
        int hour  = parseInt(f.field[2], &ok);
        int min   = parseInt(f.field[3], &ok);
        int grams = (f.count > 4) ? parseInt(f.field[4], &ok) : 20;
        // validate EVERYTHING before acting
        if (!ok || slot < 0 || slot > 3 || hour < 0 || hour > 23
                || min < 0 || min > 59 || grams <= 0 || grams > 200) {
            uartPrint("ERR: usage: feed <slot 0-3> <hour 0-23> <min 0-59> [grams 1-200]\r\n");
            return;
        }
        schedule.feedHour[slot] = (uint8_t)hour;
        schedule.feedMin[slot]  = (uint8_t)min;
        schedule.feedGrams[slot]= (uint16_t)grams;
        if (!eepromSaveSchedule(&schedule))
            uartPrint("ERR: eeprom write failed\r\n");
        else
            uartPrint("OK: feed programmed\r\n");
    }
    else if (isCommand(&f, "water", 1) && strcmp(f.field[1], "cal") == 0) {
        schedule.waterFullCounts = measureWaterCounts();  // see next section
        eepromSaveSchedule(&schedule);
        uartPrint("OK: water calibrated\r\n");
    }
    else if (isCommand(&f, "motion", 1)) {
        if (strcmp(f.field[1], "on") == 0)       schedule.motionRefill = 1;
        else if (strcmp(f.field[1], "off") == 0)  schedule.motionRefill = 0;
        else { uartPrint("ERR: usage: motion <on|off>\r\n"); return; }
        eepromSaveSchedule(&schedule);
        uartPrint("OK\r\n");
    }
    else if (isCommand(&f, "status", 0)) {
        printStatus();   // time, next feed, water level, low-resource alerts
    }
    else {
        uartPrint("ERR: unknown command (try: feed, water cal, motion, status)\r\n");
    }
}
```

Three design choices here are worth naming. First, **validation precedes mutation**: the schedule struct is only touched after every argument checks out, so a malformed command can't leave half-applied state. Second, **errors are explicit and actionable**: every rejection says what was wrong and shows the correct usage — the CLI is its own documentation. Third, **the EEPROM write is the commit point**: nothing the user typed is real until `eepromSaveSchedule` succeeds, and a failed write is reported rather than silently dropped. This is the same parse-validate-execute discipline you'd use in a web API handler; the transport is UART instead of HTTP, but the failure modes (garbage in, partial application, silent drops) are identical.

## Sense water with a comparator, not an ADC

Water level comes from a capacitive sensor: the probe's capacitance changes with the water around it. The obvious approach is an ADC reading, but the project instead routes the sensor through the **analog comparator and a timer** — and that choice is worth understanding, because it's the cheaper instrument doing a better job.

The principle: the probe's capacitance sets the frequency of a simple oscillator (capacitance → frequency is the transduction). The comparator squares that oscillation into a clean digital edge train, and a timer in input-capture mode counts edges over a fixed gate window. The result is a *frequency measurement*, and frequency measurements have a lovely property: they're inherently averaged over many cycles, so they're naturally noise-immune without any digital filtering. No ADC channel is consumed, no DMA is needed, and the measurement is event-driven — the timer counts while the CPU does nothing.

```c
void initWaterSense(void)
{
    SysCtlPeripheralEnable(SYSCTL_PERIPH_COMP0);
    // C0+ = sensor oscillator, C0- = external threshold (resistor divider)
    ComparatorConfigure(COMP_BASE, 0,
                        COMP_TRIG_NONE | COMP_INT_NONE |
                        COMP_ASRCP_PIN | COMP_OUTPUT_NORMAL);
    // Timer0A: capture rising edges on the comparator output pin
    SysCtlPeripheralEnable(SYSCTL_PERIPH_TIMER0);
    TimerConfigure(TIMER0_BASE, TIMER_CFG_SPLIT_PAIR | TIMER_CFG_A_CAP_TIME_UP);
    TimerControlEvent(TIMER0_BASE, TIMER_A, TIMER_EVENT_POS_EDGE);
    TimerEnable(TIMER0_BASE, TIMER_A);
}

uint16_t measureWaterCounts(void)
{
    // count comparator edges over a fixed 100 ms gate -> frequency -> level
    TimerLoadSet(TIMER1_BASE, TIMER_A, SysCtlClockGet() / 10);  // 100 ms gate
    edgeCount = 0;
    TimerIntEnable(TIMER1_BASE, TIMER_TIMA_TIMEOUT);
    TimerEnable(TIMER1_BASE, TIMER_A);
    while (!gateDone) {}          // or sleep until the gate interrupt
    return edgeCount;
}
```

Calibration is what turns counts into meaning: the `water cal` CLI command records the timer counts at a known-full bottle, and the firmware compares live measurements against the calibrated full/low thresholds to drive the **low-resource alerts**. Raw sensor values are meaningless without a calibration story; the CLI command *is* the calibration story, and because it writes to EEPROM, it survives power cycles like everything else.

## Dispense with PWM and a MOSFET — measured, not blind

Food and water move through an auger and pump driven by MOSFETs under PWM control (`initpwm`). The key word is *measured*: the firmware dispenses a calibrated on-time per gram (established once, stored implicitly in the schedule's grams field), drives the PWM at a fixed duty for that duration, then cuts the MOSFET. Short, deterministic motor bursts serve the power budget too — the highest-current events in the system last seconds, a few times a day, and then it's back to hibernation.

## What this teaches beyond the feeder

Four patterns from this project show up everywhere in reliable embedded work:

1. **Design for the unattended case first.** The wake-source list (RTC match, PIR pin) *is* the power architecture. If you can't enumerate what wakes the system, you don't have a low-power design — you have a fast battery drainer.
2. **Persist configuration, derive state.** EEPROM holds the schedule and calibration; "what's next" is computed from the RTC at boot. Every redundant write spends endurance you'll never get back.
3. **Validate before acting, on every input path.** The parse → validate → execute pipeline in the UART CLI is the same discipline as validating API payloads before touching a database. Untrusted bytes are untrusted bytes, whether they arrive over UART or HTTPS.
4. **Use the cheapest adequate instrument.** A comparator plus a timer measured water level with better noise immunity than a naive ADC poll, while leaving the ADC free. Reaching for the biggest peripheral first is a habit worth breaking.

A weekend feeder is a small system, but it's a *complete* system: sensing, actuation, persistence, power management, and a human interface, all of which must work with nobody watching. Getting the boring parts right — validation, wear budgets, wake sources — is what makes the difference between a demo that works on the bench and a device you'd trust with something you care about.

## Related reading

- [DMA Double-Buffering for Continuous Sensor Capture](/research/dma-double-buffering-sensor-capture/)
- [Angle of Arrival on a Budget: Localizing Sound with Four Microphones and a Cortex-M4](/research/angle-of-arrival-embedded-audio-localization/)
- [Zod at the Boundary: Validating Every Byte That Enters Your API](/research/zod-at-the-boundary-api-validation/)
