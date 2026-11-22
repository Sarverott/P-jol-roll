# The terminal

The launcher (bare `task`) and its REPL run tasks inside `script`, so their
output lands in its log.

- A REPL keeps the terminal raw; a task needs it cooked, or Ctrl+C is a
  byte.

## Cases

- [Ctrl+C in a task of the launcher does not stop it](../cataclistics/launcher-ctrl-c.md)
