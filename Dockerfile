# Image with node, playwright and camoufox - gatherer needs only node, checkup needs the browser.
# https://crawlee.dev/docs/guides/docker-images
FROM apify/actor-node-playwright-camoufox:24-1.60.0

# package files first, so layer with dependencies is reused until they change
COPY --chown=myuser package*.json ./

# typescript is built here and libraries of hub are development dependencies, so all are installed;
# scripts are skipped - browser is already in the image and git hooks have no use in it
RUN npm ci --ignore-scripts --audit=false

COPY --chown=myuser tsconfig.json ./
COPY --chown=myuser src ./src
RUN npm run build

# websites for checkup and map of huggingface repositories; gathered things come as a volume:
#   docker run -v "$PWD/resources:/home/myuser/resources" p-jol-roll gather 2026 --acts --limit 5
COPY --chown=myuser resources/frontends.json resources/.map.json ./resources/

ENTRYPOINT ["node", "dist/main.js"]
CMD ["gather"]
