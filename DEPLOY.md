# Tom Cruises CMS - Deployment Guide

This guide covers deploying the Tom Cruises Next.js 14 CMS on your Ubuntu server.

## Prerequisites

- Ubuntu 20.04+ with Node.js 18+ and npm
- PostgreSQL 12+ installed and running
- nginx installed and configured
- PM2 for process management (or use your preferred process manager)

## Step 1: Clone/Copy Project Files

Copy the entire project directory to your server:

```bash
cd /var/www
git clone <your-repo-url> tom-cruises.com
# OR
cp -r /path/to/local/tom-cruises.com ./tom-cruises.com
cd tom-cruises.com
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database connection string
DATABASE_URL=postgresql://tom_user:secure_password@localhost:5432/tomcruises

# NextAuth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-generated-secret-here

# Your site URL
NEXTAUTH_URL=https://tom-cruises.com

# Environment
NODE_ENV=production
```

Generate a secure NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

## Step 4: Set Up PostgreSQL Database

Create a PostgreSQL user and database:

```bash
sudo -u postgres psql

-- In psql:
CREATE USER tom_user WITH PASSWORD 'secure_password';
CREATE DATABASE tomcruises OWNER tom_user;
GRANT ALL PRIVILEGES ON DATABASE tomcruises TO tom_user;

-- Check that tables are created
\dt
```

Exit psql with `\q`.

## Step 5: Initialize Database Schema

Run the schema setup:

```bash
npm run db:setup
```

Verify the tables were created:

```bash
psql $DATABASE_URL

-- In psql:
\dt

-- You should see: boats, users, boat_images, blog_posts, boat_tracking
```

## Step 6: Create Admin Users

Generate bcrypt hashes for passwords. Use this Node.js command:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10))"
```

Run this for each admin password you want to create.

Then insert users into the database:

```bash
psql $DATABASE_URL

-- In psql:
INSERT INTO users (name, email, password_hash, boat_id)
VALUES
  ('Toni', 'toni@example.com', '$2a$10$...hash...', 2),  -- Pamela (boat_id=2)
  ('Friend', 'friend@example.com', '$2a$10$...hash...', 1);  -- Lyyli (boat_id=1)
```

Replace the hash values with the ones you generated above.

## Step 7: Migrate Existing Images (Optional)

If you have existing images from the old static site, move them to the uploads directory:

```bash
mkdir -p public/uploads
# Copy your images
cp /path/to/old/images/* public/uploads/

# Register them in the database
psql $DATABASE_URL

-- In psql:
INSERT INTO boat_images (boat_id, filename, sort_order)
VALUES
  (1, 'photo1.jpg', 0),
  (1, 'photo2.jpg', 1),
  (2, 'pamela1.jpg', 0),
  (2, 'pamela2.jpg', 1);
```

## Step 8: Build the Project

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

## Step 9: Start with PM2

Install PM2 globally (if not already installed):

```bash
npm install -g pm2
```

Start the application:

```bash
pm2 start npm --name tom-cruises -- run start
```

Verify it's running:

```bash
pm2 list
pm2 logs tom-cruises
```

Optionally, save PM2 config to auto-start on reboot:

```bash
pm2 startup
pm2 save
```

## Step 10: Configure nginx Reverse Proxy

Create an nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/tom-cruises.com
```

Paste this configuration:

```nginx
upstream tom_cruises_app {
  server localhost:3000;
}

server {
  listen 80;
  listen [::]:80;
  server_name tom-cruises.com www.tom-cruises.com;

  # Redirect to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name tom-cruises.com www.tom-cruises.com;

  # SSL certificates (use Let's Encrypt)
  ssl_certificate /etc/letsencrypt/live/tom-cruises.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/tom-cruises.com/privkey.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;

  # Client body size limit
  client_max_body_size 50M;

  location / {
    proxy_pass http://tom_cruises_app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header Connection '';
  }

  # Static files caching
  location ~* \.(jpg|jpeg|png|gif|css|js|svg|woff|woff2)$ {
    proxy_pass http://tom_cruises_app;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Uploads directory (serve directly if they exist)
  location /uploads/ {
    alias /var/www/tom-cruises.com/public/uploads/;
    expires 30d;
    add_header Cache-Control "public";
  }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/tom-cruises.com /etc/nginx/sites-enabled/tom-cruises.com
```

Test nginx configuration:

```bash
sudo nginx -t
```

Reload nginx:

```bash
sudo systemctl reload nginx
```

### Set Up SSL with Let's Encrypt

If you don't have an SSL certificate:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d tom-cruises.com -d www.tom-cruises.com
```

## Step 11: GPS Tracker Integration

Your boats can automatically update their positions via the public tracking ingest endpoint.

### Getting the API Key

1. Log into the admin panel at `https://tom-cruises.com/admin`
2. Go to "Live Tracking"
3. Copy the API key displayed

### Sending Position Updates

Send a POST request to `/api/tracking/ingest` with this JSON body:

```json
{
  "apiKey": "your-boat-api-key",
  "lat": 60.123456,
  "lng": 25.123456,
  "note": "Anchored at Helsinki Marina",
  "speed": 0,
  "heading": 180
}
```

Example with curl:

```bash
curl -X POST https://tom-cruises.com/api/tracking/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "lat": 60.123456,
    "lng": 25.123456,
    "note": "At sea"
  }'
```

### GPS Tracker Configuration

Most GPS trackers allow you to configure a webhook URL. Set it to:

```
https://tom-cruises.com/api/tracking/ingest
```

And configure the payload format to match the JSON structure above. You can often use variables like `{lat}`, `{lng}`, `{speed}` that the tracker will substitute.

### Example: Automatic Updates Every Hour

You can set up a cron job on your server to periodically send updates (if you have GPS data available):

```bash
# Edit crontab
crontab -e

# Add this line to run every hour
0 * * * * curl -X POST https://tom-cruises.com/api/tracking/ingest \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"YOUR_API_KEY","lat":60.123456,"lng":25.123456}'
```

## Step 12: Maintenance & Monitoring

### Check Application Status

```bash
pm2 list
pm2 logs tom-cruises
```

### Database Backups

Set up automated PostgreSQL backups:

```bash
# Create a backup script
sudo nano /usr/local/bin/backup-tomcruises.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/tomcruises"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
pg_dump tomcruises | gzip > $BACKUP_DIR/tomcruises_$TIMESTAMP.sql.gz
# Keep only last 30 days of backups
find $BACKUP_DIR -name "tomcruises_*.sql.gz" -mtime +30 -delete
```

Make it executable and add to crontab:

```bash
sudo chmod +x /usr/local/bin/backup-tomcruises.sh

# Run daily at 2 AM
sudo -u postgres crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-tomcruises.sh
```

### Log Rotation

Ensure PM2 logs are rotated:

```bash
pm2 install pm2-logrotate
pm2 save
```

### Update the Application

When deploying updates:

```bash
cd /var/www/tom-cruises.com
git pull  # or copy new files
npm install
npm run build
pm2 reload tom-cruises
```

## Troubleshooting

### Application won't start

Check the logs:

```bash
pm2 logs tom-cruises
```

Ensure the database connection string is correct and PostgreSQL is running.

### Database connection errors

Test the connection:

```bash
psql $DATABASE_URL -c "SELECT 1"
```

Verify the DATABASE_URL environment variable is set.

### Images not uploading

Ensure the `public/uploads` directory exists and is writable:

```bash
ls -la public/
chmod 755 public/uploads
```

### nginx 502 Bad Gateway

The Node app might be down or not listening on port 3000:

```bash
pm2 logs tom-cruises
lsof -i :3000
```

Restart if needed:

```bash
pm2 restart tom-cruises
```

### HTTPS certificate issues

Renew Let's Encrypt certificates before expiration:

```bash
sudo certbot renew
```

## Performance Tips

- Enable gzip compression in nginx
- Use CDN for static files
- Monitor database query performance with EXPLAIN
- Use PM2 cluster mode for multi-core systems:

```bash
pm2 delete tom-cruises
pm2 start npm --name tom-cruises --instances max -- run start
pm2 save
```

## Support & Further Configuration

For more information:
- Next.js docs: https://nextjs.org/docs
- NextAuth.js: https://next-auth.js.org
- PostgreSQL: https://www.postgresql.org/docs/
- nginx: https://nginx.org/en/docs/
