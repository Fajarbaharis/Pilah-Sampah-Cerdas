const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function cleanTemplates() {
  const p1Path = path.resolve(__dirname, '../../apps/web/public/image/serti/template_halaman_1_clean.png');
  const p2Path = path.resolve(__dirname, '../../apps/web/public/image/serti/template_halaman_2_clean.png');

  // Page 1: clean PRATINJAU DESAIN at bottom center (x: 600..900, y: 1015..1040)
  const wipeP1 = Buffer.from(`
    <svg width="1491" height="1055">
      <rect x="600" y="1018" width="291" height="22" fill="#ffffff" />
    </svg>
  `);
  await sharp(p1Path)
    .composite([{ input: wipeP1, blend: 'over' }])
    .png()
    .toFile(p1Path + '.tmp');

  // Page 2: clean stray ']' at x: 1010..1035, y: 395..425 and x: 1330..1355, y: 395..425
  // and clean footer line (ID SERTIFIKAT & Halaman 2 dari 2) at y: 990..1040, x: 500..1000
  const wipeP2 = Buffer.from(`
    <svg width="1491" height="1055">
      <rect x="1010" y="395" width="40" height="35" fill="#ffffff" />
      <rect x="1330" y="395" width="40" height="35" fill="#ffffff" />
      <rect x="500" y="990" width="500" height="50" fill="#ffffff" />
    </svg>
  `);
  await sharp(p2Path)
    .composite([{ input: wipeP2, blend: 'over' }])
    .png()
    .toFile(p2Path + '.tmp');

  fs.renameSync(p1Path + '.tmp', p1Path);
  fs.renameSync(p2Path + '.tmp', p2Path);
  console.log('Cleaned templates successfully!');
}

cleanTemplates().catch(console.error);
