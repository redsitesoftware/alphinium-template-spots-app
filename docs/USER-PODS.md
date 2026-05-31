# User-Pods Deployment Guide

User-pods is the Alphinium internal Kubernetes hosting platform. It deploys Docker images as pods with auto-provisioned ingresses, TLS, and DNS under `*.user-pods.alphinium.io`.

**API:** `https://api.user-pods.alphinium.io`  
**Auth:** `Authorization: Bearer production-api-key-change-me`  
**Cluster:** `user-pods-cluster` in `us-central1-a` (GKE, `e2-standard-4`, 2 nodes)

---

## Building Images (amd64)

### ⚠️ Critical: Always build for `linux/amd64`

The GKE nodes are `linux/amd64`. This machine is `linux/arm64`. **Do not** `docker build` without `--platform linux/amd64` — the resulting image will fail to run in the cluster with `no match for platform in manifest`.

### Fast Local Build (~4 minutes)

Use the pre-configured `gke-builder` buildx instance which has QEMU + BuildKit v0.29:

```bash
TAG="myapp-$(date +%Y%m%d-%H%M)"
IMAGE="us-central1-docker.pkg.dev/alphinium-production/user-pods/IMAGE_NAME:$TAG"

docker buildx build \
  --builder gke-builder \
  --platform linux/amd64 \
  --tag "$IMAGE" \
  --file path/to/Dockerfile \
  --push \
  ./build-context/
```

**Why it's fast:**
- `node:22-slim` (Debian glibc) → `better-sqlite3` downloads **prebuilt binary** (no C++ compile)
- No `apt-get install` build tools in Dockerfile → saves 15-30 min of QEMU overhead
- `--mount=type=cache,target=/root/.npm` in Dockerfile → repeat builds reuse npm cache (~30s for npm after first build)

**First build:** ~4 min | **Subsequent builds (code change only):** ~1-2 min

### Auth to push to registry

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
```

### Cluster Build API (slow — use local build instead)

The build API uses `docker buildx build --platform linux/amd64` on an ARM64 cluster node, meaning QEMU emulation. Builds take **40-120 minutes** depending on native module compilation. Only use if local build isn't possible.

```bash
curl -s -X POST "https://api.user-pods.alphinium.io/build" \
  -H "Authorization: Bearer production-api-key-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "source_type": "git",
    "source_url": "https://github.com/redsitesoftware/alphinium-app",
    "branch": "test/payments-pod",
    "dockerfile_path": "backend/Dockerfile",
    "build_context": "./",
    "image_name": "my-image-name",
    "image_tag": "latest"
  }'
# Poll: GET /build/{build_id}
# No cancel endpoint exists — builds must run to completion or timeout
```

---

## Deploying a Pod

```bash
curl -s -X POST "https://api.user-pods.alphinium.io/deploy" \
  -H "Authorization: Bearer production-api-key-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "us-central1-docker.pkg.dev/alphinium-production/user-pods/IMAGE:TAG",
    "name": "my-pod-name",
    "port": 3000,
    "env_vars": {
      "NODE_ENV": "production",
      "MY_SECRET": "value"
    }
  }'
```

**⚠️ Field is `env_vars` not `env`** — using `env` silently drops all environment variables.

The pod URL will be `https://{name}-7r86kuat.user-pods.alphinium.io`.

Poll for completion: `GET /deploy/{deploy_id}`

---

## Cleaning Up Orphaned Resources

Failed or deleted pods leave behind orphaned ingresses and services that **block redeployment** with the same name. Always clean up before redeploying:

```bash
# Via API (may miss some)
curl -s -X POST "https://api.user-pods.alphinium.io/admin/cleanup/orphaned" \
  -H "Authorization: Bearer production-api-key-change-me"

# Via kubectl (more reliable)
kubectl delete ingress pod-MY-POD-ID -n alphinium-7r86kuat --ignore-not-found
kubectl delete service pod-MY-POD-ID -n alphinium-7r86kuat --ignore-not-found
kubectl delete pod pod-MY-POD-ID -n alphinium-7r86kuat --ignore-not-found
```

### Connect kubectl to user-pods cluster

```bash
gcloud container clusters get-credentials user-pods-cluster --zone us-central1-a
```

---

## Listing Images in Registry

```bash
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/alphinium-production/user-pods \
  --include-tags \
  --format="table(package,tags,createTime)"
```

---

## Dockerfile Best Practices for User-Pods

```dockerfile
# syntax=docker/dockerfile:1
# Use Debian slim (NOT Alpine) — prebuilt native module binaries available for glibc
FROM node:22-slim AS runtime

# Only add build tools if a package genuinely needs to compile from source
# better-sqlite3 v12.x has prebuilt linux-x64 binaries — no tools needed
WORKDIR /app

COPY package.json package-lock.json ./
# BuildKit cache mount — speeds up repeat builds significantly
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

COPY . .
EXPOSE 1337
CMD ["node", "server.js"]
```

**Key rules:**
- Use `node:22-slim` not `node:22-alpine` — Alpine (musl libc) has no prebuilt binaries for most native modules
- Use `--mount=type=cache,target=/root/.npm` on npm RUN steps
- Do NOT use `RUN --network=host` — not allowed in BuildKit container driver
- Pre-commit compiled output (`dist/`) to git to avoid slow TypeScript builds in Docker

---

## Currently Running Pods (as of 2026-05-08)

| Name | URL | Namespace | Notes |
|------|-----|-----------|-------|
| `redsitesoftware` | `https://redsitesoftware-7r86kuat.user-pods.alphinium.io` | alphinium-7r86kuat | redsitesoftware.com |
| `pod-chatinstance-prod-protected` | chatinstance.com | user-pods | Protected pod |
| `pod-alphinium-main-protected` | alphinium.com | user-pods | Protected pod |
| `payments-api` | `https://payments-api-7r86kuat.user-pods.alphinium.io` | alphinium-7r86kuat | Strapi v5 payments backend |

---

## Known Issues & Gotchas

1. **Pod stuck in Pending** → Check for orphaned ingresses (same name already exists). Clean up then redeploy.
2. **ImagePullBackOff with `no match for platform`** → Image is arm64, cluster needs amd64. Rebuild with `--platform linux/amd64`.
3. **Env vars not injected** → Use `env_vars` field, not `env` in deploy request.
4. **Cluster builds never complete** → They queue behind each other. No cancel API. Use local `gke-builder` builds instead.
5. **502/503 immediately after deploy** → Pod is still starting. Wait 20-30s for Strapi/Node to initialise.
6. **SQLite data lost on pod restart** → Pods use ephemeral storage. For persistence, add `DATABASE_URL` env var pointing to Postgres.
