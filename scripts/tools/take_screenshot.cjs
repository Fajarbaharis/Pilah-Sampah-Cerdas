const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlPath = path.resolve(__dirname, '../../docs/certificates/SERTIFIKAT_KKN_21224142_Bani_Haykal_Permana.html');
const outPng = path.resolve(__dirname, '../../docs/bani_preview_latest.png');

console.log('HTML exists:', fs.existsSync(htmlPath));
const cmd = `"${edgeExe}" --headless --disable-gpu --screenshot="${outPng}" --window-size=1200,1800 "${htmlPath}"`;
execSync(cmd, { stdio: 'inherit' });
console.log('PNG exists:', fs.existsSync(outPng), 'Size:', fs.statSync(outPng).size);
