FROM node:26.13.1-alpine3.24 AS build

WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
# vite.config.js runs the eslint plugin as part of `vite build`, so the flat
# config has to be in the image too.
COPY eslint.config.mjs vite.config.js index.html ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

FROM docker.angie.software/angie:1.12.6-minimal

LABEL org.opencontainers.image.title="projector.amperka.ru" \
      org.opencontainers.image.description="Serial Projector static site" \
      org.opencontainers.image.source="https://github.com/amperka/serial-projector"

COPY deploy/angie.conf /etc/angie/http.d/default.conf
COPY --from=build /build/dist /srv/serial-projector/site

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
    CMD wget -q -O /dev/null --spider http://127.0.0.1:8080/ || exit 1
