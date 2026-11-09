// node render.js <html> <out.png> <W> <H> <scale> [...]: renders compositions at an exact CSS size and device scale
// (from PAC's src/tools/render.js; a failed screenshot under load is retried in a fresh page).
const { chromium } = require('playwright');
(async () => {
  const jobs = [];
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 5) jobs.push(a.slice(i, i + 5));
  const b = await chromium.launch();
  for (const [html, out, W, H, s] of jobs) {
    for (let attempt = 1; ; attempt++) {
      const ctx = await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: +s });
      try {
        const p = await ctx.newPage();
        await p.goto('file://' + require('path').resolve(html));
        await p.evaluate(() => document.fonts.ready);
        await p.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
        await p.waitForTimeout(300);
        await p.screenshot({ path: out, clip: { x: 0, y: 0, width: +W, height: +H } });
        await ctx.close();
        break;
      } catch (e) {
        await ctx.close();
        if (attempt >= 3) throw e;
        console.log('retry', out, String(e).split('\n')[0]);
      }
    }
    console.log('rendered', out);
  }
  await b.close();
})();
