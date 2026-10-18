# deploy: image and serving rules

```
angie.conf    angie config: one server on port 8080 with the cache rules
```

The image itself is built from `Containerfile` in the repository root, next to
`.dockerignore`.

## Build and run

```bash
docker build --load -f Containerfile -t serial-projector:test .
docker run -d --name serial-projector -p 8080:8080 serial-projector:test
```

The image builds the site with Vite in a Node stage and copies the result into
an angie image, so the build context needs nothing but the repository itself.

The container listens on 8080, not 80: an unprivileged port needs no extra setup
under rootless podman, and the outer port is mapped to whatever the host wants.

## Publishing

`.github/workflows/push.yaml` builds this image on every pull request and
publishes it to the Google Artifact Registry on every push to `master`, as
`serial-projector`, tagged both `latest` and with the build time in UTC.

## Caching

The build is the only thing that knows the file names, so the rules follow it:

- `/assets/` — Vite puts a content hash in every name, served immutable for a year.
- `/index.html`, `/sw.js`, `/manifest.webmanifest` — stable names, `no-cache`:
  a cached `index.html` would point at bundles that no longer exist, and a cached
  `sw.js` would hold back the PWA update prompt.
- `/icons/`, `/screenshots/` — hand-named, one week.

`manifest.webmanifest` is served as `application/manifest+json` explicitly:
angie's `mime.types` has no mapping for the extension.

## What the outer layer does, not the container

The config knows nothing about TLS or hostnames. It answers on any host over
http on port 8080. Something outside has to terminate TLS, redirect `http://` to
`https://`, and route `projector.amperka.ru` here.
