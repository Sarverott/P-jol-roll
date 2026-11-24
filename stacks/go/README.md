# The Go stack

The third stack of the plan (Q18, phase 37): the decentralisation circuits -
torrents, IPFS, and later WireGuard, Traefik and Cosmos SDK (M5) - in a
module of its own, so it keeps its integrity inside.

## pjolseed: torrents pointed to by IPFS

```bash
task torrents                    # every part: the dataset's, then the bucket's (189 GB to hash once)
task torrents -- -only dataset   # the dataset only (4.6 GB, 18 s here)
task torrents -- -dry            # what would be made, nothing hashed
task torrents:publish            # the owner's: the IPFS node of compose, the CAR imported and pinned
```

| It makes, in `resources/torrents/` | What it is |
| --- | --- |
| `dataset-<part>.torrent` | a part of the dataset (`acts`, `details`, `texts`, ...) |
| `bucket-<journal>-<year>.torrent` | the raw files of a journal's year (`bucket-DU-2026`, `bucket-sejm-term10`) |
| `index.json` | each torrent: infohash, magnet link, size, files, web seeds, its CID |
| `torrents.car` | the torrents and the index as one UnixFS directory, for any IPFS node |
| `ROOT` | the directory's root CID |

Every torrent carries a web seed (BEP 19): the same files on Hugging Face
(the dataset's `resolve/main/`, the bucket's `resolve/`), so a client
downloads it even when nobody seeds - and every peer that keeps it shares it
on. A torrent whose files did not change (their paths and sizes) is kept as
it was, not hashed again. Files being written (`.part`) and hidden ones are
left out.

The CIDs are what `ipfs add -r --cid-version=1` gives (UnixFS, raw leaves,
chunks of 256 KiB) - computed by IPFS's own libraries (`boxo`) offline, and
checked against kubo 0.39 in the tests. Nothing is sent anywhere until the
owner runs `task torrents:publish`.

| Variable | Default | What it is |
| --- | --- | --- |
| `DATASET_URL` | `https://huggingface.co/datasets/Sarverott/polish_national_law_docs/resolve/main` | the dataset's web seed |
| `BUCKET_URL` | `https://huggingface.co/buckets/Sarverott/raw-law-of-poland/resolve` | the bucket's |
| `TORRENT_TRACKERS` | | trackers, comma separated; without them peers meet by DHT |

```bash
task go:check     # gofmt, go vet, go test
```

| Package | What it does |
| --- | --- |
| `cmd/pjolseed` | the command: the parts, the torrents kept or made, the index, the IPFS directory |
| `internal/torrent` | a multi-file torrent of a directory, pieces hashed, web seeds, a magnet link |
| `internal/bencode` | the encoding of BitTorrent |
| `internal/ipfs` | a UnixFS directory built in memory, its CIDs, its CAR |
