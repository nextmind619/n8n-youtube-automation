# Easypanel on Ubuntu 24.04 — Installation & Production Setup

Step-by-step guide for **AutoPilot AI Lab** (`autopilotailab.com`).

**Target stack on VPS:**

| Service | Domain | Notes |
|---------|--------|-------|
| Easypanel UI | `http://SERVER_IP:3000` then lock down | Admin only |
| Backend API | `api.autopilotailab.com` | Node.js (`web/backend`) |
| Dashboard (optional) | `app.autopilotailab.com` | React (`web/frontend`) |
| Redis (optional) | internal only | For self-hosted n8n queue mode |
| n8n (optional) | `n8n.autopilotailab.com` | Only if moving off n8n Cloud |
| Landing page | `autopilotailab.com` | Stays on **Cloudflare Pages** |

---

## Part 0 — Before you start

### Requirements

| Item | Minimum | Recommended (your plan) |
|------|---------|-------------------------|
| OS | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| RAM | 2 GB | **16 GB** (Hetzner CPX41) |
| CPU | 2 vCPU | **8 vCPU** |
| Disk | 20 GB | **160 GB+** |
| Ports | **80, 443** free | Required for Easypanel + SSL |
| Server | **Fresh install** | No other Docker stacks |

> Easypanel installs **Docker Swarm**. Use a **dedicated, clean VPS** — not a machine that already runs Portainer, Coolify, or another panel.

### What you need ready

- [ ] VPS public IPv4 (example: `185.x.x.x`)
- [ ] SSH access as `root` (or sudo user)
- [ ] Cloudflare account (domain already on Cloudflare)
- [ ] `N8N_API_KEY` from n8n Cloud (or plan for self-hosted n8n)
- [ ] Google Service Account JSON for Sheets

---

## Part 1 — Connect to the server

From your PC (PowerShell):

```powershell
ssh root@YOUR_SERVER_IP
```

Replace `YOUR_SERVER_IP` with your Hetzner IP.

---

## Part 2 — Base Ubuntu 24.04 hardening

Run as root:

```bash
apt update && apt upgrade -y
timedatectl set-timezone UTC
apt install -y curl git ufw fail2ban
```

### Firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp    # Easypanel UI (temporary — restrict later)
ufw enable
ufw status
```

### Optional: swap (if RAM < 8 GB)

Skip this on **16 GB** CPX41 unless you want extra headroom:

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## Part 3 — Install Docker

Official Docker install script:

```bash
curl -sSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
docker --version
```

Verify Docker works:

```bash
docker run --rm hello-world
```

---

## Part 4 — Install Easypanel

Official stable installer:

```bash
docker run --rm -it \
  -v /etc/easypanel:/etc/easypanel \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  easypanel/easypanel setup
```

Wait until you see a success message.

### First login

1. Open in browser: `http://YOUR_SERVER_IP:3000`
2. Create **admin email + strong password**
3. Save credentials in a password manager

### Verify Easypanel is running

```bash
docker service ls
```

You should see `easypanel` in the list.

---

## Part 5 — Cloudflare DNS (point subdomains to VPS)

In **Cloudflare → autopilotailab.com → DNS → Records**:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| **A** | `api` | `YOUR_SERVER_IP` | **DNS only** (grey cloud) |
| **A** | `app` | `YOUR_SERVER_IP` | Proxied (orange) — optional |
| **A** | `n8n` | `YOUR_SERVER_IP` | DNS only — if self-hosting n8n |

> **Why grey cloud for `api`?** Easypanel issues **Let's Encrypt** directly to your server. Orange cloud on API can cause SSL/certificate issues unless you use Cloudflare Origin certificates.

### Cloudflare SSL (for proxied records)

**SSL/TLS → Overview → Full (strict)**

---

## Part 6 — Easypanel production settings

### 6.1 Create project

1. Easypanel → **Projects** → **Create Project**
2. Name: `autopilotailab`

### 6.2 Deploy Redis (optional — for self-hosted n8n queue)

1. **+ Service** → **Database** → **Redis**
2. Name: `redis`
3. Deploy
4. Internal hostname will be something like: `redis` (within Docker network)

Use this only if you self-host n8n with `EXECUTIONS_MODE=queue`.

---

## Part 7 — Deploy Backend API (`api.autopilotailab.com`)

### 7.1 Add App service

1. Project `autopilotailab` → **+ Service** → **App**
2. Name: `api`
3. **Source**: GitHub repo **or** Docker image (see below)

#### Option A — GitHub (recommended)

1. Connect GitHub in Easypanel
2. Repository: your fork with `n8n-youtube-automation`
3. **Root directory / build path**: `web/backend`
4. Easypanel detects Node.js and builds automatically

#### Option B — Dockerfile (if build fails)

Create `web/backend/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "src/index.js"]
```

Push to GitHub and redeploy.

### 7.2 Environment variables

In **App → api → Environment**, add:

```env
NODE_ENV=production
PORT=3001

N8N_BASE_URL=https://darkvault.app.n8n.cloud
N8N_API_KEY=your-n8n-api-key-here

GOOGLE_SHEETS_DOCUMENT_ID=1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0
GOOGLE_SHEETS_QUEUE_TAB=Queue
GOOGLE_SHEETS_CONTENT_TAB=Content
GOOGLE_SHEETS_ERRORS_TAB=Errors
GOOGLE_SHEETS_LOGS_TAB=Logs

WORKFLOW_TOPIC_DISCOVERY_ID=
WORKFLOW_VIDEO_PRODUCTION_ID=
```

For Google Sheets auth, paste the full JSON as one line:

```env
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

> Do **not** commit real keys to Git. Set them only in Easypanel Environment.

### 7.3 Domain & proxy

1. **Domains** tab → **Add Domain**
2. Domain: `api.autopilotailab.com`
3. **HTTPS / Let's Encrypt**: enable
4. **Proxy port**: `3001` (must match `PORT` in env)
5. Mark as **primary domain** (star icon)
6. **Deploy**

### 7.4 Test API

```bash
curl https://api.autopilotailab.com/api/health
```

Expected: JSON health response.

---

## Part 8 — Deploy Dashboard (`app.autopilotailab.com`) — optional

Keep `autopilotailab.com` on Cloudflare Pages. Deploy the React dashboard separately.

### 8.1 Build settings

1. **+ Service** → **App** → name: `dashboard`
2. Source: GitHub, path: `web/frontend`
3. Build command: `npm ci && npm run build`
4. Output / publish directory: `dist`

If Easypanel uses Nixpacks, add `web/frontend/package.json` scripts — already has `npm run build`.

### 8.2 Static site via nginx (if Node build serves static only)

Easier approach: build locally, upload `dist/` via **Direct Upload** or a small Dockerfile:

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Example `nginx.conf` for SPA + API proxy:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass https://api.autopilotailab.com/api/;
    proxy_ssl_server_name on;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### 8.3 Domain

1. Domain: `app.autopilotailab.com`
2. Proxy port: `80`
3. Enable Let's Encrypt
4. Deploy

---

## Part 9 — Self-hosted n8n (optional)

Skip if you keep **n8n Cloud** (`darkvault.app.n8n.cloud`).

1. **+ Service** → **App** → **Docker Image**: `n8nio/n8n:latest`
2. Name: `n8n`
3. Environment:

```env
N8N_HOST=n8n.autopilotailab.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.autopilotailab.com/
N8N_ENCRYPTION_KEY=generate-32-char-random-string
EXECUTIONS_MODE=queue
QUEUE_BULL_REDIS_HOST=redis
QUEUE_BULL_REDIS_PORT=6379
GENERIC_TIMEZONE=UTC
```

4. **Mount (Volume)** — persist data:
   - Mount path: `/home/node/.n8n`

5. Domain: `n8n.autopilotailab.com`, proxy port `5678`, HTTPS on
6. Update `N8N_BASE_URL` in backend env to `https://n8n.autopilotailab.com`

---

## Part 10 — Secure Easypanel admin panel

### 10.1 Restrict port 3000

After everything works, block public access to `:3000`:

```bash
ufw delete allow 3000/tcp
```

Access panel only via **SSH tunnel**:

```powershell
ssh -L 3000:localhost:3000 root@YOUR_SERVER_IP
```

Then open: `http://localhost:3000`

### 10.2 Enable 2FA

Easypanel → **Settings** → enable two-factor authentication if available.

### 10.3 Password reset (if locked out)

```bash
docker run --rm -it \
  -v /etc/easypanel:/etc/easypanel \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  easypanel/easypanel reset-password
```

---

## Part 11 — Updates & maintenance

### Update Easypanel

```bash
docker image pull easypanel/easypanel
docker service update easypanel --force
```

Or use the **Update** button in the Easypanel UI.

### Update an app

- Easypanel → service → **Deploy** (manual)
- Or enable **Auto Deploy** from GitHub webhook

### Logs

Easypanel → service → **Logs** tab (all container output)

### Backups

1. Easypanel → **Database Backups** (for Redis/Postgres if used)
2. Snapshot Hetzner VPS weekly (Hetzner Cloud → Snapshots)
3. Export n8n workflows JSON to Git

---

## Part 12 — Production checklist

- [ ] Fresh Ubuntu 24.04, Docker installed
- [ ] Easypanel installed, admin account created
- [ ] UFW: 22, 80, 443 open; 3000 closed after setup
- [ ] Cloudflare A record: `api` → VPS IP (DNS only)
- [ ] Backend deployed, `https://api.autopilotailab.com/api/health` OK
- [ ] Env vars set in Easypanel (no secrets in Git)
- [ ] Let's Encrypt active on all public domains
- [ ] `autopilotailab.com` still on Cloudflare Pages
- [ ] Hetzner snapshot scheduled

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Easypanel install fails | Ensure ports 80/443 free: `ss -tlnp \| grep -E ':80\|:443'` |
| 502 Bad Gateway | Wrong **proxy port** — must match app `PORT` |
| SSL certificate fails | DNS must point to server; use grey cloud for API |
| API 500 on Sheets | Set `GOOGLE_SERVICE_ACCOUNT_JSON` or mount key file |
| Can't open `:3000` | UFW blocked — use SSH tunnel |
| Docker Swarm errors | Reinstall on **fresh** server only |

---

## Quick reference — install commands only

```bash
# 1. Update + firewall
apt update && apt upgrade -y
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 3000/tcp && ufw enable

# 2. Docker
curl -sSL https://get.docker.com | sh

# 3. Easypanel
docker run --rm -it \
  -v /etc/easypanel:/etc/easypanel \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  easypanel/easypanel setup

# 4. Open panel
# http://YOUR_SERVER_IP:3000
```

---

## Official docs

- [Easypanel Getting Started](https://easypanel.io/docs)
- [App Service](https://easypanel.io/docs/services/app)
- [Custom SSL](https://easypanel.io/docs/guides/custom-ssl)
