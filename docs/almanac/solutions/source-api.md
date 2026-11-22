# The source API

ELI API of Sejm (`https://api.sejm.gov.pl/eli`) is open and changes without
notice. The gatherer is polite: its own User-Agent, two requests at a time,
and gathering is started by the owner.

- A failed request must fail the run, not only a line of the log.
- When the API answers 400 to what worked before, one request with the
  project's User-Agent tells what it wants now.

## Cases

- [`gather:changes` fails: the API wants a time, not a day](../cataclistics/eli-changes-400.md)
- [A damaged PDF stops the whole text run](../cataclistics/damaged-pdf.md)
