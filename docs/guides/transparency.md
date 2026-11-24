# The declaration of transparency

Phase 44, the owner's order: every public office with its official contacts
- e-mail, phone, address, ePUAP - placed on OpenStreetMap, and the address
space of the state. **Institutions only**: what an office publishes as its
own contact. No named person's private data (Q24).

```bash
task python:offices                    # the official contact bases of dane.gov.pl, into one table
task python:geocode -- --limit 3000    # the offices with no coordinates, placed by Nominatim (about an hour)
task python:networks                   # the state's networks and autonomous systems in RIPE
```

| File | What it holds |
| --- | --- |
| `dataset/transparency/offices.jsonl` | an office per line: name, kind, voivodeship, district, town, street, number, postal code, phones, fax, e-mails, www, ePUAP, latitude, longitude (and `osm` when Nominatim placed it), where it came from |
| `dataset/transparency/geocode.json` | every address Nominatim was asked, with what it said - asked once |
| `dataset/transparency/networks.jsonl` | a network (`inetnum`, `inet6num`) or an autonomous system (`aut-num`) per line, with its organisation's RIPE key and name |

## The offices

`resources/configs/transparency/sources.yaml` names the resources of
dane.gov.pl, the open data of the state: the voivodes' combined
administration (with its services: police, fire brigade, inspections), the
tax administration (KAS), the civil registry offices, the Polish posts
abroad. Each is a CSV or a spreadsheet with columns of its own; a column is
told by its words (*telefon*, *e-mail*, *miejscowość*, *szerokość
geograficzna*...). On 2026-11-24: 4,933 offices, 4,921 with an e-mail, all
with a phone, 1,929 with coordinates from their source. More sources are
added to the file the same way.

## Their places

An office with no coordinates is asked of Nominatim, OpenStreetMap's
geocoder: structured (street, town, postal code), then by words; one request
a second, as its policy asks; every answer cached, so a run asks only what
is new. A sample of 20 placed all 20. Coordinates © OpenStreetMap
contributors, ODbL.

## The address space of the state

The organisations of the RIPE database in Poland whose e-mail is in `gov.pl`,
or whose name has a public word (*Ministerstwo*, *Urząd*, *Gmina*,
*Starostwo*, *Komenda*, *Prokuratura*, *Sąd*...), and every network and
autonomous system registered to them. Only the organisation's key and name
are kept - a RIPE object also names people, and they are left out. On
2026-11-24: 89 organisations, 108 networks (84 IPv4, 24 IPv6), 82
autonomous systems.

Read in every interface: MCP `transparency` (`of: offices` or `networks`),
`/api/transparency/offices?q=Lublin`, `/api/transparency/networks`.
