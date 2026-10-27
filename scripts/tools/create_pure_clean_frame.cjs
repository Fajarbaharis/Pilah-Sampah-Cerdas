const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createCleanFrame() {
  const src = 'C:/Users/USER/.gemini/antigravity/brain/274d822e-f0ea-41dc-8272-598b0b0f8fe7/.user_uploaded/media_1793072374647_6994ae33.png';
  if (!fs.existsSync(src)) {
    console.error('Source not found:', src);
    return;
  }
  const img = sharp(src);
  const meta = await img.metadata();
  
  // Wipe out 100% of the text inside the frame
  // Logo is at x: 66..185, y: 35..170
  // Top-right corner polygon starts at x > 870 at y < 150, x > 800 at y=230
  // Bottom-left corner polygon is x < 180, y > 520
  
  const whiteRects = `
    <svg width="${meta.width}" height="${meta.height}">
      <!-- Wipe main center area from x: 195 to 870, y: 25 to 665 -->
      <rect x="195" y="25" width="675" height="645" fill="#ffffff" />
      
      <!-- Wipe below logo on left: x: 35 to 195, y: 175 to 515 -->
      <rect x="35" y="172" width="165" height="345" fill="#ffffff" />
      
      <!-- Wipe bottom-right area (signature text): x: 600 to 920, y: 650 to 705 -->
      <rect x="600" y="650" width="320" height="55" fill="#ffffff" />

      <!-- Wipe bottom footer text between corners: x: 180 to 860, y: 670 to 715 -->
      <rect x="180" y="670" width="680" height="45" fill="#ffffff" />

      <!-- Wipe any stray text in right margin: x: 860 to 925, y: 550 to 670 -->
      <rect x="860" y="550" width="65" height="120" fill="#ffffff" />
    </svg>
  `;

  const outBuf = await sharp(src)
    .composite([{ input: Buffer.from(whiteRects), blend: 'over' }])
    .png()
    .toBuffer();

  const outPath = 'C:/Users/USER/.gemini/antigravity/brain/274d822e-f0ea-41dc-8272-598b0b0f8fe7/test_blank_frame.png';
  await sharp(outBuf).toFile(outPath);
  console.log('Successfully created test_blank_frame.png at', outPath);

  const publicDest = path.resolve(__dirname, '../../apps/web/public/image/serti/certificate_frame_clean.png');
  await sharp(outBuf).toFile(publicDest);
  console.log('Successfully saved to', publicDest);

  const hiresDest = path.resolve(__dirname, '../../apps/web/public/image/serti/certificate_frame_hires.png');
  await sharp(outBuf)
    .resize(2970, 2100, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100 })
    .toFile(hiresDest);
  console.log('Successfully saved hi-res to', hiresDest);
}

createCleanFrame().catch(console.error);
