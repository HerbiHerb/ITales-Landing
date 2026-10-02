import { test, expect } from '@playwright/test';

const googleMock = `
(() => {
  const record = (args) => {
    if (window['ga-disable-G-TEST12345']) return;
    const entries = JSON.parse(sessionStorage.getItem('mock-ga') || '[]');
    entries.push(args);
    sessionStorage.setItem('mock-ga', JSON.stringify(entries));
    if (args[0] === 'event' && args[2]?.event_callback) args[2].event_callback();
  };
  const queued = [...window.dataLayer];
  window.dataLayer.push = (...entries) => { entries.forEach(record); return Array.prototype.push.apply(window.dataLayer, entries); };
  queued.forEach(record);
})();`;

async function mockGoogle(page) {
  const requests = [];
  page.on('request', (request) => {
    if (/G-TEST12345/.test(request.url())) requests.push(request.url());
  });
  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: googleMock }));
  await page.route('https://**.google-analytics.com/**', (route) => route.abort());
  return requests;
}

async function gaEvents(page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem('mock-ga') || '[]').filter((entry) => entry[0] === 'event'));
}

async function allowAnalytics(page) {
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  await expect.poll(async () => (await gaEvents(page)).length).toBeGreaterThan(0);
}

async function completeRequired(page) {
  await page.getByLabel('Playing stories', { exact: true }).check();
  await page.locator('.rating-option').filter({ has: page.locator('[value="4"]') }).click();
}

async function expectStaticPreviews(page) {
  const sections = page.locator('.preview-section');
  await expect(sections.first()).toBeVisible();
  await expect(page.locator('.preview-media video')).toHaveCount(0);
  for (const section of await sections.all()) {
    const image = section.locator('.preview-media img');
    await expect(image).toHaveCount(1);
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  }
}

test('all static pages and local assets load at mobile, tablet and desktop sizes', async ({ page }) => {
  const failures = [];
  await page.route('https://itch.io/embed/**', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Quantum-Echo</title>' }));
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['index.html', 'game.html', 'editor.html', 'interest.html', 'impressum.html', 'privacy.html']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('img').evaluateAll((images) => images.forEach((image) => { image.loading = 'eager'; }));
      await expect.poll(() => page.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.fonts.check('16px Nunito'))).toBe(true);
      await page.reload();
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    }
  }
  expect(failures).toEqual([]);
});

test('navigation reaches both previews and preserves CTA origin', async ({ page }) => {
  await page.goto('index.html');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Game', exact: true }).click();
  await expect(page).toHaveURL(/game\.html$/);
  await expect(page.getByRole('link', { name: 'Game', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.locator('[data-interest-cta]').first().click();
  await expect(page).toHaveURL(/interest\.html\?source=game$/);
  await expect(page.locator('[name="source"]')).toHaveValue('game');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Editor', exact: true }).click();
  await expect(page).toHaveURL(/editor\.html$/);
  await expect(page.getByRole('link', { name: 'Editor', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.locator('[data-interest-cta]').last().click();
  await expect(page.locator('[name="source"]')).toHaveValue('editor');
  await page.goto('interest.html?source=invalid');
  await expect(page.locator('[name="source"]')).toHaveValue('direct');
});

test('reduced motion shows hero copy immediately and no empty video players', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('index.html');
  await expect(page.locator('[data-landing-typed]').first()).toHaveText('Bring your ideas to life');
  await expect(page.locator('.typed-hero-box')).toHaveCount(4);
  expect(await page.locator('.typed-hero-box').evaluateAll((boxes) => boxes.every((box) => getComputedStyle(box).opacity === '1'))).toBe(true);
  for (const path of ['game.html', 'editor.html']) {
    await page.goto(path);
    await expect(page.locator('video')).toHaveCount(0);
    await expectStaticPreviews(page);
  }
});

test('carousel advances automatically', async ({ page }) => {
  await page.goto('index.html');
  const carousel = page.locator('#worlds-carousel');
  await carousel.scrollIntoViewIfNeeded();
  const activeSlide = carousel.locator('.carousel-item.active');
  const initialSlide = await activeSlide.getAttribute('data-media');
  await expect.poll(() => activeSlide.getAttribute('data-media'), { timeout: 4500 }).not.toBe(initialSlide);
});

test('carousel controls change the illustration with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('index.html');
  const firstImage = page.locator('.carousel-item.active img');
  await firstImage.scrollIntoViewIfNeeded();
  await expect(firstImage).toHaveJSProperty('naturalWidth', 1273);
  await expect(firstImage).toHaveAttribute('src', /landing_page\/image_marking\.png$/);
  await page.getByRole('button', { name: 'Next illustration' }).click();
  await expect(page.locator('.carousel-item.active')).toContainText('Desktop or mobile');
  await page.getByRole('button', { name: 'Previous illustration' }).click();
  await expect(page.locator('.carousel-item.active')).toContainText('New form of interaction');
});

test('demo section embeds the original itch.io widget below the previews', async ({ page }) => {
  const itchRequests = [];
  await page.route('https://itch.io/embed/**', (route) => {
    itchRequests.push(route.request().url());
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Quantum-Echo</title>' });
  });
  await page.goto('index.html');
  const section = page.getByRole('region', { name: 'Try the demo by yourself' });
  expect(await section.evaluate((element) =>
    Boolean(element.previousElementSibling?.querySelector('#discover-title') && element.nextElementSibling?.querySelector('#worlds-title'))
  )).toBe(true);
  const iframe = section.locator('iframe');
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute('src', /itch\.io\/embed\/5080059/);
  await expect(iframe).toHaveAttribute('width', '552');
  await expect(iframe).toHaveAttribute('height', '167');
  await expect(section.getByRole('link', { name: 'Open Quantum-Echo on itch.io' })).toHaveAttribute('href', 'https://salt-coffee.itch.io/quantum-echo');
  await expect(section.getByRole('button')).toHaveCount(0);
  await expect.poll(() => itchRequests.length).toBe(1);
});

test('required answers and optional email consent are validated without sending', async ({ page }) => {
  const requests = [];
  await page.route('https://formspree.io/**', (route) => { requests.push(route.request()); return route.abort(); });
  await page.goto('interest.html');
  await expect(page.locator('[name="interest_area"]:checked')).toHaveCount(0);
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByText('Please choose what interests you most.')).toBeVisible();
  await expect(page.getByText('Please choose an interest level from 1 to 5.')).toBeVisible();
  await expect(page.getByLabel('Nothing', { exact: true })).toBeFocused();
  await completeRequired(page);
  await page.getByLabel(/^Email/).fill('bad-address');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  await page.getByLabel(/^Email/).fill('reader@example.com');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByText(/To leave your email/)).toBeVisible();
  await page.getByLabel(/^Email/).clear();
  await page.getByLabel('Notify me when ITales launches', { exact: true }).check();
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByText(/Please enter your email to receive/)).toBeVisible();
  expect(requests).toHaveLength(0);
});

test('Nothing requires a brief reason and missing features reach the feedback submission', async ({ page }) => {
  const payloads = [];
  await page.route('https://formspree.io/f/testform', (route) => {
    payloads.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, json: { ok: true } });
  });
  await page.goto('interest.html');
  const options = page.locator('[name="interest_area"]');
  await expect(options.first()).toHaveAttribute('value', 'nothing');
  await expect(page.locator('#nothing-reason-field')).toBeHidden();
  await page.getByLabel('Nothing', { exact: true }).check();
  await expect(page.locator('#nothing-reason-field')).toBeVisible();
  await page.locator('[name="interest_rating"][value="2"]').check();
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByText('Please briefly tell us why neither option interests you.')).toBeVisible();
  await expect(page.locator('#nothing-reason')).toBeFocused();
  expect(payloads).toHaveLength(0);
  await page.getByLabel("Why doesn't either option interest you?").fill('  I prefer a different kind of game.  ');
  await page.getByLabel('Do you miss any features?').fill('  Co-op play  ');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.locator('#form-success')).toBeVisible();
  expect(payloads).toEqual([{ interest_area: 'nothing', interest_rating: 2, nothing_reason: 'I prefer a different kind of game.', missing_features: 'Co-op play', feedback: '', source: 'direct', notify_launch: false }]);
});

test('changing away from Nothing hides and omits its explanation', async ({ page }) => {
  let payload;
  await page.route('https://formspree.io/f/testform', (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ status: 200, json: { ok: true } });
  });
  await page.goto('interest.html');
  await page.getByLabel('Nothing', { exact: true }).check();
  await page.getByLabel("Why doesn't either option interest you?").fill('Not for me');
  await page.getByLabel('Playing stories', { exact: true }).check();
  await expect(page.locator('#nothing-reason-field')).toBeHidden();
  await expect(page.locator('#nothing-reason')).toBeEmpty();
  await page.locator('[name="interest_rating"][value="4"]').check();
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.locator('#form-success')).toBeVisible();
  expect(payload).not.toHaveProperty('nothing_reason');
});

test('feedback without email succeeds even after declining analytics', async ({ page }) => {
  const googleRequests = await mockGoogle(page);
  const payloads = [];
  await page.route('https://formspree.io/f/testform', (route) => {
    payloads.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, json: { ok: true } });
  });
  await page.goto('interest.html?source=home');
  await page.getByRole('button', { name: 'Decline', exact: true }).click();
  await completeRequired(page);
  await page.getByLabel('What would you like to see in ITales?', { exact: false }).fill('More mysteries');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByRole('heading', { name: 'Thanks! Your feedback helps shape ITales.' })).toBeVisible();
  await expect(page.locator('#form-success')).toBeFocused();
  expect(payloads).toEqual([{ interest_area: 'playing', interest_rating: 4, feedback: 'More mysteries', source: 'home', notify_launch: false }]);
  expect(googleRequests).toEqual([]);
});

test('a confirmed submission tracks once and private answers never reach analytics', async ({ page }) => {
  await mockGoogle(page);
  let payload;
  await page.route('https://formspree.io/f/testform', (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ status: 200, json: { ok: true } });
  });
  await page.goto('game.html');
  await allowAnalytics(page);
  await page.locator('[data-interest-cta]').first().click();
  await completeRequired(page);
  await page.getByLabel(/^Email/).fill('private@example.com');
  await page.getByLabel('Notify me when ITales launches', { exact: true }).check();
  await page.locator('#feedback').fill('private-comment');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.locator('#form-success')).toBeVisible();
  expect(payload.email).toBe('private@example.com');
  expect(payload.notify_launch).toBe(true);
  const events = await gaEvents(page);
  expect(events.filter((event) => event[1] === 'interest_click')).toHaveLength(1);
  expect(events.filter((event) => event[1] === 'interest_form_start')).toHaveLength(1);
  expect(events.filter((event) => event[1] === 'interest_submit_success')).toHaveLength(1);
  expect(events.find((event) => event[1] === 'interest_click')[2]).toMatchObject({ source_page: 'game', cta_position: 'intro' });
  expect(JSON.stringify(events)).not.toMatch(/private@example|private-comment|interest_rating|interest_area/);
});

test('pending submission prevents double sends', async ({ page }) => {
  let requests = 0;
  let finish;
  const gate = new Promise((resolve) => { finish = resolve; });
  await page.route('https://formspree.io/f/testform', async (route) => {
    requests++;
    await gate;
    await route.fulfill({ status: 200, json: { ok: true } });
  });
  await page.goto('interest.html');
  await completeRequired(page);
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  await page.evaluate(() => document.getElementById('interest-form').requestSubmit());
  expect(requests).toBe(1);
  finish();
  await expect(page.locator('#form-success')).toBeVisible();
});

for (const scenario of [
  { name: 'quota', status: 429, json: { errors: [{ message: 'Limit reached' }] } },
  { name: 'server', status: 500, json: { error: 'Unavailable' } },
  { name: 'field', status: 422, json: { errors: [{ field: 'email', message: 'invalid' }] } },
  { name: 'unconfirmed response', status: 200, json: { ok: false } },
  { name: 'network', abort: true },
]) {
  test(`${scenario.name} failure preserves answers and never tracks success`, async ({ page }) => {
    await mockGoogle(page);
    let attempts = 0;
    await page.route('https://formspree.io/f/testform', (route) => {
      attempts++;
      return scenario.abort ? route.abort('failed') : route.fulfill({ status: scenario.status, json: scenario.json });
    });
    await page.goto('interest.html');
    await allowAnalytics(page);
    await completeRequired(page);
    await page.locator('#feedback').fill('Keep this answer');
    await page.locator('#email').fill('reader@example.com');
    await page.locator('#notify-launch').check();
    await page.getByRole('button', { name: 'Send feedback' }).click();
    await expect(page.locator('#form-status')).toBeVisible();
    await expect(page.locator('#feedback')).toHaveValue('Keep this answer');
    await expect(page.locator('#email')).toHaveValue('reader@example.com');
    await expect(page.locator('#notify-launch')).toBeChecked();
    await expect(page.getByRole('button', { name: 'Send feedback' })).toBeEnabled();
    await expect(page.locator('#form-success')).toBeHidden();
    expect(attempts).toBe(1);
    expect((await gaEvents(page)).filter((event) => event[1] === 'interest_submit_success')).toHaveLength(0);
    if (scenario.name === 'field') await expect(page.locator('#email-error')).toBeVisible();
  });
}

test('site Analytics makes no requests before consent or after declining across pages', async ({ page }) => {
  const requests = await mockGoogle(page);
  await page.goto('index.html');
  await page.locator('[data-interest-cta]').first().click();
  await completeRequired(page);
  expect(requests).toEqual([]);
  await page.getByRole('button', { name: 'Decline', exact: true }).click();
  await page.goto('editor.html');
  await expect(page.locator('[data-consent-panel]')).toBeHidden();
  await page.locator('[data-interest-cta]').first().click();
  await completeRequired(page);
  expect(requests).toEqual([]);
});

test('consent loads analytics once and revocation stops tracking and clears its cookies', async ({ page }) => {
  const requests = await mockGoogle(page);
  await page.goto('index.html');
  await allowAnalytics(page);
  expect(requests).toHaveLength(1);
  await page.evaluate(() => { document.cookie = 'itales_landing_ga=test; path=/'; document.cookie = 'unrelated=test; path=/'; });
  await page.getByRole('button', { name: 'Analytics settings' }).click();
  await page.getByRole('button', { name: 'Decline', exact: true }).click();
  expect(await page.evaluate(() => document.cookie)).not.toContain('itales_landing_ga');
  expect(await page.evaluate(() => document.cookie)).toContain('unrelated=test');
  expect(await page.evaluate(() => window['ga-disable-G-TEST12345'])).toBe(true);
  await expect(page.locator('#analytics-tag')).toHaveCount(0);
  await page.locator('[data-interest-cta]').first().click();
  await completeRequired(page);
  expect(requests).toHaveLength(1);
  expect((await gaEvents(page)).filter((event) => event[1] === 'interest_form_start')).toHaveLength(0);
});

test('page location and referrer exclude query parameters from analytics', async ({ page }) => {
  await mockGoogle(page);
  await page.goto('index.html?email=private@example.com');
  await allowAnalytics(page);
  const events = await gaEvents(page);
  expect(events.find((event) => event[1] === 'page_view')[2].page_location).not.toContain('?');
  expect(JSON.stringify(events)).not.toContain('private@example');
});

test('site works without JavaScript for navigation and static previews', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: testInfo.project.use.baseURL });
  try {
    const page = await context.newPage();
    await page.goto('index.html');
    await expect(page.locator('[data-landing-typed]').first()).toHaveText('Bring your ideas to life');
    for (const name of ['Game', 'Editor']) {
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${name.toLowerCase()}\\.html$`));
      await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page');
      await expectStaticPreviews(page);
    }
  } finally {
    await context.close();
  }
});
