// รันอัตโนมัติก่อน firebase deploy (predeploy ใน firebase.json) — เปลี่ยน CACHE_NAME ใน service-worker.js ให้ผู้ใช้ได้โค้ดใหม่
const fs = require('fs');
const path = require('path');
const publicDir = path.resolve(__dirname, '../public'); // scripts/ อยู่ระดับ root ข้างๆ public/ (ห้ามอยู่ใน public/ ไม่งั้นจะถูก deploy ขึ้นเว็บ)
const file = path.join(publicDir, 'service-worker.js');
const v = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

try {
    const src = fs.readFileSync(file, 'utf8');
    const re = /const CACHE_NAME = ['"]([^'"]+)['"]/;
    if (!re.test(src)) { throw new Error('CACHE_NAME not found in service-worker.js'); }
    const nextSrc = src.replace(re, `const CACHE_NAME = 'pomodoro-${v}'`);
    fs.writeFileSync(file, nextSrc, 'utf8');
    console.log('[dump-cache] cache ->', v);
} catch (err) {
    console.error('[dump-cache] Error:', err.message);
    process.exit(1);
}   