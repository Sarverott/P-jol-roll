# Torrents pointed to by IPFS

The first step of M5, *no centre* (phase 37): the dataset and the bucket
shared as torrents, and the torrents found through IPFS - so the law of
Poland gathered here does not depend on one host.

```bash
task torrents -- -only dataset   # 12 torrents of the dataset (4.6 GB), 18 s here
task torrents                    # and the bucket's, a torrent per journal and year (189 GB, once)
task torrents:publish            # the owner's move: put on IPFS (asks first)
```

How it holds together:

1. **Hugging Face hosts the files.** Every torrent carries a web seed
   (BEP 19) pointing at the same files there, so a BitTorrent client
   (qBittorrent, Transmission, ...) downloads it even with no peer.
2. **Peers share it on.** Whoever keeps a torrent seeds it; peers meet by
   DHT, or by trackers given in `TORRENT_TRACKERS`.
3. **IPFS points to the torrents.** The torrents and `index.json` (each
   torrent's magnet link, infohash, size, CID) form one directory whose root
   CID is where they are found: `ipfs://<ROOT>/index.json`.

Everything is made offline by the Go stack (`stacks/go`, `pjolseed`): the
CIDs are those `ipfs add -r --cid-version=1` gives, checked against kubo,
and `torrents.car` holds every block. `task torrents:publish` starts the
IPFS node of compose (profile `ipfs`, kubo, its swarm on port 4001), imports
the CAR and pins it - publishing, so it is the owner's, as pushing to
Hugging Face is.

A torrent whose files did not change is kept: after a gathering, only the
years that grew are hashed again, and the root CID changes with them.

The details: [the Go stack's README](https://github.com/Sarverott/P-jol-roll/tree/master/stacks/go).
