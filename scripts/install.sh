#!/usr/bin/env sh
# NOTE: docker install, node install, npm upgrade with n, install python, pip and uv, 

# Tools of P_JOL_ROLL on Debian or Ubuntu: takes only what is missing, asks sudo for apt.
# Read before running - it installs system packages:   sh scripts/install.sh
set -eu

has() { command -v "$1" >/dev/null 2>&1; }
step() { printf '\n== %s\n' "$1"; }

if ! has apt-get; then
	echo "no apt-get here - install by hand: docker, node 24 with npm, python 3 with pip, uv" >&2
	exit 1
fi

step "docker"
if has docker; then docker --version
else
	# official script of Docker, it adds their apt repository
	curl -fsSL https://get.docker.com | sudo sh
	sudo usermod -aG docker "$USER" && echo "log in again to use docker without sudo"
fi

step "node and npm"
if ! has node; then sudo apt-get update && sudo apt-get install -y nodejs npm; fi
# n keeps versions of node; the project runs on 24
if ! has n; then sudo npm install -g n; fi
sudo n 24
hash -r
sudo npm install -g npm@latest
node --version && npm --version

step "python and pip"
if ! has python3 || ! python3 -m pip --version >/dev/null 2>&1; then
	sudo apt-get update && sudo apt-get install -y python3 python3-pip python3-venv
fi
python3 --version && python3 -m pip --version

step "uv"
if has uv; then uv --version
else
	# official installer of Astral, into ~/.local/bin
	curl -LsSf https://astral.sh/uv/install.sh | sh
fi

step "project"
echo "now: npm install && task verify"
