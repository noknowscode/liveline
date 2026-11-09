// The Liveline capture driver (adapted from PAC's src/tools/drive.js): one browser session kept open on the Release
// WebAssembly build, driven step by step over a local control port, so every capture of a session comes from one running
// chart (one feed, one clock) whatever the theme or the moment.
//
//   node drive.js <url> <outdir> <WxH> <dpr> <scheme> <controlPort> [entropySeed]
//   curl -s localhost:<controlPort> -d '[{"pause":true},{"shot":"name","clip":{...}}]'
//
// The page clock is Playwright's (page.clock): it runs with real time while the app starts and the feed warms up; once
// paused, the app moves only when told to, one 16 ms animation frame and the 150 ms feed ticks at a time. That is how
// the chart is held on one frame for a Light and a Dark capture of the same data, and how the easing is stepped through
// frame by frame. Paused or stepped, every frame is the app's own: the control renders it, nothing is drawn over it.
// With [entropySeed], crypto.getRandomValues is a seeded generator, so the app's unseeded Random() walks the same way in
// every build of a theming composition (the walk is still the app's code; only the dice are fixed).
//
// Steps (run in order; every step is appended to <outdir>/steps.jsonl, the record of the session):
//   {boot:true[,step,n,gap]} with START_PAUSED=1: the start-up protocol, the same in every session
//   {wait:ms}                real wait (the clock runs unless paused)
//   {pause:true}             stop the page clock where it is      {resume:true}   let it run with real time again
//   {run:ms}                 advance the paused clock by ms in one go (fires the feed ticks; frames may be skipped)
//   {frames:N}               advance the paused clock N animation frames of 16 ms, each one rendered before the next
//                            (what a 60 Hz display gives the chart, however slow this machine is)
//   {scheme:"light"|"dark"}  prefers-color-scheme (the app follows it); a paused clock needs a {run:16} to repaint
//   {viewport:[w,h]}         resize the window (same app instance)
//   {dpr:N}                  change the device pixel ratio live (CDP), for a macro capture after cheap stepping
//   {move:[x,y]}             park the pointer
//   {shot:"name", clip:{x,y,width,height}}   screenshot at the context's device pixel ratio
//   {dshot:"name", clip:{...}}  the same from CDP in device pixels, after a {dpr} change
//   {seq:"name", n:N, everyFrames:F, clip:{...}}  N shots, F frames apart: name-000.png ...
//   {peek:"name"}            a CSS-scale look at the whole page, for steering (not a deliverable)
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');

(async () => {
  const [url, out, size, dpr, scheme, port, seed] = process.argv.slice(2);
  const [w, h] = size.split('x').map(Number);
  fs.mkdirSync(out, { recursive: true });
  const log = fs.createWriteStream(`${out}/steps.jsonl`, { flags: 'a' });
  const b = await chromium.launch({ args: ['--hide-scrollbars', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: Number(dpr), colorScheme: scheme });
  const p = await ctx.newPage();
  if (seed) {
    await p.addInitScript(s => {
      let a = s >>> 0;
      const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0); };
      const fill = arr => { const u8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength); for (let i = 0; i < u8.length; i++) u8[i] = next() & 255; return arr; };
      crypto.getRandomValues = fill;
      Math.random = () => next() / 4294967296;
    }, Number(seed));
  }
  await p.clock.install({ time: new Date('2026-11-09T10:41:00Z') });
  if (process.env.START_PAUSED) await p.clock.pauseAt(new Date('2026-11-09T10:41:00.500Z'));
  const errors = [];
  p.on('pageerror', e => errors.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const t0 = Date.now();
  await p.goto(url, { waitUntil: 'load', timeout: 300000 });
  log.write(JSON.stringify({ open: url, size, dpr: Number(dpr), scheme, seed: seed || null, at: new Date().toISOString() }) + '\n');
  console.log('loaded after', Math.round((Date.now() - t0) / 1000), 's');
  // Count the app's animation-frame requests, so a frame step can wait until the app has finished the frame it was
  // given (it asks for the next one at the end) instead of racing ahead of it.
  await p.evaluate(() => { const raf = window.requestAnimationFrame.bind(window); window.__rafReq = 0;
    window.requestAnimationFrame = cb => { window.__rafReq++; return raf(cb); }; });
  async function frame() {
    const before = await p.evaluate(() => window.__rafReq);
    await p.clock.runFor(16);
    const t = Date.now();
    while (Date.now() - t < 3000 && await p.evaluate(b => window.__rafReq === b, before)) await p.waitForTimeout(10);
  }
  await p.mouse.move(w - 2, 2);

  const shot = (path, clip) => p.screenshot({ path, clip, animations: 'disabled', timeout: 240000 });
  async function run(steps) {
    const res = [];
    for (const s of steps) {
      log.write(JSON.stringify({ ...s, at: new Date().toISOString() }) + '\n');
      if (s.viewport) await p.setViewportSize({ width: s.viewport[0], height: s.viewport[1] });
      if (s.dpr) {
        // Raise the device pixel ratio live (CDP); the app re-renders its canvas at the new ratio on the next frames.
        const cdp = await ctx.newCDPSession(p); const vp = p.viewportSize();
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: s.dpr, mobile: false });
        res.push('dpr ' + await p.evaluate(() => window.devicePixelRatio));
      }
      if (s.scheme) await p.emulateMedia({ colorScheme: s.scheme });
      if (s.boot) {
        // Start-up under a paused clock (START_PAUSED): let the files arrive, then give the runtime its timers in small
        // clock steps (default 6 x 100 ms; {boot:true, step:20, n:30} for finer steps), always 600 ms of page time in
        // all, so every session's feed starts at the same moment and frame numbers mean the same thing.
        const step = s.step || 100, n = s.n || 6, gap = s.gap || 3000;
        await p.waitForTimeout(25000);
        for (let i = 0; i < n; i++) { await p.clock.runFor(step); await p.waitForTimeout(gap); }
        res.push('booted, frame requests ' + await p.evaluate(() => window.__rafReq));
      }
      if (s.eval) res.push('eval ' + JSON.stringify(await p.evaluate(s.eval)));
      if (s.pause) {
        // The page's clock can run ahead of what Date.now() last returned; pause a little later than now.
        let at = await p.evaluate(() => Date.now()), done = false;
        for (const m of [1000, 5000, 20000, 60000]) { try { await p.clock.pauseAt(at + m); at += m; done = true; break; } catch { } }
        res.push(done ? 'paused at ' + new Date(at).toISOString() : 'pause failed');
      }
      if (s.resume) await p.clock.resume();
      if (s.run) await p.clock.runFor(s.run);
      if (s.frames) { const t = Date.now(); for (let i = 0; i < s.frames; i++) await frame(); res.push(`frames ${s.frames} ${Date.now() - t}ms`); }
      if (s.move) await p.mouse.move(...s.move);
      if (s.wait) await p.waitForTimeout(s.wait);
      if (s.peek) await p.screenshot({ path: `${out}/${s.peek}.png`, scale: 'css', timeout: 240000 });
      if (s.dshot) {
        // A device-pixel screenshot straight from CDP, for a ratio raised with {dpr} (Playwright's own shot keeps the
        // context's ratio). The clip is in CSS px; the file holds clip x ratio device pixels.
        const cdp = await ctx.newCDPSession(p); const c = s.clip;
        const r = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: c.x, y: c.y, width: c.width, height: c.height, scale: s.scale || 1 } });
        fs.writeFileSync(`${out}/${s.dshot}.png`, Buffer.from(r.data, 'base64')); await cdp.detach(); res.push(`dshot ${s.dshot}`);
      }
      if (s.shot) { const t = Date.now(); await shot(`${out}/${s.shot}.png`, s.clip); res.push(`shot ${s.shot} ${Date.now() - t}ms`); }
      if (s.seq) {
        for (let i = 0; i < s.n; i++) {
          if (s.every) await p.clock.runFor(s.every);
          if (s.everyFrames) for (let k = 0; k < s.everyFrames; k++) await frame();
          await shot(`${out}/${s.seq}-${String(i).padStart(3, '0')}.png`, s.clip);
        }
        res.push(`seq ${s.seq} x${s.n}`);
      }
    }
    if (errors.length) { res.push('errors: ' + errors.slice(0, 3).join(' | ')); errors.length = 0; }
    return res;
  }

  http.createServer((req, resp) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        if (body.trim() === 'quit') { resp.end('bye\n'); await b.close(); process.exit(0); }
        const r = await run(JSON.parse(body));
        resp.end(r.join('\n') + '\nok\n');
      } catch (e) { resp.statusCode = 500; resp.end(String(e) + '\n'); }
    });
  }).listen(Number(port), '127.0.0.1', () => console.log('control on', port));
})();
