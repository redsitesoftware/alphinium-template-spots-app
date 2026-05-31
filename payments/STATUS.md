# Alphinium Payments Status

## Status

Payments are live in production.

## Production architecture

- Permanent Strapi pod in GKE
- Namespace: `alphinium-alphinium-cluster`
- Public endpoint: `https://payments-api.alphinium.com`
- Backing database: PostgreSQL, not SQLite
- TLS: Let's Encrypt via cert-manager
- Independent of `user-pods-api`

## Billing behavior

Plan definitions live in `backend/config/plans.js`.

- `starter` has `trialDays: 7`
- `developer`, `team`, and `enterprise` use `trialDays: 0`
- Price IDs are loaded from `STRIPE_PRICE_*` environment variables
- The checkout controller resolves `trialDays` from plan config at request time

## Deployment modes

### Alphinium platform

This repo powers the permanent production backend at `payments-api.alphinium.com`.

### Forge and customer projects

Template-based customer deployments still use `scripts/deploy-payments.sh` to create a tenant-specific payments pod with that project's Stripe keys.

## Operational checks

```bash
curl -fsS https://payments-api.alphinium.com/api/payment/plans
curl -fsS https://payments-api.alphinium.com/_health
kubectl rollout status deployment/alphinium-alphinium-cluster-strapi -n alphinium-alphinium-cluster
```
