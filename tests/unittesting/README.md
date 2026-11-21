# unittesting

The project on other systems, each in a container: `<system>/<setup>/`
holds a `Dockerfile` (the system set up one way), and each case is a
directory `-<case>/` beside it with a `run.sh`. Built from the root of the
repository, with nothing from the internet but the images and packages.

| System | Setup | Case | What it shows |
| ------ | ----- | ---- | ------------- |
| `parrot-os` | `headless-server` | `-gather-and-parse` | TypeScript builds, gathering against a local copy of the API, then tables, markdown and checksums |

```sh
task unittesting:parrot-os                       # the default case
task unittesting:parrot-os -- -gather-and-parse  # a case by name
```

Later (Q1): the trouble with a bare repository on an external drive as a
case of its own, then VirtualBox and Proxmox stations.
