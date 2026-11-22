# agentic-shell: a known shell for agents, next to the host but not on it (Q13, changelog
# phase 6 - read the owner's reasoning there before changing what this container may reach).
# bash with the tools of the project: node 24 and npm, git, task, python 3 and uv.
# It reaches the repository (mounted at /workspace) and the network, nothing more of the host:
# no Docker socket, no privileges, no port - only `docker compose exec`.
FROM node:24-trixie-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		bash bash-completion ca-certificates curl git less nano procps python3 python3-venv ripgrep jq \
	&& rm -rf /var/lib/apt/lists/* \
	&& curl -fsSL https://taskfile.dev/install.sh | sh -s -- -d -b /usr/local/bin v3.54.0
COPY --from=ghcr.io/astral-sh/uv:0.12.20 /uv /uvx /usr/local/bin/

# the user node (uid 1000) owns what it writes in /workspace, as a person on the host does
USER node
WORKDIR /workspace
ENV SHELL=/bin/bash
CMD ["sleep", "infinity"]
