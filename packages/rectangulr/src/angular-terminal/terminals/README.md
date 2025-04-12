# Terminal Abstraction Layer

This folder contains the core terminal abstraction interfaces and implementations for different terminal environments.

## Core Interfaces

### Terminal
The main interface that combines terminal input and output capabilities:
- `name`: Identifier for the terminal implementation
- `inputs`: Handle keyboard/mouse input
- `screen`: Handle terminal display output

### TerminalInputs
Interface for handling terminal input:
- Send inputs to terminal
- Subscribe to input events
- Optional raw mode support

### TerminalScreen
Interface for terminal display:
- Write text/ANSI sequences
- Get terminal dimensions
- Listen to events like resize

## Usage

The terminal implementations can be injected using Angular's dependency injection system via the `TERMINAL` injection token.

Select the appropriate implementation based on environment:
- ProcessTerminal for Node.js CLI
- XTermTerminal for browser-based terminals
- VoidTerminal for testing/placeholder

## Implementations

### ProcessTerminal
Node.js process-based terminal implementation that:
- Handles stdin for input
- Uses stdout for output
- Gets dimensions from process.stdout

### XTermTerminal
XTerm.js-based terminal implementation for browser environments:
- Wraps XTerm.js instance
- Handles browser keyboard events
- Manages terminal resize events

### VoidTerminal
Null implementation that:
- Discards all input
- Ignores output
- Uses configurable fixed dimensions
