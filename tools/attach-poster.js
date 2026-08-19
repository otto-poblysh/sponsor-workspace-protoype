#!/usr/bin/env node
'use strict';

/**
 * tools/attach-poster.js <projectDir> [--at <seconds>]
 *
 * Gives a rendered tutorial video the scene-00 intro cover as its thumbnail.
 *
 * Why this is needed: the intro timeline starts fully hidden (autoAlpha 0, the
 * dark panel off-screen), so frame 0 of the mp4 is a blank white field. Players
 * and Finder skip past it looking for a "interesting" frame and land in the
 * scene-01 dashboard screencast. Pinning an explicit cover fixes that.
 *
 * It writes two things next to the mp4:
 *   1. <name>.poster.jpg   — standalone still, for <video poster>, decks, docs
 *   2. cover art inside the mp4 itself (an attached_pic stream), which QuickTime,
 *      Finder and VLC use as the file's thumbnail
 *
 * Default --at 3.0s: the intro content lands by ~1.98s and starts fading at 4.2s,
 * so 3.0s sits in the middle of the settled window.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const DEFAULT_AT = 3.0;

function newestRender(rendersDir) {
  if (!fs.existsSync(rendersDir)) return null;
  const mp4s = fs.readdirSync(rendersDir)
    .filter((f) => f.endsWith('.mp4'))
    .map((f) => ({ f, m: fs.statSync(path.join(rendersDir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return mp4s.length ? path.join(rendersDir, mp4s[0].f) : null;
}

function attachPoster(projectDir, at = DEFAULT_AT) {
  const rendersDir = path.join(projectDir, 'renders');
  const mp4 = newestRender(rendersDir);
  if (!mp4) throw new Error(`No .mp4 found in ${rendersDir} — render the project first.`);

  const poster = mp4.replace(/\.mp4$/, '.poster.jpg');
  const tmp = mp4.replace(/\.mp4$/, '.withcover.tmp.mp4');

  // 1. Pull the still out of the delivered file, so the poster is guaranteed to
  //    be a real frame of the video the viewer receives.
  execFileSync('ffmpeg', [
    '-y', '-ss', String(at), '-i', mp4,
    '-frames:v', '1', '-q:v', '2', poster
  ], { stdio: 'pipe' });

  // 2. Embed the same still as cover art.
  execFileSync('ffmpeg', [
    '-y', '-i', mp4, '-i', poster,
    '-map', '0', '-map', '1',
    '-c', 'copy', '-c:v:1', 'mjpeg',
    '-disposition:v:1', 'attached_pic',
    tmp
  ], { stdio: 'pipe' });

  fs.renameSync(tmp, mp4);
  return { mp4, poster, at };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith('--'));
  const atFlag = args.indexOf('--at');
  const at = atFlag !== -1 ? Number(args[atFlag + 1]) : DEFAULT_AT;

  if (!dir) {
    console.error('Usage: node tools/attach-poster.js <projectDir> [--at <seconds>]');
    process.exit(1);
  }
  if (!Number.isFinite(at) || at < 0) {
    console.error(`--at must be a non-negative number, got ${args[atFlag + 1]}`);
    process.exit(1);
  }

  const r = attachPoster(path.resolve(dir), at);
  console.log(`✓ ${path.basename(r.mp4)}`);
  console.log(`    poster @ ${r.at}s -> ${path.basename(r.poster)}`);
  console.log(`    cover art embedded`);
}

module.exports = { attachPoster, newestRender, DEFAULT_AT };
