# Phase 44: the declaration of transparency

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795537404657 · commit 0176c721

The order of phase 41 goes on: "We need to list all gov offices emails for
official contact data with phones and addresses, including OpenStreetMap
pinning of coords of places, government IPs and other like that - that is
our declaration of transparency." Built along the *Lean* of Q24 (issue
#142): institutions only, as each publishes itself, no person's private
data.

- **The offices** (`task python:offices`): the official contact bases the
  state publishes on dane.gov.pl - the voivodes' combined administration,
  the tax administration (KAS), the civil registry offices, the Polish posts
  abroad (`resources/configs/transparency/sources.yaml`; more are added the
  same way) - read whatever their columns, into one table: 4,933 offices,
  4,921 with an e-mail, all with a phone.
- **Their places** (`task python:geocode`): coordinates given by the
  sources kept (1,929), the rest from OpenStreetMap's Nominatim - one
  request a second, as its policy asks, every answer cached; a sample of 20
  placed all 20 here, the rest is an hour's run of the owner's.
- **The address space of the state** (`task python:networks`): the
  organisations of the RIPE database in Poland with an e-mail in gov.pl or a
  public word in their name, and every network and autonomous system
  registered to them - only the organisation's key and name kept, never the
  people a RIPE object names: 89 organisations here, with 108 networks
  and 82 autonomous systems.
- Read in every interface: MCP `transparency`, `/api/transparency/offices`
  and `/networks`, the catalog.
