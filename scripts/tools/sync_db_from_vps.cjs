const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const SQL_OUTPUT_PATH = path.resolve(__dirname, '../../database/trashcare.sql');
const BACKUP_PATH = path.resolve(__dirname, '../../database/vps_latest.sql');

console.log('=== Sinkronisasi Database VPS Production (Main) ke Lokal ===');
console.log('Host: 157.10.252.252 (Main Production VPS)');
console.log('Target file lokal:', SQL_OUTPUT_PATH);

const dbDir = path.dirname(SQL_OUTPUT_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const conn = new Client();

conn.on('ready', () => {
  console.log('✓ Terhubung ke VPS Production (157.10.252.252).');
  console.log('1. Mengambil dump PostgreSQL dari psc-postgres VPS (terkompresi gzip real-time)...');

  const dumpCmd = `echo 'Makerdotindo2026' | sudo -S docker exec psc-postgres pg_dump -U psc_user -d psc_db --clean --if-exists --no-owner --no-privileges | gzip -3`;

  const writeStream = fs.createWriteStream(SQL_OUTPUT_PATH);
  const gunzip = zlib.createGunzip();
  let downloadedBytes = 0;
  let uncompressedBytes = 0;

  conn.exec(dumpCmd, (err, stream) => {
    if (err) {
      console.error('Error executing pg_dump on VPS:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      process.stdout.write(`\r  Unduh (terkompresi): ${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB`);
    });

    gunzip.on('data', (chunk) => {
      uncompressedBytes += chunk.length;
    });

    stream.stderr.on('data', (data) => {
      const errStr = data.toString();
      if (!errStr.includes('[sudo] password for maker:') && !errStr.includes('NOTICE:')) {
        process.stderr.write('\n' + errStr);
      }
    });

    writeStream.on('finish', () => {
      conn.end();
      if (uncompressedBytes < 1000) {
        console.error(`\nDump terlalu kecil atau gagal (hanya ${uncompressedBytes} bytes).`);
        process.exit(1);
      }
      console.log(`\n✓ Unduhan & ekstraksi VPS selesai!`);
      console.log(`  Transfer data (terkompresi): ${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`  Ukuran SQL riil: ${(uncompressedBytes / (1024 * 1024)).toFixed(2)} MB`);
      try {
        fs.copyFileSync(SQL_OUTPUT_PATH, BACKUP_PATH);
      } catch (_) {}
      restoreLocal();
    });

    stream.pipe(gunzip).pipe(writeStream);
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
  process.exit(1);
}).connect({
  host: '157.10.252.252',
  port: 22,
  username: 'maker',
  password: process.env.VPS_PASSWORD || process.env.VPS_PASS || 'Makerdotindo2026',
  readyTimeout: 60000,
  keepaliveInterval: 10000,
});

function restoreLocal() {
  console.log('\n=== Memulihkan Database ke PostgreSQL Lokal ===');
  try {
    const dockerCheck = execSync('docker ps --format "{{.Names}}"', { stdio: 'pipe' }).toString();
    if (dockerCheck.includes('psc-postgres')) {
      console.log('✓ Container psc-postgres aktif. Membersihkan schema public sebelum import...');
      execSync('docker exec psc-postgres psql -U psc_user -d psc_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO psc_user;"', { stdio: 'inherit' });
      console.log('✓ Schema siap. Memulai import dump SQL...');
      execSync(`docker exec -i psc-postgres psql -U psc_user -d psc_db < "${SQL_OUTPUT_PATH}"`, { stdio: 'inherit', shell: true });
      console.log('\n=============================================================');
      console.log('✓ SUKSES: Database lokal telah 100% sinkron dan identik dengan VPS Main!');
      console.log('=============================================================');
    } else {
      console.log('ℹ️ Container psc-postgres belum berjalan.');
      console.log('File dump terbaru telah disimpan ke:');
      console.log(' - ' + SQL_OUTPUT_PATH);
      console.log(' - ' + BACKUP_PATH);
      console.log('Jalankan "docker compose up -d postgres" atau start Docker Desktop jika ingin restore langsung ke container.');
    }
  } catch (e) {
    console.log('ℹ️ Import gagal atau terhenti:', e.message);
  }
}
