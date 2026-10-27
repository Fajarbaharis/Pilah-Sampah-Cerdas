const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function cleanFrame() {
  const framePath = path.resolve(__dirname, '../../apps/web/public/image/serti/certificate_frame_hires.png');
  const cleanPath = path.resolve(__dirname, '../../apps/web/public/image/serti/certificate_frame_clean.png');

  // Dimensions of hires frame: 2970 x 2100
  // Logo is top left: x: 160..540, y: 140..520
  // Top-right corner polygon begins around x=2200, y=0..700
  // Bottom-left corner polygon begins around x=0..700, y=1400..2100
  // Inner white canvas should be 100% spotless pure white #FFFFFF
  
  const wipeSvg = Buffer.from(`
    <svg width="2970" height="2100">
      <!-- Wipe center from x: 550 to 2400, y: 120 to 1950 -->
      <rect x="550" y="120" width="1850" height="1830" fill="#ffffff" />

      <!-- Wipe right margin between corner and bottom: x: 2350 to 2800, y: 480 to 1800 -->
      <rect x="2350" y="480" width="450" height="1320" fill="#ffffff" />

      <!-- Wipe left margin below logo: x: 150 to 550, y: 530 to 1450 -->
      <rect x="150" y="530" width="400" height="920" fill="#ffffff" />

      <!-- Wipe bottom margin between corners: x: 700 to 2350, y: 1800 to 1980 -->
      <rect x="700" y="1800" width="1650" height="180" fill="#ffffff" />
    </svg>
  `);

  await sharp(framePath)
    .composite([{ input: wipeSvg, blend: 'over' }])
    .png()
    .toFile(framePath + '.tmp');

  fs.renameSync(framePath + '.tmp', framePath);
  console.log('Cleaned certificate_frame_hires.png successfully!');

  // Also update certificate_frame_clean.png
  await sharp(framePath)
    .resize(1491, 1055, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100 })
    .toFile(cleanPath);
  console.log('Saved certificate_frame_clean.png!');
}

cleanFrame().catch(console.error);
