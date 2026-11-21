# Parrot OS as a headless gathering server (Q1 of the devlog): the repository installed the way
# docs/guides/second-machine.md says, on the machine's own disk, by a user who is not root.
# Built from the root of the repository:
#   task unittesting:parrot-os -- -gather-and-parse
FROM node:24-trixie-slim AS node

FROM parrotsec/core:latest
# Node 24 and npm 11 taken whole from the official image (Parrot is Debian, the same libc)
COPY --from=node /usr/local /usr/local
RUN apt-get update \
	&& apt-get install -y --no-install-recommends git ca-certificates dosfstools util-linux sudo \
	&& rm -rf /var/lib/apt/lists/* \
	&& useradd --create-home gatherer
USER gatherer
WORKDIR /home/gatherer/P-jol-roll
COPY --chown=gatherer package*.json ./
# no browser download and no hooks: a headless server gathers through the API only
RUN npm ci --ignore-scripts --audit=false --fund=false
COPY --chown=gatherer . .
# each case is a directory next to this file with its run.sh
ENTRYPOINT ["sh", "-c", "exec sh \"tests/unittesting/parrot-os/headless-server/$0/run.sh\""]
CMD ["-gather-and-parse"]
