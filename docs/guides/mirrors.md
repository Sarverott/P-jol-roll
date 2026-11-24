# Mirrors on a WireGuard network

The second step of M5, *no centre* (phase 38): the law served by mirrors -
one per voivodeship, more per district - each a whole copy, joined to the
others by WireGuard, the site balanced over all of them by Traefik. No
mirror is the centre: each balances over every mirror it knows.

## The registry

`resources/configs/mirrors/mirrors.yaml`, in git, is what the mirrors share:
the sixteen voivodeships, each at `10.42.<TERYT code>.1` on the network
(mazowieckie `10.42.14.1`); a district is added with an address of its own.
A mirror is on the network once its public key is there.

```bash
task mirror:list                    # the mirrors, their addresses, which are on the network
```

## A machine becomes a mirror

```bash
task mirror:keys -- mazowieckie     # its WireGuard keys: the private one stays in resources/secrets/wireguard/,
                                    # the public one is written into the registry - commit it
task mirror:up -- mazowieckie       # its WireGuard and Traefik made from the registry, then compose up
curl http://127.0.0.1:8095/api/host # the site, answered by any mirror on the network
task mirror:down
```

The profile `mirror` of compose runs three containers in one network
namespace (WireGuard's): `mirror-wireguard`, `mirror-server` (the api over
its own `resources/`) and `mirror-traefik`. Traefik balances every request
over the api of every mirror on the network, through the tunnels, checking
each by `/api/host`; a mirror that does not answer is left out until it
does. With a `domain` in the registry, each mirror is also at
`<name>.<domain>`.

A mirror with an `endpoint` (`host:51820`, its UDP port open to the
internet) is reached by the others; one without it only calls out, and is
reached once it has. When the registry changes - a new mirror, a new key -
each mirror runs `task mirror:up` again.

## Checked here

`task unittesting:mirrors` makes two mirrors from a registry of two, in
containers: their keys (the same public keys as `wg pubkey` derives), a real
WireGuard tunnel between them, a stand-in of the api in each, and Traefik in
one answering from both. 8 s.

Running mirrors on machines in the voivodeships is the owner's: the
machines, their addresses, their keys.
