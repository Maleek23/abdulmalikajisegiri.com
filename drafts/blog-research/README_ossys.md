# Files Systems Calls (OS) Project

Welcome to my  Operating System  project repository! This repository showcases my implementation of system calls and libc functions tailored for a real-world application in an educational setting. Designed to deepen students' understanding of operating systems, this project encompasses essential components developed from scratch within the context of the egos-2000 teaching operating system.
![Screenshot of egos-2000](references/screenshots/egos-2000.jpg)

## Project Highlights

- **Innovative System Calls**: Implemented a new `setprio` system call to manage process priorities effectively, enriching the system's functionality.
  
- **Process Management**: Developed process control blocks to meticulously track crucial process attributes such as priority, creation time, and context switches.
  
- **Enhanced Process Control**: Introduced a `kill` system call and corresponding application to facilitate graceful process termination by PID, enhancing system stability and management.
  
- **Improved Monitoring**: Enhanced the `ps` command to provide comprehensive insights into process details, aiding in system monitoring and analysis.

# Documentation and Resources

## Assignment Requirements
- [Assignment 1 Requirements](ASSIGNMENT1.md): Detailed specifications and instructions for Assignment 1.

## Development Guides
- [Compiling Guide](COMPILING.md): Instructions for compiling and running the project.
- [Running Guide](RUNNING.md): Guide on how to execute the project and observe its behavior.

## Codebase
- [Source Code](source_me.sh): Bash script to access the project's source code.

## License
- [License](LICENSE): License information for the project.

## Additional Materials
- [Makefile](Makefile): File containing build instructions and targets.
- [References](references/): Folder containing additional references and documentation.
- [Apps](apps/), [Earth](earth/), [Grass](grass/), [Library](library/): Directories containing project components.


## Acknowledgments
- [Acknowledgments](ACKNOWLEDGMENTS.md): Acknowledgments to individuals and organizations involved in the project.


## Getting Started

You can quickly build and run the project using the provided commands:

```bash
make
make qemu
```

Watch the system in action within the QEMU window.


## Vision and Impact

This project aspires to democratize access to operating system knowledge, making it accessible and comprehensible to every college student. With the lightweight and educational egos-2000 operating system, students can explore the intricacies of OS design and implementation firsthand. By fostering a deeper understanding of OS principles, this project aims to empower future generations of developers and engineers.

## Acknowledgments

I extend my gratitude to esteemed educators and mentors, including [Robbert van Renesse](https://www.cs.cornell.edu/home/rvr/), [Lorenzo Alvisi](https://www.cs.cornell.edu/lorenzo/), [Shan Lu](https://people.cs.uchicago.edu/~shanlu/), and [Hakim Weatherspoon](https://www.cs.cornell.edu/~hweather/), for their invaluable support and guidance throughout this endeavor. Special thanks to Meta for their support through the [Meta Fellowship](https://research.facebook.com/fellows/zhang-yunhao/). I also express my appreciation to all the students who have contributed to and improved this project over the years.

## License

This project is licensed under the MIT License. For more details, refer to the [LICENSE](LICENSE) file.




