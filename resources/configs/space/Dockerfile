# The demo of P_JOL_ROLL: its own webapp-server (the http api with the website), published by
# every release of https://github.com/Sarverott/P-jol-roll to ghcr.io, in its remote mode: it
# reads only what a page needs from the dataset prepared on Hugging Face, and sends readers of
# raw files (PDF, HTML) to the bucket - nothing is taken in advance.
#
# The release is not written here: Hugging Face hands the variables of the space to the build
# as build arguments, and P_JOL_ROLL_VERSION is set there by every release (the release
# workflow, task resources:space:refresh). Without it the newest image is taken.
# Kept in git as resources/configs/space/Dockerfile; task resources:space copies it into the
# local side of the space.
ARG P_JOL_ROLL_VERSION=latest
FROM ghcr.io/sarverott/p-jol-roll-webapp-server:${P_JOL_ROLL_VERSION}
ENV PORT=7860 \
	DATASET_URL=https://huggingface.co/datasets/Sarverott/polish_national_law_docs/resolve/main \
	BUCKET_URL=https://huggingface.co/buckets/Sarverott/raw-law-of-poland/resolve
# the bucket is mounted at /data: the cache of pages and the logs stay off it (phase 20)
ENV RESOURCES_DIR=/tmp/p-jol-roll/resources LOG_DIR=/tmp/p-jol-roll/logs
EXPOSE 7860
