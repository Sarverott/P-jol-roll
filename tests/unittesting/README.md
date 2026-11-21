# unittesting

The project on other systems, each in a container: `<system>/<setup>/`
holds a `Dockerfile` (the system set up one way), and each case is a
directory `-<case>/` beside it with a `run.sh`. Built from the root of the
repository, with nothing from the internet but the images and packages.

| System | Setup | Case | What it shows |
| ------ | ----- | ---- | ------------- |
| `parrot-os` | `headless-server` | `-gather-and-parse` | TypeScript builds, gathering against a local copy of the API, then tables, markdown and checksums |
| `parrot-os` | `headless-server` | `-bare-repo-on-drive` | a FAT drive mounted `noexec` with a bare repository: what refuses on the drive (npm `EPERM`, `Permission denied`, dubious ownership) and that the layout of the second-machine guide works; runs privileged to mount the image |

```sh
task unittesting:parrot-os                       # the default case
task unittesting:parrot-os -- -gather-and-parse  # a case by name
task unittesting:parrot-os-drive                 # -bare-repo-on-drive (docker run --privileged)
```

Later (Q1): VirtualBox and Proxmox stations.
