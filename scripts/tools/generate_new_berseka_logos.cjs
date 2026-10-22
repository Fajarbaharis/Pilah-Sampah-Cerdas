const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_JPEG = 'C:/Users/USER/.gemini/antigravity-ide/scratch/pilahsampah-id/apps/web/public/image/BERSEKALOGONEW.jpeg';
const MAIN_DIR = path.resolve(__dirname, '../../');
const WEB_PUBLIC = path.join(MAIN_DIR, 'apps/web/public');
const WEB_IMAGE = path.join(WEB_PUBLIC, 'image');
const WEB_LOGOS_BERSEKA = path.join(WEB_PUBLIC, 'logos/berseka');
const TEXT_SRC = path.join(WEB_LOGOS_BERSEKA, 'berseka-text-bg-transparent.png');

async function run() {
  console.log('=== Generasi Aset Logo Baru BERSEKA ===');
  console.log('Source:', SOURCE_JPEG);
  
  if (!fs.existsSync(SOURCE_JPEG)) {
    throw new Error('Source JPEG not found: ' + SOURCE_JPEG);
  }

  // 1. Copy source JPEG directly to apps/web/public/image/BERSEKALOGONEW.jpeg
  fs.mkdirSync(WEB_IMAGE, { recursive: true });
  fs.mkdirSync(WEB_LOGOS_BERSEKA, { recursive: true });
  fs.copyFileSync(SOURCE_JPEG, path.join(WEB_IMAGE, 'BERSEKALOGONEW.jpeg'));
  console.log('✓ Disalin ke', path.join(WEB_IMAGE, 'BERSEKALOGONEW.jpeg'));

  // 2. Crop circle emblem with transparent background outside circle
  const centerX = 627;
  const centerY = 634;
  const radius = 541;
  const size = 1100;
  const left = Math.round(centerX - size / 2);
  const top = Math.round(centerY - size / 2);

  const svgMask = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="#fff" /></svg>`;

  const emblemTransparentBuffer = await sharp(SOURCE_JPEG)
    .extract({ left, top, width: size, height: size })
    .composite([{ input: Buffer.from(svgMask), blend: 'dest-in' }])
    .png()
    .toBuffer();

  const emblemWhiteBuffer = await sharp(SOURCE_JPEG)
    .extract({ left, top, width: size, height: size })
    .png()
    .toBuffer();

  console.log('✓ Emblem lingkaran transparan & white terisolasi');

  // 3. Compose Full Logo (Emblem + Teks BERSEKA.ID)
  let fullLogoTransparentBuffer;
  let fullLogoWhiteBuffer;
  if (fs.existsSync(TEXT_SRC)) {
    const emblemHeight = 450;
    const resizedEmblem = await sharp(emblemTransparentBuffer)
      .resize({ height: emblemHeight })
      .toBuffer();
    const emblemMeta = await sharp(resizedEmblem).metadata();

    const textHeight = 220;
    const resizedText = await sharp(TEXT_SRC)
      .resize({ height: textHeight })
      .toBuffer();
    const textMeta = await sharp(resizedText).metadata();

    const gap = 80;
    const totalWidth = emblemMeta.width + gap + textMeta.width + 60;
    const totalHeight = Math.max(emblemMeta.height, textMeta.height) + 60;

    const emblemTop = Math.round((totalHeight - emblemMeta.height) / 2);
    const textTop = Math.round((totalHeight - textMeta.height) / 2);

    fullLogoTransparentBuffer = await sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([
      { input: resizedEmblem, left: 30, top: emblemTop },
      { input: resizedText, left: 30 + emblemMeta.width + gap, top: textTop }
    ])
    .png()
    .toBuffer();

    fullLogoWhiteBuffer = await sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      { input: resizedEmblem, left: 30, top: emblemTop },
      { input: resizedText, left: 30 + emblemMeta.width + gap, top: textTop }
    ])
    .png()
    .toBuffer();

    console.log('✓ Full Logo (Emblem + BERSEKA.ID) berhasil dikomposisikan');
  } else {
    fullLogoTransparentBuffer = emblemTransparentBuffer;
    fullLogoWhiteBuffer = emblemWhiteBuffer;
  }

  // 4. Helper write function
  async function writeAsset(filePath, buffer, options = {}) {
    await sharp(buffer)
      .resize(options.width, options.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(filePath);
  }

  async function writeWebp(filePath, buffer, options = {}) {
    await sharp(buffer)
      .resize(options.width, options.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90 })
      .toFile(filePath);
  }

  // --- PUBLIC/IMAGE ---
  console.log('Menulis aset ke apps/web/public/image...');
  await writeAsset(path.join(WEB_IMAGE, 'berseka-icon.png'), emblemTransparentBuffer, { width: 512, height: 512 });
  await writeWebp(path.join(WEB_IMAGE, 'berseka-icon.webp'), emblemTransparentBuffer, { width: 512, height: 512 });
  await writeAsset(path.join(WEB_IMAGE, 'berseka_icon.png'), emblemTransparentBuffer, { width: 512, height: 512 });
  await writeWebp(path.join(WEB_IMAGE, 'berseka_icon.webp'), emblemTransparentBuffer, { width: 512, height: 512 });
  await writeAsset(path.join(WEB_IMAGE, 'berseka-logo.png'), fullLogoTransparentBuffer);
  await writeWebp(path.join(WEB_IMAGE, 'berseka-logo.webp'), fullLogoTransparentBuffer);
  await writeAsset(path.join(WEB_IMAGE, 'berseka-logo-full.png'), fullLogoTransparentBuffer);
  await writeWebp(path.join(WEB_IMAGE, 'berseka-logo-full.webp'), fullLogoTransparentBuffer);

  // --- PUBLIC/LOGOS/BERSEKA ---
  console.log('Menulis aset ke apps/web/public/logos/berseka...');
  await writeAsset(path.join(WEB_LOGOS_BERSEKA, 'berseka-logo-bg-transparent.png'), emblemTransparentBuffer, { width: 512, height: 512 });
  await writeAsset(path.join(WEB_LOGOS_BERSEKA, 'berseka-logo-bg-white.png'), emblemWhiteBuffer, { width: 512, height: 512 });
  await writeAsset(path.join(WEB_LOGOS_BERSEKA, 'berserka-logo-mobile-icon.png'), emblemTransparentBuffer, { width: 512, height: 512 });
  await writeAsset(path.join(WEB_LOGOS_BERSEKA, 'berseka-logo-full.png'), fullLogoTransparentBuffer);
  await writeWebp(path.join(WEB_LOGOS_BERSEKA, 'berseka-logo-full.webp'), fullLogoTransparentBuffer);
  await writeAsset(path.join(WEB_LOGOS_BERSEKA, 'berseka-logo-text-bg-transparent.png'), fullLogoTransparentBuffer);
  await writeAsset(path.join(WEB_LOGOS_BERSEKA, 'berseka-logo-text-bg-white.png'), fullLogoWhiteBuffer);

  // --- PUBLIC ROOT ---
  console.log('Menulis aset ke apps/web/public...');
  await writeAsset(path.join(WEB_PUBLIC, 'app-icon.png'), emblemTransparentBuffer, { width: 512, height: 512 });
  await writeWebp(path.join(WEB_PUBLIC, 'app-icon.webp'), emblemTransparentBuffer, { width: 512, height: 512 });
  await writeAsset(path.join(WEB_PUBLIC, 'app-logo.png'), fullLogoTransparentBuffer);
  await writeWebp(path.join(WEB_PUBLIC, 'app-logo.webp'), fullLogoTransparentBuffer);
  await writeAsset(path.join(WEB_PUBLIC, 'logo.png'), fullLogoTransparentBuffer);
  await writeWebp(path.join(WEB_PUBLIC, 'logo.webp'), fullLogoTransparentBuffer);
  await writeAsset(path.join(WEB_PUBLIC, 'favicon.png'), emblemTransparentBuffer, { width: 64, height: 64 });
  await writeWebp(path.join(WEB_PUBLIC, 'favicon.webp'), emblemTransparentBuffer, { width: 64, height: 64 });
  await sharp(emblemTransparentBuffer).resize(64, 64).toFile(path.join(WEB_PUBLIC, 'favicon.ico'));

  // Favicon SVG with clean embedded PNG data URI
  const faviconPng64 = await sharp(emblemTransparentBuffer).resize(128, 128).png().toBuffer();
  const base64Data = faviconPng64.toString('base64');
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <image href="data:image/png;base64,${base64Data}" width="128" height="128"/>
</svg>`;
  fs.writeFileSync(path.join(WEB_PUBLIC, 'favicon.svg'), faviconSvg, 'utf8');

  // Also update SVG in logos/berseka
  const fullSvgData = fullLogoTransparentBuffer.toString('base64');
  const fullMeta = await sharp(fullLogoTransparentBuffer).metadata();
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${fullMeta.width}" height="${fullMeta.height}" viewBox="0 0 ${fullMeta.width} ${fullMeta.height}">
  <image href="data:image/png;base64,${fullSvgData}" width="${fullMeta.width}" height="${fullMeta.height}"/>
</svg>`;
  fs.writeFileSync(path.join(WEB_LOGOS_BERSEKA, 'berseka-logo-full.svg'), fullSvg, 'utf8');

  // --- MOBILE ASSETS (if directory exists) ---
  const MOBILE_LOGO_DIR = path.resolve(MAIN_DIR, '../mobile/assets/logo');
  if (fs.existsSync(MOBILE_LOGO_DIR)) {
    console.log('Menulis aset ke mobile/assets/logo...');
    await writeAsset(path.join(MOBILE_LOGO_DIR, 'BersekaNew-logo-bg-transparent.png'), emblemTransparentBuffer, { width: 2400, height: 2400 });
    await writeAsset(path.join(MOBILE_LOGO_DIR, 'BersekaNew-logo-bg-white.png'), emblemWhiteBuffer, { width: 2400, height: 2400 });
    await writeAsset(path.join(MOBILE_LOGO_DIR, 'BersekaNew-logo-icon-android12.png'), emblemTransparentBuffer, { width: 2400, height: 2400 });
    await writeAsset(path.join(MOBILE_LOGO_DIR, 'BersekaNew-logo-icon-splash.png'), emblemTransparentBuffer, { width: 600, height: 600 });
    await writeAsset(path.join(MOBILE_LOGO_DIR, 'BersekaNew-logo-text-android12.png'), fullLogoTransparentBuffer, { width: 2400, height: 2400 });
    await writeAsset(path.join(MOBILE_LOGO_DIR, 'BersekaNew-logo-text-bg-transparent.png'), fullLogoTransparentBuffer);
    await writeAsset(path.join(MOBILE_LOGO_DIR, 'BersekaNew-logo-text-bg-white.png'), fullLogoWhiteBuffer);
    console.log('✓ Aset logo mobile berhasil diperbarui!');
  }

  console.log('✓ Seluruh aset logo BERSEKA berhasil diperbarui!');
}

run().catch((err) => {
  console.error('Error generating logos:', err);
  process.exit(1);
});
