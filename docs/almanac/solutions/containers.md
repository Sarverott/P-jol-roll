# Containers

The image of webapp-server (`resources/configs/webapp-server/Dockerfile`)
is built by the release and run by the demo space and compose.

- **`.dockerignore` keeps `resources/` out but for a few files.** Anything
  new that the build or the server reads from there must be let in by name
  (`!resources/locales/`). `task check` builds from the working tree and
  does not see such a gap; `docker build -f resources/configs/webapp-server/Dockerfile .`
  does.
- **No imports of a bundler's dialect** (`?raw`, `?url`, yaml by a plugin): a
  file is read with `node:fs` while the website is built, and what the
  viewer needs comes as a prop. Whatever the build reads outside `src/` is
  copied into the image by name.
- Ports of services avoid the ones a desktop already holds (mDNS 5353).
- Data of containers lives in `resources/.containerdatavol/`, never pushed.

## Cases

- [The release image does not build: language packs left out](../cataclistics/container-missing-locales.md)
- [The release image does not build: the viewer imported a file outside `src/` by `?raw`](../cataclistics/container-bundler-imports.md)
- [The internal DNS does not start](../cataclistics/mdns-port.md)
