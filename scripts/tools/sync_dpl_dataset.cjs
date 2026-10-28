const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
    SELECT 
      k.id as kelompok_id,
      k.nama as kelompok,
      k.kelurahan,
      k.cakupan_rw,
      u.id as user_id,
      u.nama as dpl_nama,
      u.nip as dpl_nip,
      u.email as dpl_email,
      u.no_telepon as dpl_phone
    FROM kelompok_kkn k
    INNER JOIN pengguna u ON k.id_dpl = u.id
    WHERE k.nama NOT LIKE '%Uji Coba%' AND k.nama NOT LIKE '%TEST%'
    ORDER BY k.nama;
  `;
  
  conn.exec(`docker exec psc-postgres-staging psql -U psc_user -d psc_db -t -A -F"|" -c "${sql.replace(/\n/g, ' ')}"`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      conn.end();
      const lines = out.trim().split('\n').filter(Boolean);
      let counter = 1;
      const dplList = lines.map(line => {
        const [kelompok_id, kelompok, kelurahan, cakupan_rw_raw, user_id, dpl_nama, dpl_nip, dpl_email, dpl_phone] = line.split('|');
        let cakupanRw = [];
        try {
          cakupanRw = JSON.parse(cakupan_rw_raw);
        } catch (e) {
          cakupanRw = [cakupan_rw_raw];
        }

        const noUrutStr = String(counter).padStart(3, '0');
        const cleanNip = (dpl_nip || '').replace(/[^0-9]/g, '') || `DPL${counter}`;
        
        let rwText = '';
        if (Array.isArray(cakupanRw) && cakupanRw.length > 0) {
          if (cakupanRw.length === 1) {
            rwText = `RW ${cakupanRw[0]}`;
          } else {
            const last = cakupanRw[cakupanRw.length - 1];
            const prev = cakupanRw.slice(0, -1).join(', ');
            rwText = `RW ${prev}, dan ${last}`;
          }
        }
        const wilayahText = `${rwText} Kelurahan ${kelurahan || 'Coblong'}, Kecamatan Coblong, Kota Bandung`;

        const record = {
          noUrut: counter,
          userId: user_id,
          kelompokId: kelompok_id,
          nama: dpl_nama,
          nip: dpl_nip || '-',
          peran: 'Dosen Pembimbing Lapangan (DPL)',
          kelompok: kelompok,
          kelurahan: kelurahan || 'Coblong',
          cakupanRw: cakupanRw,
          wilayahDampingan: wilayahText,
          nomorSertifikat: `KKNT-DPL/${noUrutStr}/UNIKOM/BATCH-1/XI/2026`,
          idSertifikat: `BRSK-2026-DPL-${cleanNip}`,
          tanggalTerbit: '06 November 2026',
          status: 'TERVERIFIKASI',
          totalMahasiswa: 0 // Will populate
        };
        counter++;
        return record;
      });

      const rootDir = path.resolve(__dirname, '../..');
      const apiPath = path.join(rootDir, 'apps/api/src/data/dpl_certificates_data.json');
      const webPath = path.join(rootDir, 'apps/web/src/data/dpl_certificates_data.json');

      fs.writeFileSync(apiPath, JSON.stringify(dplList, null, 2), 'utf8');
      fs.writeFileSync(webPath, JSON.stringify(dplList, null, 2), 'utf8');
      console.log(`✓ Berhasil mengekstrak ${dplList.length} DPL ke ${apiPath} dan ${webPath}`);
    });
  });
}).connect({ host: '157.10.160.93', port: 22, username: 'maker', password: process.env.VPS_PASSWORD || 'Makerdotindo2026' });
