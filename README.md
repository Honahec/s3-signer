# S3 Signer

S3 Signer is a small web service for creating short download links backed by
S3-compatible object storage. Users sign in with PocketID/OIDC, save encrypted
OSS profiles, browse objects, and create public links that redirect to fresh
short-lived presigned URLs.

## BREAK UPDATE: v2.0.0

Since `docker-compose.yml` now read `DATABASE_URL` from environment, if you want to update, please according to:

```bash
docker compose exec postgres psql -U s3_signer -d s3_signer -c "ALTER USER s3_signer WITH PASSWORD 'your-new-password';"
docker compose pull app
docker compose up -d app
```

## Features

- PocketID/OIDC login with admin group access control.
- Encrypted storage credentials for S3-compatible services such as Aliyun OSS.
- Object browser with keyword search.
- Link creation, link history, soft delete, and cleanup support.
- Archive creation that uploads a generated ZIP object back to the bucket and
  exposes it through the same signed download flow.
- Public download endpoint that generates a new presigned URL for each request.
- Docker deployment with PostgreSQL persistence.

## Quick Start

Create a `.env` file:

```bash
cp .env.example .env
```

Fill the required values:

```env
AUTH_SECRET=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_ADMIN_GROUPS=admins
APP_ENCRYPTION_KEY=
```

For Docker Compose, the bundled PostgreSQL service defaults to:

```env
PORT=3000
DATABASE_URL=postgres://s3_signer:s3_signer@postgres:5432/s3_signer
```

For local UI/API development without PocketID login, enable the dev-only auth
bypass:

```env
LOCAL_DEV_AUTH_BYPASS=true
```

This bypass is ignored when `NODE_ENV=production`.

Generate secrets with:

```bash
openssl rand -base64 32
```

Use one generated value for `AUTH_SECRET`, and another generated value for
`APP_ENCRYPTION_KEY`.

Start the service:

```bash
docker compose pull
docker compose up -d
```

By default Docker Compose uses the latest published image:

```text
ghcr.io/honahec/s3-signer:latest
```

To pin a specific image version, set `IMAGE_TAG` in `.env`:

```env
IMAGE_TAG=1.2.3
```

## Upgrading

For a normal image update:

```bash
docker compose pull app
docker compose up -d app
```

## OIDC

Register this callback URL in your OIDC provider:

```text
https://{PUBLIC_APP_URL}/api/auth/callback/pocketid
```

## Reverse Proxy

Run one app container and put two domains in front of it:

- `{PUBLIC_APP_URL}` proxies the whole app.
- `{PUBLIC_DOWNLOAD_BASE_URL}/*` proxies to `/download/*` on the same app.

The app listens on port `3000` inside Docker Compose.

## Archive API

Create an archive object from existing bucket objects:

```http
POST /api/archives
Content-Type: application/json
```

```json
{
  "profileId": "00000000-0000-4000-8000-000000000000",
  "objectKeys": ["reports/a.pdf", "reports/b.pdf"],
  "validForSeconds": 86400,
  "maxDownloads": null,
  "downloadFilename": "reports.zip"
}
```

The API writes `s3-signer-archives/{userId}/{linkId}.zip` into the same bucket,
creates a normal public download link for that ZIP object, and returns the link
URL. Running link cleanup, or deleting that link manually, also deletes the
generated archive object.
