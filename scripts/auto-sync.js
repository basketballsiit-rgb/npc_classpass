/**
 * Auto-Sync Service for GitHub
 * -------------------------------------------------------------
 * Monitors local file changes in the project and automatically:
 * 1. Stages changed files (`git add -A`)
 * 2. Creates an auto-commit with timestamp and change list
 * 3. Pushes to GitHub repository (`git push origin master`)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEBOUNCE_DELAY_MS = 15000; // 15 seconds quiet window after last change
const IGNORE_PATTERNS = [
  /^[\\/]?node_modules([\\/]|$)/,
  /^[\\/]?\.next([\\/]|$)/,
  /^[\\/]?\.git([\\/]|$)/,
  /^[\\/]?\.gemini([\\/]|$)/,
  /\.log$/,
  /\.tsbuildinfo$/,
  /~$|^\.tmp/
];

let syncTimer = null;
let pendingChanges = new Set();
let isSyncing = false;

function shouldIgnore(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return IGNORE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getThaiTimestamp() {
  const d = new Date();
  return d.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
}

function performSync() {
  if (isSyncing) {
    console.log(`[Auto-Sync] Sync already in progress, queuing for next round...`);
    scheduleSync();
    return;
  }

  isSyncing = true;
  console.log(`\n========================================`);
  console.log(`[Auto-Sync] Detected changes. Starting auto-sync at ${getThaiTimestamp()}...`);

  try {
    // 1. Check git status
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
    if (!status) {
      console.log('[Auto-Sync] Working tree clean. Nothing to commit.');
      isSyncing = false;
      pendingChanges.clear();
      return;
    }

    const changedLines = status.split('\n').filter(Boolean);
    const count = changedLines.length;
    console.log(`[Auto-Sync] Found ${count} modified/new files:`);
    changedLines.slice(0, 5).forEach((line) => console.log(`   - ${line.trim()}`));
    if (count > 5) {
      console.log(`   ... and ${count - 5} more`);
    }

    // 2. Stage changes
    console.log('[Auto-Sync] Running git add -A...');
    execSync('git add -A', { cwd: ROOT_DIR, stdio: 'inherit' });

    // 3. Commit
    const commitMsg = `Auto-sync: update ${count} files [${getThaiTimestamp()}]`;
    console.log(`[Auto-Sync] Committing: "${commitMsg}"...`);
    execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT_DIR, stdio: 'inherit' });

    // 4. Push to remote
    console.log('[Auto-Sync] Pushing to GitHub (origin master)...');
    execSync('git push origin master', { cwd: ROOT_DIR, stdio: 'inherit' });

    console.log(`[Auto-Sync] ✅ Successfully synced and pushed to GitHub!`);
    pendingChanges.clear();
  } catch (err) {
    console.error(`[Auto-Sync] ❌ Error during sync:`, err.message);
  } finally {
    isSyncing = false;
    console.log(`========================================\n`);
  }
}

function scheduleSync() {
  if (syncTimer) {
    clearTimeout(syncTimer);
  }
  syncTimer = setTimeout(() => {
    performSync();
  }, DEBOUNCE_DELAY_MS);
}

// Start recursive file watch
console.log(`[Auto-Sync] Starting file watcher for: ${ROOT_DIR}`);
console.log(`[Auto-Sync] Remote repository: https://github.com/basketballsiit-rgb/npc_classpass.git`);
console.log(`[Auto-Sync] Changes will automatically push after ${DEBOUNCE_DELAY_MS / 1000}s of idle time.`);

try {
  fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (shouldIgnore(filename)) return;

    pendingChanges.add(filename);
    console.log(`[Auto-Sync] Detected file edit: ${filename} (${eventType}). Sync in ${DEBOUNCE_DELAY_MS / 1000}s...`);
    scheduleSync();
  });
} catch (err) {
  console.error('[Auto-Sync] Failed to watch recursively:', err);
}

// Keep process running
process.on('SIGINT', () => {
  console.log('\n[Auto-Sync] Stopping auto-sync service...');
  process.exit(0);
});
