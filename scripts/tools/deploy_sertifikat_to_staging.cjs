const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SSH_SCRIPT = path.join(__dirname, 'exec_ssh_staging.cjs');

function runRemote(cmd) {
  console.log(`[VPS EXEC] ${cmd}`);
  const out = execSync(`node "${SSH_SCRIPT}" "${cmd.replace(/"/g, '\\"')}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  console.log(out);
  return out;
}

async function main() {
  try {
    console.log('=== 1. Pull Latest Staging on VPS ===');
    runRemote('cd /home/maker/Pilah-Sampah-Cerdas-staging && git checkout . && git fetch origin staging && git pull origin staging');

    console.log('=== 2. Build Backend API and Restart PM2 ===');
    runRemote('cd /home/maker/Pilah-Sampah-Cerdas-staging/apps/api && npm run build && pm2 restart psc-backend-staging');

    console.log('=== 3. Build Web Frontend on VPS ===');
    runRemote('cd /home/maker/Pilah-Sampah-Cerdas-staging/apps/web && VITE_API_BASE_URL=/api/v1 npm run build');

    console.log('=== 4. Sync dist to /var/www/staging-web/dist/ ===');
    runRemote('sudo cp -r /home/maker/Pilah-Sampah-Cerdas-staging/apps/web/dist/* /var/www/staging-web/dist/');
    runRemote('sudo chown -R www-data:www-data /var/www/staging-web/dist');

    console.log('=== 5. Ensure Template Images & Certificates Directory ===');
    runRemote('sudo mkdir -p /var/www/staging-web/dist/image/serti /var/www/staging-web/dist/certificates');
    runRemote('sudo cp -r /home/maker/Pilah-Sampah-Cerdas-staging/apps/web/public/image/serti/* /var/www/staging-web/dist/image/serti/');
    runRemote('sudo cp -r /home/maker/Pilah-Sampah-Cerdas-staging/apps/web/public/certificates/* /var/www/staging-web/dist/certificates/');
    runRemote('sudo chown -R www-data:www-data /var/www/staging-web/dist/image/serti /var/www/staging-web/dist/certificates');

    console.log('=== 6. Test Backend API and Verify Staging ===');
    runRemote('curl -s http://127.0.0.1:3000/api/v1/sertifikat-kkn/verify/21224142 | head -c 200');
    console.log('');
    runRemote('curl -I http://127.0.0.1:80');

    console.log('🎉 Staging Deployment Complete!');
  } catch (err) {
    console.error('Deployment error:', err);
    process.exit(1);
  }
}

main();
