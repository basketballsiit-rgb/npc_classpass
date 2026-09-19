const { spawn } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🚀 เริ่มระบบ NPC ClassPass พร้อม Auto-Sync ขึ้น GitHub อัตโนมัติ');
console.log('====================================================');

// 1. Start Auto-Sync Watcher
const syncProcess = spawn('node', [path.join(__dirname, 'auto-sync.js')], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  shell: true,
});

// 2. Start Next.js dev server
const nextProcess = spawn('npx', ['next', 'dev'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  try {
    syncProcess.kill();
    nextProcess.kill();
  } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
