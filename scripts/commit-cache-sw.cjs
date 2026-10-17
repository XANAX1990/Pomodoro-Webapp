// รันอัตโนมัติหลัง firebase deploy สำเร็จ (postdeploy ใน firebase.json)
// commit เฉพาะ public/service-worker.js ที่ถูก bump CACHE_NAME เท่านั้น (ไม่แตะไฟล์อื่นที่ค้างอยู่) และไม่ push
const { execFileSync } = require('child_process');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = 'public/service-worker.js';
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

try {
  if (!git('status', '--porcelain', '--', file).trim()) {
    console.log('[commit-cache] service-worker.js ไม่มีการเปลี่ยนแปลง ข้าม commit');
    process.exit(0);
  }
  const name = (git('show', `:${file}`).match(/const CACHE_NAME = ['"]([^'"]+)['"]/) || [])[1];
  const current = require('fs').readFileSync(path.join(root, file), 'utf8').match(/const CACHE_NAME = ['"]([^'"]+)['"]/)?.[1] || name;
  git('add', '--', file);
  git('commit', '-m', `chore: bump service worker cache (${current})`, '--', file);
  console.log('[commit-cache] committed ->', current);
} catch (err) {
  // deploy สำเร็จไปแล้ว ไม่ให้ commit พังทำให้ดูเหมือน deploy ล้มเหลว
  console.warn('[commit-cache] commit ไม่สำเร็จ (ข้าม):', err.message);
}
