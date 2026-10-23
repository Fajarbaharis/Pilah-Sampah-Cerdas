const { execSync } = require('child_process');

const nginxConfig = `server {
    server_name staging.berseka.id;

    root /var/www/staging-web/dist;
    index index.html;

    client_max_body_size 50M;

    # Frontend SPA routing - Always revalidate index.html
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Brand Logos & Static Images - Revalidate (no stale cache)
    location /logos/ {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    location /image/ {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Static Assets (hashed JS/CSS)
    location ~* \\.(?:ico|css|js|gif|jpe?g|png|webp|svg)$ {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Uploaded media (reverse proxy to production berseka.id where live uploaded photos reside)
    location ^~ /uploads/ {
        proxy_pass https://berseka.id/uploads/;
        proxy_set_header Host berseka.id;
        proxy_ssl_server_name on;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    # API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static downloads (APK Staging)
    location /downloads/ {
        alias /var/www/staging-web/dist/downloads/;
        autoindex on;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/staging.berseka.id/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/staging.berseka.id/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = staging.berseka.id) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name staging.berseka.id;
    return 404; # managed by Certbot
}
`;

const b64 = Buffer.from(nginxConfig).toString('base64');
const cmd = `echo ${b64} | base64 -d | sudo tee /etc/nginx/sites-available/staging.berseka.id > /dev/null && sudo nginx -t && sudo systemctl reload nginx`;
const out = execSync(`node scripts/tools/exec_ssh_staging.cjs "${cmd}"`, { encoding: 'utf8' });
console.log(out);
