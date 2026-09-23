---
title: "How System Calls Actually Work: A Tour of a Tiny C Kernel"
summary: "Tracing a userland call like cat through the trap, dispatch table, and syscall implementations of a tiny C kernel — the user/kernel boundary demystified."
date: "2026-08-06"
tags: ["systems-programming"]
draft: false
image: "/research/how-system-calls-work-tiny-c-kernel/og.png"
---

*By [Abdulmalik Ajisegiri](/about)*

> **Companion repository:** [Files-System-Calls](https://github.com/Maleek23/Files-System-Calls)

You can read three textbooks about system calls and still not understand what a system call *is*. Every explanation describes the same picture — userland calls a library function, the library "traps" into the kernel, the kernel does the thing and returns — but the trap itself stays a magic box. What actually happens, instruction by instruction, between your program asking for bytes and the kernel handing them back?

The fastest way I know to answer that is to build it. I worked through a small teaching operating system written in C — a real, tiny kernel with real boot code, a real MMU driver, and real syscall implementations — and nothing demystifies the trap like watching it happen in your own code. The snippets below are simplified illustrations of the patterns that codebase uses, not verbatim repo code. The ideas are the same ones in every real OS, just shrunk to a size you can hold in your head.

## The boundary is hardware, not convention

Before the syscall, the boundary. A kernel isn't a library that user programs call politely. It's a *protected* program that user programs can never touch directly, and the protection comes from the CPU, not from politeness.

The CPU runs in at least two privilege levels. In kernel (privileged) mode, instructions can do anything: configure the MMU, mask interrupts, touch any memory. In user mode, some instructions are simply illegal — the hardware faults if you try — and some memory regions are off-limits. This is the bedrock everything else stands on. In the teaching kernel, the two halves live in different places in memory by design: the kernel is built from the `earth/` tree and linked with its own linker script (`earth.lds`), while each user program (`cat`, `ls`, `ps`, …) is built from `apps/user/` and linked with `app.lds` to a different address range. The linker scripts aren't build trivia — they are the static enforcement of the boundary. Kernel code and data live at addresses the MMU will later mark supervisor-only; user code lives where user mode is allowed to run.

The bootloader-era startup file, `earth.S`, runs first. In assembly it sets up a stack pointer, clears the BSS, and hands off to C code in `earth.c` — the kernel's main. One of the earliest jobs there, alongside initializing the UART and GPIO buses (`bus_uart`, `bus_gpio`), is installing the *trap vector*: a table of addresses the CPU jumps to when something exceptional happens. Interrupts (`cpu_intr`), page faults (`cpu_mmu`), and the syscall trap all funnel through this vector. That single hardware mechanism — an exception jumps to a kernel address in privileged mode — is the whole door between the worlds.

## What a trap really does

Here's the sequence, stripped to its bones, when a user program invokes a system call:

1. **The user program loads a syscall number into a register** (and arguments into more registers). This is the only "contract" between userland and kernel: a number naming the operation, and data in agreed-upon registers.
2. **It executes a trap instruction** (on ARM, `svc`; on RISC-V, `ecall`; on x86, `syscall`). This is an ordinary-looking instruction with extraordinary effects: the CPU atomically saves the current program counter and status register, switches to privileged mode, and jumps to the trap vector address — *without consulting the user program about where to go*. The destination is configured by the kernel alone. That's the point: userland can knock, but it can't choose who answers.
3. **The trap handler saves the full user context** — all the general registers onto the kernel stack — because it's about to run arbitrary C code that will clobber them.
4. **The dispatcher reads the syscall number** from the register where the userland stub put it and looks up what to do.
5. **The handler runs**, does the work with full hardware access, puts a return value in the agreed register, restores the saved registers, and executes a return-from-exception that drops the CPU back to user mode at the saved program counter.

Notice what's *not* in this list: no function call semantics, no shared stack, no trust. The kernel can't call user code like a subroutine and come back; it must save and restore everything. The kernel must validate every pointer the user passes (the classic `copy_from_user` problem — see `crash1` and `crash2` below). The trap is a context switch between universes, not a call.

![Stack diagram of a syscall's journey: userland apps and syscall stub at top, trap instruction, kernel trap vector dispatcher and handler, hardware CPU privilege and MMU at the bottom; call path arrow down on the right, return-from-exception arrow up on the left](./syscall-stack.png)

*The syscall's journey, end to end: userland knocks but can't choose who answers — the trap instruction hands the CPU to the kernel's trap vector, and the return-from-exception drops back to user mode with registers restored.*

## The syscall stub: a few instructions, nothing more

User programs don't usually write trap instructions directly. Each user tool in `apps/user/` — `cat`, `ls`, `echo`, `pwd`, `cd`, `kill`, `ps`, `clock`, `setprio`, `ult` — links against a tiny syscall wrapper layer. Simplified, a stub looks like this:

```c
/* Simplified illustration of the userland syscall wrapper pattern. */
#define SYS_read   3
#define SYS_write  4
#define SYS_open   5

long syscall3(long num, long a1, long a2, long a3) {
    register long r_num asm("a0") = num;   /* syscall number */
    register long r_a1  asm("a1") = a1;
    register long r_a2  asm("a2") = a2;
    register long r_a3  asm("a3") = a3;
    asm volatile("ecall"                /* the trap instruction */
                 : "+r"(r_num)
                 : "r"(r_a1), "r"(r_a2), "r"(r_a3)
                 : "memory");
    return r_num;                           /* kernel left retval here */
}

long write(int fd, const void *buf, long count) {
    return syscall3(SYS_write, fd, (long)buf, count);
}
```

That's the entire "library." No magic: put a number in a register, trap, read back the answer. When a beginner asks "but where does `write()` *go*?", the honest answer is that it goes to the `ecall` instruction, and from there the CPU takes over.

![Before-and-after diagram of the trap instruction: in user mode registers a0 through a3 hold the syscall number and arguments with the program counter at ecall; the trap atomically saves the PC and status register, switches to privileged mode, and jumps to the trap vector; the kernel saves the full user context on the kernel stack, dispatches on a0, and returns via return-from-exception with the result in a0](./diagram-trap-registers.svg)

*Figure — The trap's register contract, before and after `ecall`: the stub fills `a0`–`a3`, the CPU and kernel take it from there.*

## The dispatch: from a number to real code

On the kernel side, the trap handler is a thin assembly veneer over a C dispatcher. The assembly part saves registers and calls into C; the C part is where the syscall table lives. In a small kernel the table is often just a switch, and the switch is the most honest documentation of the system's API surface:

```c
/* Simplified illustration of the kernel syscall dispatcher. */
long syscall_dispatch(long num, long a1, long a2, long a3) {
    switch (num) {
    case SYS_read:   return sys_read((int)a1, (void *)a2, a3);
    case SYS_write:  return sys_write((int)a1, (const void *)a2, a3);
    case SYS_open:   return sys_open((const char *)a1, (int)a2);
    case SYS_fork:   return sys_fork();
    case SYS_exec:   return sys_exec((const char *)a1);
    case SYS_kill:   return sys_kill((int)a1, (int)a2);
    case SYS_getpid: return sys_getpid();
    default:         return -ENOSYS;   /* unknown number: refuse loudly */
    }
}
```

Each `sys_*` function here is a real implementation. In this kernel's layout, the implementations are organized by subsystem: `apps/system/sys_file.c` for file operations, `sys_dir.c` for directories, `sys_proc.c` for process management, `sys_shell.c` for the shell's helpers. So `cat` → `read()` → trap → `sys_read()` in `sys_file.c`. The path is fully concrete now: a register number, a switch case, a C function.

And here's the part textbooks rush past: **the kernel implementation must treat every argument as hostile**. The `buf` pointer in `sys_read` came from userland. It might point at valid user memory, or at kernel memory, or at nothing at all. The kernel is in privileged mode — it *can* read kernel memory — so it must check the address range before touching it, typically against the userland address bounds the MMU enforces. This kernel even ships two user programs, `crash1` and `crash2`, whose whole job is to exercise exactly this: pass bad pointers and invalid syscall numbers and watch the kernel survive. A kernel that panics on a bad user pointer isn't a kernel; it's a demo. The crash tools are the regression test for that.

## A tiny userland tool, end to end

Let's trace the whole path with `echo`, the smallest tool with real output:

```c
/* Simplified illustration of a userland tool using the syscall stubs. */
int main(int argc, char **argv) {
    for (int i = 1; i < argc; i++) {
        write(1, argv[i], strlen(argv[i]));
        write(1, " ", 1);
    }
    write(1, "\n", 1);
    return 0;
}
```

`write(1, ...)` runs the stub, `ecall` fires, the CPU lands in the trap handler, `syscall_dispatch` routes `SYS_write` to `sys_write` in `sys_file.c`, which finds file descriptor 1 (the console, backed by `dev_tty` and ultimately `bus_uart`), pushes the bytes to the UART transmit register, and returns the count. The handler restores registers, drops to user mode, and `main` continues. One `ecall` instruction bridged two protection domains, a device driver, and a hardware bus. `cat` is the same path with `open`/`read` added; `ls` routes through `sys_dir.c`; `ps` and `kill` through `sys_proc.c`.

The point of having a dozen one-purpose tools (`cat`, `ls`, `ps`, `kill`, `clock`, `echo`, `pwd`, `cd`, `setprio`, `ult`) instead of one monolith is exactly this pedagogical property: each tool exercises a narrow slice of the syscall surface, so each slice of the kernel can be tested in isolation. `setprio` is the only caller of the priority syscall; if priority scheduling breaks, you know exactly where to look.

## Where the MMU fits in this picture

The trap gives the kernel *control* on entry, but the MMU (`cpu_mmu`) is what makes the boundary hold at all other times. Its jobs in this architecture:

- **Mark kernel pages supervisor-only.** If user code could simply read kernel memory, the trap would be theater. The MMU's page tables tag every page with permissions; the kernel's pages are inaccessible from user mode. `earth.c` builds these tables at boot before the first user program ever runs.
- **Give each process its own address space** (`dev_page` manages physical page allocation). When `sys_exec` launches a program, the kernel maps the program's segments at the addresses `app.lds` promised, and unmaps (or remaps) the previous process's pages. Two processes can both think they're at address 0x1000; the MMU makes those two different physical pages.
- **Fault on violations.** When `crash1` dereferences a garbage pointer, the MMU raises a fault, the CPU jumps to the trap vector (same door, different knock), and the kernel's fault handler kills the offending process instead of crashing the system. Protection you can't bypass is what turns a bug in `cat` from a system crash into a dead `cat`.

This is why the kernel tree has a whole `cpu_mmu` module rather than a few lines: the MMU is doing continuous, invisible enforcement every single instruction cycle, while the trap handler only runs on exceptions.

## The linker scripts are part of the OS design

Two more files deserve attention because beginners skip them: `earth.lds` and `app.lds`. A linker script tells the linker where each section of the program goes in memory. `earth.lds` places the kernel — `.text`, `.data`, `.bss`, the trap vector — at the kernel's fixed physical addresses. `app.lds` places each user program at the *userland* addresses, with the entry point where the kernel's `exec` expects it.

If you get `app.lds` wrong, `exec` loads a program whose entry point the MMU won't let user mode execute, or whose sections overlap kernel memory — and you learn about it immediately at runtime. Linker scripts are the compile-time half of memory layout; the MMU is the runtime half. They have to agree, and in a tiny kernel you can read both in an afternoon and *see* the agreement.

## What building this actually teaches

Textbooks give you the vocabulary: trap, privilege level, dispatch table, address space. Building the thing gives you the *causality*: you write the dispatcher, so you understand why syscall numbers exist (a register is the only channel); you write the context save, so you understand why syscalls can't share a stack; you debug `crash1`, so you understand why the kernel validates pointers; you misconfigure `cpu_mmu` once, so you understand viscerally what protection is worth.

The deeper payoff is an engineering instinct that transfers everywhere. Every "crossing" in software — a web request crossing into a server, a container boundary, a privilege escalation, a serialization format between trust domains — is the same shape: an untrusted caller, a narrow well-defined interface, validation at the boundary, and a privileged implementation that never trusts its inputs. The syscall is the purest instance of that pattern in computing. Once you've implemented one, you recognize the shape in every system you ever build, and you stop designing boundaries that are merely conventional. You design them the way the CPU does: so they hold even when the caller is hostile.

*Code snippets in this article are simplified illustrations of the patterns in the Files-System-Calls teaching kernel, not verbatim repo code. The repo's build docs (COMPILING.md, RUNNING.md) and Makefile are the real starting point if you want to build and run it yourself.*

## Related reading

- [DMA Double-Buffering for Continuous Sensor Capture](/research/dma-double-buffering-sensor-capture/)
- [Zod at the Boundary: Validating Every Byte That Enters Your API](/research/zod-at-the-boundary-api-validation/)
