# webapp-server: the http api with the website over gathered resources - no browser, no gathering.
# Published to ghcr.io/sarverott/p-jol-roll-webapp-server by the release workflow; used by the
# webapp-server service of compose and by the demo space on Hugging Face. Built from the root:
#   docker build -f resources/configs/webapp-server/Dockerfile -t p-jol-roll-webapp-server .
FROM node:24-trixie-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts --audit=false --fund=false
COPY tsconfig.json astro.config.mjs ./
COPY src ./src
# the language packs: the viewer bundles them (src/i18n/browser.ts), node reads them beside dist/
COPY resources/locales ./resources/locales
# what the website reads while it is built (src/web/data): the members and the links of
# "Terms of use"
COPY .github/AUTHORS ./.github/AUTHORS
COPY webpage/src/data/links.yaml ./webpage/src/data/links.yaml
# typescript into dist/, the website into dist/web, then only what runs stays
RUN npm run build && npm prune --omit=dev --ignore-scripts --audit=false --fund=false

FROM node:24-trixie-slim
ENV NODE_ENV=production \
	HOST=0.0.0.0 \
	PORT=8080 \
	RESOURCES_DIR=/data/resources \
	LOG_DIR=/data/logs \
	TRUST_PROXY=1
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY --from=build /app/resources/locales ./resources/locales
# the map of Hugging Face repositories and the websites of acts, copied into RESOURCES_DIR
# when it has none
COPY resources/.map.json resources/frontends.json ./seed/
COPY resources/configs/webapp-server/start.sh ./start.sh
RUN mkdir -p /data && chown node:node /data
# uid 1000, as Hugging Face runs a space
USER node
EXPOSE 8080
CMD ["sh", "/app/start.sh"]
