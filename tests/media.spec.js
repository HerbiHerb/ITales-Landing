import { test, expect } from '@playwright/test';

async function openHome(page) {
  await page.goto('index.html');
  await page.getByRole('button', { name: 'Decline', exact: true }).click();
  await expect(page.locator('.teaser-card video')).toHaveCount(2);
}

async function expectPlaying(video) {
  await expect.poll(() => video.evaluate((element) => !element.paused && element.currentTime > 0 && element.videoWidth > 0)).toBe(true);
}

test('home demos load on hover, play muted across the card and pause on leaving or scrolling away', async ({ page }) => {
  const videoRequests = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.mp4')) videoRequests.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openHome(page);
  expect(videoRequests).toEqual([]);
  const game = page.locator('[data-media="gameTeaser"] video');
  const editor = page.locator('[data-media="editorTeaser"] video');
  for (const video of [game, editor]) {
    await expect(video).toHaveAttribute('preload', 'none');
    expect(await video.evaluate((element) => element.paused && element.muted && element.controls && element.loop && element.playsInline && !element.autoplay)).toBe(true);
    const poster = await page.request.get(await video.getAttribute('poster'));
    expect(poster.ok()).toBe(true);
  }
  await game.scrollIntoViewIfNeeded();
  await page.locator('.teaser-card').first().getByRole('heading').hover();
  await expectPlaying(game);
  expect(await editor.evaluate((element) => element.paused)).toBe(true);
  await page.mouse.move(0, 0);
  await expect.poll(() => game.evaluate((element) => element.paused)).toBe(true);
  await editor.hover();
  await expectPlaying(editor);
  expect(await game.evaluate((element) => element.paused)).toBe(true);
  await page.getByRole('heading', { name: 'A little imagination. A lot of possibilities.' }).scrollIntoViewIfNeeded();
  await expect.poll(() => editor.evaluate((element) => element.paused)).toBe(true);
});

test('reduced motion prevents hover playback and still allows keyboard playback', async ({ page }) => {
  const videoRequests = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.mp4')) videoRequests.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  const game = page.locator('[data-media="gameTeaser"] video');
  await game.hover();
  expect(await game.evaluate((element) => element.paused)).toBe(true);
  expect(videoRequests).toEqual([]);
  await game.focus();
  await page.keyboard.press('Space');
  await expectPlaying(game);
  await page.keyboard.press('Space');
  await expect.poll(() => game.evaluate((element) => element.paused)).toBe(true);
});

test('touch visitors can play using the native controls', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL, hasTouch: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await openHome(page);
    const game = page.locator('[data-media="gameTeaser"] video');
    await game.scrollIntoViewIfNeeded();
    expect(await game.evaluate((element) => element.paused)).toBe(true);
    const bounds = await game.boundingBox();
    await game.tap({ position: { x: 20, y: bounds.height - 28 } });
    await expectPlaying(game);
    expect(await game.evaluate((element) => element.muted)).toBe(true);
    await page.getByRole('heading', { name: 'A little imagination. A lot of possibilities.' }).scrollIntoViewIfNeeded();
    await expect.poll(() => game.evaluate((element) => element.paused)).toBe(true);
  } finally {
    await context.close();
  }
});

test('a failed video returns to its poster without breaking the preview link', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/game-preview.mp4', (route) => route.abort());
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openHome(page);
  const figure = page.locator('[data-media="gameTeaser"]');
  await figure.locator('video').hover();
  await expect(figure.locator('video')).toHaveCount(0);
  await expect(figure.locator('img')).toBeVisible();
  await expect.poll(() => figure.locator('img').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.getByRole('link', { name: 'Explore the Game preview' }).click();
  await expect(page).toHaveURL(/game\.html$/);
  expect(errors).toEqual([]);
});

test('leaving while the demo loads prevents delayed playback', async ({ page }) => {
  let release;
  let requested;
  const gate = new Promise((resolve) => { release = resolve; });
  const requestStarted = new Promise((resolve) => { requested = resolve; });
  await page.route('**/game-preview.mp4', async (route) => {
    requested();
    await gate;
    await route.continue();
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openHome(page);
  const game = page.locator('[data-media="gameTeaser"] video');
  await game.hover();
  await requestStarted;
  await page.mouse.move(0, 0);
  release();
  await expect.poll(() => game.evaluate((element) => element.readyState)).toBeGreaterThanOrEqual(2);
  expect(await game.evaluate((element) => element.paused)).toBe(true);
  await game.hover();
  await expectPlaying(game);
});
