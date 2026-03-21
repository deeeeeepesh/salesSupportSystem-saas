# Sales Support System - Complete Deployment Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Local Development](#local-development)
4. [Google Sheets Setup](#google-sheets-setup)
5. [Production Deployment](#production-deployment)
6. [Maintenance](#maintenance)
7. [Troubleshooting](#troubleshooting)

## System Overview

This is an internal sales support portal that:
- Shows mobile phone models with prices, offers, and sales pitches
- Syncs data from Google Sheets (admin-managed)
- Requires login (no anonymous access)
- Supports 50+ concurrent users
- Hosted on DigitalOcean

### Architecture
- **Frontend**: Next.js 14 with Server-Side Rendering
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (users only), Google Sheets (products)
- **Cache**: In-memory (2min TTL) or Redis
- **Auth**: NextAuth.js with bcrypt
- **Deployment**: Docker + Nginx + SSL

## Prerequisites

### For Local Development
- Node.js 18+
- PostgreSQL 15+
- Google Cloud account with Sheets API access

### For Production
- DigitalOcean droplet (4GB RAM, 2vCPU recommended)
- Domain name with DNS configured
- Google Cloud Service Account

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment

Create `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/salesdb"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id"
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
```

### 3. Setup Database
```bash
npx prisma generate
npm run db:migrate
npm run db:seed
```

### 4. Start Dev Server
```bash
npm run dev
```

## Google Sheets Setup

### 1. Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable "Google Sheets API"
4. Create Service Account:
   - IAM & Admin → Service Accounts → Create
   - Download JSON key file

### 2. Prepare Google Sheet
1. Create or open your sheet
2. Rename first sheet to "Price List"
3. Add header row with exact column names:
   ```
   Brand | Model | Image | Variant | MRP | MOP | Final Price | Sellout MOP | 
   Sellout Final | Sellout from date | Sellout To Date | Last Updated | 
   Quick Pitch | Bank Offers | Upgrade / Exchange Offers | 
   Store Offers and Gifts | Weekly Focus | All Models | New Launch
   ```
4. Weekly Focus, All Models, New Launch = checkboxes
5. Share sheet with service account email (from JSON: `client_email`)

### 3. Configure Credentials
- Copy entire JSON content as single line
- Set in `.env` as `GOOGLE_SHEETS_CREDENTIALS`
- Set `GOOGLE_SHEETS_SPREADSHEET_ID` from sheet URL

## Production Deployment

### Railway Cron Job Setup (Auto-Sync)

The app uses a Railway Cron Job to automatically sync all tenant Google Sheets every 2 minutes.

### Step 1: Add CRON_SECRET environment variable
In Railway Dashboard → your service → Variables:
```
CRON_SECRET=<generate with: openssl rand -base64 32>
```

### Step 2: Create a Railway Cron Job
In Railway Dashboard → your project → add a new **Cron Job** service:
- **Schedule**: `*/2 * * * *` (every 2 minutes)
- **Command**:
  ```
  curl -s -X POST https://your-domain.com/api/cron/sync-sheets \
    -H "x-cron-secret: $CRON_SECRET"
  ```
  Replace `your-domain.com` with your actual deployment domain (e.g. `salessync.dedasystems.com`).

### Step 3: Verify
After deploying, manually trigger the cron endpoint to confirm it works:
```bash
curl -s -X POST https://your-domain.com/api/cron/sync-sheets \
  -H "x-cron-secret: <your-secret>" | jq .
```
Expected response:
```json
{
  "synced": 2,
  "succeeded": 2,
  "failed": 0,
  "results": [
    { "slug": "store1", "success": true, "productsCount": 47, "message": "Sync completed successfully" },
    { "slug": "store2", "success": true, "productsCount": 23, "message": "No changes detected" }
  ]
}
```

### Method 1: Docker Compose (Recommended)

#### Step 1: Provision Droplet
```bash
# DigitalOcean: Create Droplet
# - Ubuntu 22.04 LTS
# - 4GB RAM / 2 vCPU
# - Add your SSH key
```

#### Step 2: Install Docker
```bash
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y
```

#### Step 3: Setup Application
```bash
# Clone repo
git clone <repo-url> /opt/sales-support
cd /opt/sales-support

# Create .env
cp .env.example .env
nano .env
```

Update `.env`:
```env
DB_PASSWORD=<strong-password>
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.com
GOOGLE_SHEETS_SPREADSHEET_ID=<your-id>
GOOGLE_SHEETS_CREDENTIALS='<json-credentials>'
```

#### Step 4: Deploy
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Setup database
docker-compose exec app npm run db:setup
```

#### Step 5: Configure Nginx
```bash
# Install Nginx
apt install nginx -y

# Copy config
cp nginx.conf /etc/nginx/sites-available/sales-support

# Update domain
nano /etc/nginx/sites-available/sales-support
# Change 'your-domain.com' to actual domain

# Enable site
ln -s /etc/nginx/sites-available/sales-support /etc/nginx/sites-enabled/

# Test and reload
nginx -t
systemctl reload nginx
```

#### Step 6: Setup SSL
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d your-domain.com

# Test renewal
certbot renew --dry-run
```

### Method 2: Manual Deployment

#### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
```

#### Install PostgreSQL
```bash
apt install postgresql postgresql-contrib -y

# Create database
sudo -u postgres psql
CREATE DATABASE salesdb;
CREATE USER salesuser WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE salesdb TO salesuser;
\q
```

#### Deploy Application
```bash
cd /opt/sales-support
npm install
npm run build

# Setup database
npm run db:setup

# Install PM2
npm install -g pm2

# Start app
pm2 start npm --name "sales-support" -- start
pm2 save
pm2 startup
```

## Maintenance

### Update Application
```bash
cd /opt/sales-support
git pull
docker-compose down
docker-compose up -d --build
docker-compose exec app npm run db:migrate:deploy
```

### Backup Database
```bash
# Backup
docker-compose exec postgres pg_dump -U salesuser salesdb > backup-$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U salesuser salesdb < backup.sql
```

### View Logs
```bash
docker-compose logs -f app
docker-compose logs --tail=100 app
```

### Monitor Resources
```bash
docker stats
htop
```

### Clear Cache
Login as admin → Admin Panel → Refresh Cache

## Troubleshooting

### Issue: Can't connect to database
```bash
# Check PostgreSQL
docker-compose ps postgres
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U salesuser -d salesdb
```

### Issue: Google Sheets not loading
1. Check service account has access to sheet
2. Verify sheet name is "Price List"
3. Check credentials JSON is valid
4. View app logs: `docker-compose logs app | grep google`

### Issue: Authentication not working
1. Check `NEXTAUTH_SECRET` is set
2. Verify `NEXTAUTH_URL` matches your domain
3. Clear browser cookies
4. Check database has users: `docker-compose exec postgres psql -U salesuser -d salesdb -c "SELECT * FROM users;"`

### Issue: Build fails
```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Out of memory
- Upgrade droplet to 4GB+ RAM
- Check for memory leaks: `docker stats`
- Restart services: `docker-compose restart`

## Security Checklist

- [ ] Strong passwords for all accounts
- [ ] NEXTAUTH_SECRET is random and secure
- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (UFW):
  ```bash
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw enable
  ```
- [ ] Regular backups scheduled
- [ ] Keep system updated: `apt update && apt upgrade`
- [ ] Monitor logs for suspicious activity
- [ ] Google Sheets credentials secured (not in git)

## Performance Optimization

### Enable Redis (Optional)
Uncomment Redis config in `docker-compose.yml` and update cache implementation.

### Adjust Cache TTL
Edit `lib/google-sheets.ts`:
```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

### Database Connection Pooling
Edit `lib/db.ts` to add connection pool settings.

## Monitoring

### Setup Uptime Monitoring
Use services like:
- UptimeRobot
- Pingdom
- StatusCake

### Log Monitoring
```bash
# Setup log rotation
nano /etc/docker/daemon.json
```
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## Support

For issues:
1. Check logs first
2. Review this guide
3. Verify environment configuration
4. Test Google Sheets access
5. Check database connectivity

## Maintenance Schedule

- **Daily**: Check logs for errors
- **Weekly**: Database backup
- **Monthly**: System updates, certificate renewal check
- **Quarterly**: Review user access, security audit
