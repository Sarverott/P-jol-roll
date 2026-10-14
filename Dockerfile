# Image with node, playwright and camoufox - gatherer needs only node, checkup needs the browser.
# https://crawlee.dev/docs/guides/docker-images
FROM apify/actor-node-playwright-camoufox:24-1.60.0

# package files first, so layer with dependencies is reused until they change
COPY --chown=myuser package*.json ./

# typescript is built here and libraries of hub are development dependencies, so all are installed;
# scripts are skipped - browser is already in the image and git hooks have no use in it
RUN npm ci --ignore-scripts --audit=false

COPY --chown=myuser tsconfig.json astro.config.mjs ./
COPY --chown=myuser src ./src
# typescript into dist/, website of src/web into dist/web
RUN npm run build

# websites for checkup and map of huggingface repositories; gathered things come as a volume:
#   docker run -v "$PWD/resources:/home/myuser/resources" p-jol-roll gather 2026 --acts --limit 5
COPY --chown=myuser resources/frontends.json resources/.map.json ./resources/

ENTRYPOINT ["node", "dist/core/main.js"]
CMD ["gather"]
# website and api instead of gathering: compose.yaml, or
#   docker run -p 8080:8080 -e HOST=0.0.0.0 -v "$PWD/resources:/home/myuser/resources:ro" --entrypoint node p-jol-roll dist/openapi/main.js
