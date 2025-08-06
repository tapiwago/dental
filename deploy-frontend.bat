@echo off
echo ==========================================
echo   Deploying Dental Frontend to Production
echo ==========================================

echo.
echo Step 1: Building frontend locally...
call npm install --legacy-peer-deps
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)

echo.
echo Step 2: Deploying to server...
ssh -i C:\Users\Tapiwa\.ssh\dental-deploy-key root@134.209.121.112 "
set -e

# Clone or update frontend repository
if [ ! -d /root/dental-frontend ]; then
  git clone https://github.com/tapiwago/dental.git /root/dental-frontend
else
  cd /root/dental-frontend && git pull origin main
fi

cd /root/dental-frontend

# Create environment file
echo 'VITE_API_BASE_URL=http://134.209.121.112:5000/api' > .env.production

# Install dependencies and build
npm install --legacy-peer-deps
npm run build

# Install nginx if not present
apt-get update -qq
apt-get install -y nginx

# Copy build files to nginx
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/

# Create nginx configuration
cat > /etc/nginx/sites-available/dental-frontend << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    root /var/www/html;
    index index.html;

    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options 'SAMEORIGIN' always;
    add_header X-XSS-Protection '1; mode=block' always;
    add_header X-Content-Type-Options 'nosniff' always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript;
}
NGINXEOF

# Enable site and restart nginx
ln -sf /etc/nginx/sites-available/dental-frontend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
systemctl enable nginx

echo 'Frontend deployment completed successfully!'
"

if %ERRORLEVEL% neq 0 (
    echo ERROR: Deployment failed
    pause
    exit /b 1
)

echo.
echo Step 3: Testing deployment...
timeout 5 >nul
curl -f http://134.209.121.112/ || echo "Frontend health check failed"
curl -f http://134.209.121.112/api/health || echo "API health check failed"

echo.
echo ==========================================
echo   Frontend Deployment Complete!
echo   URL: http://134.209.121.112
echo ==========================================
pause
