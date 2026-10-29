# Deployment Guide — Open Client Portal

## 1. Quick Start with Docker Compose

The simplest and recommended method for production deployment is Docker Compose.

### Step 1: Clone the repository
```bash
git clone https://github.com/0xyz-exe/open-client-portal.git
cd open-client-portal
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and configure strong secrets:
```bash
cp .env.example .env
```
Edit `.env`:
```env
APP_ENV=production
SECRET_KEY=generate_a_random_64_character_string_here
POSTGRES_USER=ocp_prod_user
POSTGRES_PASSWORD=strong_postgres_password_here
POSTGRES_DB=open_client_portal
```

### Step 3: Launch Containers
```bash
docker compose up -d --build
```

### Step 4: Run Initial Seed (Optional for Demonstration)
```bash
docker compose exec api python seed.py
```

### Step 5: Access Application
- Web Application: `http://your-server-ip/`
- API Health Endpoint: `http://your-server-ip/health`
- API Interactive OpenAPI Docs: `http://your-server-ip/docs`

---

## 2. Reverse Proxy & SSL (Nginx / Caddy / Cloudflare)

Example Nginx configuration with SSL termination:
```nginx
server {
    listen 80;
    server_name portal.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name portal.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/portal.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
