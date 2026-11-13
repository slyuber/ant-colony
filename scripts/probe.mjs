// Drives the installed Chrome against the dev server and prints one JSON line.
// Usage: node scripts/probe.mjs [--seconds N] [--shot path] [--width W] [--height H] [--actions name] [--query str]
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const seconds = Number(opt('seconds', 5));
const width = Number(opt('width', 1920));
const height = Number(opt('height', 1080));
const shot = opt('shot', null);
const actions = opt('actions', '');
const query = opt('query', '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const phone = actions === 'phone';   // a 390x844 phone screen with touch, three dots per point

const browser = await chromium.launch({
  channel: 'chrome',
  headless: false,
  args: ['--window-position=0,0', ...(phone ? ['--window-size=420,940'] : [`--window-size=${width},${height}`, '--kiosk']), '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling'],
});
const errors = [];
let result = {};
try {
  const page = await browser.newPage(phone
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
    : { viewport: { width, height }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:5173/${query ? '?' + query : ''}`);
  const t0 = Date.now();
  const until = async (s) => { const left = s * 1000 - (Date.now() - t0); if (left > 0) await sleep(left); };
  const snap = async (tag) => { if (shot) await page.screenshot({ path: shot.replace(/\.png$/, `-${tag}.png`) }); };
  const samples = [];
  const sampler = setInterval(async () => {
    try { samples.push(await page.evaluate(() => window.__stats.fps)); } catch {}
  }, 1000);

  if (phone) {
    // Paint with a finger, open Settings with a tap, and report what the page made of the device.
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y })) });
    await until(6);
    await touch('touchStart', [[80, 250]]);
    for (let i = 1; i <= 12; i++) { await touch('touchMove', [[80 + i * 18, 250]]); await sleep(16); }
    await touch('touchEnd', []);
    await sleep(800);
    const m = {};
    m.touch = await page.evaluate(() => window.__stats.touch);
    m.hintOpacity = await page.evaluate(() => getComputedStyle(document.querySelector('.hint')).opacity);
    m.canvas = await page.evaluate(() => [document.getElementById('view').width, document.getElementById('view').height]);
    m.stripFits = await page.evaluate(() => { const r = document.querySelector('.strip').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; });
    await snap('painted');
    await page.getByRole('button', { name: 'Settings' }).tap();
    await sleep(300);
    m.panelFits = await page.evaluate(() => { const r = document.getElementById('panel').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; });
    await page.getByRole('button', { name: 'Fight' }).tap();
    await snap('panel');
    await page.getByRole('button', { name: 'Settings' }).tap();
    result.phone = m;
  } else if (actions === 'wall') {
    await until(30);
    await snap('before-wall');
    await page.keyboard.press('2');
    const x = Number(opt('wallx', Math.round(width * 0.5 + 150)));
    await page.mouse.move(x, height * 0.5 - 220);
    await page.mouse.down();
    await page.mouse.move(x, height * 0.5 + 220, { steps: 40 });
    await page.mouse.up();
  } else if (actions === 'food') {
    // Late food, far from the nest: does a settled colony still find it?
    await until(Number(opt('at', 60)));
    await page.keyboard.press('1');
    for (const [x, y] of [[width * 0.16, height * 0.22], [width * 0.84, height * 0.8]]) {
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 60, y, { steps: 10 }); await page.mouse.up();
    }
    await sleep(1500);
    result.hintOpacity = await page.evaluate(() => getComputedStyle(document.querySelector('.hint')).opacity);
  } else if (actions === 'ui') {
    // Walk every control once, the way a person would, and record what the page shows.
    const cx = width / 2, cy = height / 2;
    const ui = {};
    const drag = async (x0, y0, x1, y1) => {
      await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.move(x1, y1, { steps: 20 }); await page.mouse.up();
    };
    await until(4);
    ui.hintBefore = await page.evaluate(() => !document.querySelector('.hint').classList.contains('gone'));
    await page.getByRole('button', { name: /Food/ }).click();
    await drag(cx - 500, cy - 300, cx - 350, cy - 300);            // food bar, top left
    ui.hintAfter = await page.evaluate(() => !document.querySelector('.hint').classList.contains('gone'));
    await page.getByRole('button', { name: /Wall/ }).click();
    await drag(cx + 300, cy - 350, cx + 600, cy - 350);            // wall bar, top right
    await page.getByRole('button', { name: /Erase/ }).click();
    await drag(cx + 450, cy - 420, cx + 450, cy - 280);            // cut the wall in half
    await page.mouse.move(cx, cy + 200);
    await page.mouse.wheel(0, -300);
    ui.brushAfterWheel = await page.evaluate(() => document.querySelector('.ring').style.width);
    await snap('painted');
    await page.keyboard.press('4');
    ui.scatterPressed = await page.getByRole('button', { name: /Scatter/ }).getAttribute('aria-pressed');
    await page.mouse.move(cx + 120, cy + 10); await page.mouse.down(); await sleep(1500); await page.mouse.up();
    await snap('scatter');
    const f0 = await page.evaluate(() => window.__stats.frames);
    await page.keyboard.press('Space');
    ui.pauseLabel = await page.getByRole('button', { name: /Resume|Pause/ }).first().innerText();
    await snap('paused-a'); await sleep(1000); await snap('paused-b');
    ui.framesWhilePaused = (await page.evaluate(() => window.__stats.frames)) - f0;
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Settings' }).click();
    ui.panelOpen = await page.evaluate(() => !document.getElementById('panel').hidden);
    const ants = page.locator('.panel input[type=range]').first();
    await ants.focus();
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
    await sleep(100);                                              // the counter updates on the next picture
    ui.antsAfterSlider = await page.evaluate(() => window.__stats.ants);
    await page.keyboard.press('Space');                            // Space must still pause with a slider focused
    ui.pausedFromSlider = await page.getByRole('button', { name: /Resume/ }).count();
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Tide colours' }).click();
    await sleep(500);
    await snap('panel');
    await page.keyboard.press('f');
    ui.meterHidden = await page.evaluate(() => document.querySelector('.meter').hidden);
    await page.keyboard.press('h');
    ui.uiHidden = await page.evaluate(() => document.getElementById('ui').classList.contains('hidden'));
    await page.keyboard.press('h');
    await page.keyboard.press('r');
    await sleep(700);
    await snap('after-reset');
    result.ui = ui;
  } else if (actions === 'resize') {
    await until(seconds / 2);
    const before = await page.evaluate(() => window.__stats.frames);
    await page.setViewportSize({ width: 1280, height: 720 });
    await sleep(1500);
    const mid = await page.evaluate(() => window.__stats.frames);
    result.resize = { before, mid };
  }
  for (const t of String(opt('shots', '')).split(',').filter(Boolean).map(Number)) {
    await until(t);
    await snap(`${t}s`);
  }
  await until(seconds);
  clearInterval(sampler);
  if (shot) await page.screenshot({ path: shot });
  const stats = await page.evaluate(() => window.__stats);
  const steady = samples.slice(Math.max(0, samples.length - 30)).filter((v) => v > 0);
  result = { ...result, ...stats, meanFps: steady.length ? +(steady.reduce((a, b) => a + b, 0) / steady.length).toFixed(1) : 0,
    minFps: steady.length ? Math.min(...steady) : 0, errorCount: errors.length, errors: [...new Set(errors)].slice(0, 4).map((e) => e.slice(0, 300)) };
} finally {
  await browser.close();
}
console.log(JSON.stringify(result));
