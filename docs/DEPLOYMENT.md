# Deployment Guide

**Version:** 1.1.0 | **Updated:** May 2026

alphinium-app forks are deployed to **alphinium user-pods** — an internal GKE Kubernetes platform that auto-provisions ingress, TLS, and DNS under `*.user-pods.alphinium.io`.

For the full user-pods platform reference see [USER-PODS.md](./USER-PODS.md).

---

## Overview: what gets deployed

Two pods per fork:

| Pod | Dockerfile | Port | Description |
|-----|-----------|------|-------------|
| `backend` | `backend/Dockerfile` | 1337 | Strapi CMS |
| `frontend` | `Dockerfile.frontend` | 80 | React Native Web (nginx) |

The deployment manifest is `.alphinium/pods.yml` — this is consumed by `alphinium-forge-cli` and the user-pods deployer. **Never delete or rename this file.**

---

## Automated deploy (via forge)

When `alphinium forge new` creates a project fork, it:

1. Forks this repo
2. Installs selected addons via `install.sh`
3. Generates secrets defined in `pods.yml → auto_generate`
4. Prompts for `user_provided` vars (Stripe keys etc.)
5. Builds Docker images (`linux/amd64`) and pushes to GCP Artifact Registry
6. Deploys both pods to user-pods cluster

---

## Manual deploy (step by step)

### Prerequisites

```bash
# Authenticate to GCP
gcloud auth login
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet

# Connect kubectl to user-pods cluster
gcloud container clusters get-credentials user-pods-cluster --zone us-central1-a
```

### 1. Build images (always use linux/amd64)

The GKE nodes are `linux/amd64`. Use the pre-configured `gke-builder` buildx instance:

```bash
TAG="alphinium-app-$(date +%Y%m%d-%H%M)"
REGISTRY="us-central1-docker.pkg.dev/alphinium-production/user-pods"

# Backend (Strapi)
docker buildx build \
  --builder gke-builder \
  --platform linux/amd64 \
  --tag "$REGISTRY/alphinium-backend:$TAG" \
  --file backend/Dockerfile \
  --push \
  ./

# Frontend (nginx serving React Native Web)
docker buildx build \
  --builder gke-builder \
  --platform linux/amd64 \
  --tag "$REGISTRY/alphinium-frontend:$TAG" \
  --file Dockerfile.frontend \
  --push \
  ./
```

⚠️ **Do NOT** `docker build` without `--platform linux/amd64` — the image will fail in the cluster.

### 2. Generate secrets (first deploy only)

The `auto_generate` vars in `pods.yml` must be generated once:

```bash
# Generate the values — store these securely, do not regenerate
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
APP_KEYS=$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)
API_TOKEN_SALT=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

### 3. Deploy backend pod

```bash
curl -s -X POST "https://api.user-pods.alphinium.io/deploy" \
  -H "Authorization: Bearer production-api-key-change-me" \
  -H "Content-Type: application/json" \
  -d "{
    \"image\": \"$REGISTRY/alphinium-backend:$TAG\",
    \"name\": \"my-app-backend\",
    \"port\": 1337,
    \"env_vars\": {
      \"NODE_ENV\": \"production\",
      \"DATABASE_CLIENT\": \"sqlite\",
      \"DATABASE_FILENAME\": \".tmp/data.db\",
      \"HOST\": \"0.0.0.0\",
      \"PORT\": \"1337\",
      \"ADMIN_JWT_SECRET\": \"$ADMIN_JWT_SECRET\",
      \"APP_KEYS\": \"$APP_KEYS\",
      \"API_TOKEN_SALT\": \"$API_TOKEN_SALT\",
      \"JWT_SECRET\": \"$JWT_SECRET\",
      \"TRANSFER_TOKEN_SALT\": \"$TRANSFER_TOKEN_SALT\",
      \"ENCRYPTION_KEY\": \"$ENCRYPTION_KEY\",
      \"STRIPE_SECRET_KEY\": \"sk_live_...\",
      \"STRIPE_WEBHOOK_SECRET\": \"whsec_...\",
      \"FRONTEND_URL\": \"https://my-app-frontend-XXXX.user-pods.alphinium.io\"
    }
  }"
```

⚠️ **Field is `env_vars` not `env`** — using `env` silently drops all environment variables.

### 4. Deploy frontend pod

Once the backend is deployed, grab its URL and set it as `EXPO_PUBLIC_API_URL`:

```bash
curl -s -X POST "https://api.user-pods.alphinium.io/deploy" \
  -H "Authorization: Bearer production-api-key-change-me" \
  -H "Content-Type: application/json" \
  -d "{
    \"image\": \"$REGISTRY/alphinium-frontend:$TAG\",
    \"name\": \"my-app-frontend\",
    \"port\": 80,
    \"env_vars\": {
      \"EXPO_PUBLIC_API_URL\": \"https://my-app-backend-XXXX.user-pods.alphinium.io\",
      \"EXPO_PUBLIC_APP_NAME\": \"My App\"
    }
  }"
```

The frontend Dockerfile injects `EXPO_PUBLIC_*` vars at **container startup** via an entrypoint script — no rebuild needed to change them.

### 5. Poll for completion

```bash
# Get deploy ID from the response, then poll:
curl -s "https://api.user-pods.alphinium.io/deploy/{deploy_id}" \
  -H "Authorization: Bearer production-api-key-change-me"
```

Pod URL: `https://{name}-XXXX.user-pods.alphinium.io`

---

## Updating a deployed pod

To update code on an existing pod, build a new image with a new tag and redeploy:

```bash
# Build new image with updated tag
TAG="alphinium-app-$(date +%Y%m%d-%H%M)"
# ... build + push ...

# Redeploy (will update the existing pod)
curl -s -X POST "https://api.user-pods.alphinium.io/deploy" \
  -H "Authorization: Bearer production-api-key-change-me" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$REGISTRY/alphinium-backend:$TAG\", \"name\": \"my-app-backend\", ...}"
```

---

## Google Analytics (no rebuild needed)

Set `GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX` in the frontend pod's env vars. The nginx entrypoint script injects the GA snippet at container startup — no Docker rebuild required.

---

## Cleaning up orphaned resources

If a pod deployment fails or you delete a pod, clean up orphaned Kubernetes resources before redeploying with the same name:

```bash
# Via API
curl -s -X POST "https://api.user-pods.alphinium.io/admin/cleanup/orphaned" \
  -H "Authorization: Bearer production-api-key-change-me"

# Via kubectl (more reliable)
kubectl delete ingress pod-MY-POD-NAME -n alphinium-7r86kuat --ignore-not-found
kubectl delete service pod-MY-POD-NAME -n alphinium-7r86kuat --ignore-not-found
kubectl delete pod pod-MY-POD-NAME -n alphinium-7r86kuat --ignore-not-found
```

---

## Stripe webhooks

After deploying the backend, register a Stripe webhook pointing to:

```
https://my-app-backend-XXXX.user-pods.alphinium.io/api/payments/webhook
```

Events to enable: `checkout.session.completed`, `customer.subscription.*`, `customer.subscription.trial_will_end`.

---

## Data persistence

Pods use **ephemeral storage by default** — SQLite data is lost on pod restart. For persistence, point Strapi at a PostgreSQL database:

```bash
DATABASE_CLIENT=postgres
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_NAME=alphinium
DATABASE_USERNAME=...
DATABASE_PASSWORD=...
```

---

## Currently deployed forks

| Name | URL | Notes |
|------|-----|-------|
| `alphinium-app-test` | `https://alphinium-app-test-69wj81da.user-pods.alphinium.io/` | Test fork |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Pod stuck in Pending | Orphaned ingress from previous deploy | Clean up orphaned resources (above) |
| `no match for platform in manifest` | Image built for arm64, cluster needs amd64 | Rebuild with `--platform linux/amd64` |
| Env vars not applied | Used `env` instead of `env_vars` in deploy request | Fix field name |
| 502 immediately after deploy | Pod still starting (Strapi takes 20-30s) | Wait and retry |
| SQLite data lost on restart | Ephemeral pod storage | Add `DATABASE_URL` for PostgreSQL |

---

## Related docs

- [USER-PODS.md](./USER-PODS.md) — Full user-pods platform reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [SETUP.md](./SETUP.md) — Local development setup
