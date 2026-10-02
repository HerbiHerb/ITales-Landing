import { services } from './config/services.js';

const sitePath = new URL(import.meta.env.BASE_URL, location.href).pathname;
const storageKey = `itales:analytics-consent:${sitePath}`;
const cookiePrefix = 'itales_landing';
const maxAge = 180 * 24 * 60 * 60 * 1000;
let consent = readConsent();
let tagStarted = false;
let pageViewSent = false;
let settingsTrigger = null;

function readConsent() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (['granted', 'denied'].includes(saved?.choice) && Number.isFinite(saved.savedAt)
      && Date.now() - saved.savedAt >= 0 && Date.now() - saved.savedAt < maxAge) return saved.choice;
  } catch { /* If storage is unavailable, consent lasts for this page only. */ }
  return null;
}

function sanitizedUrl(value) {
  try { const url = new URL(value); return url.origin + url.pathname; } catch { return ''; }
}

function gtag(...args) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

function startAnalytics() {
  if (consent !== 'granted' || !services.measurementId || tagStarted) return;
  tagStarted = true;
  window[`ga-disable-${services.measurementId}`] = false;
  window.gtag = gtag;
  gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  });
  gtag('consent', 'update', { analytics_storage: 'granted' });
  gtag('js', new Date());
  gtag('config', services.measurementId, {
    send_page_view: false, cookie_expires: 180 * 24 * 60 * 60, cookie_prefix: cookiePrefix, cookie_domain: 'none', cookie_path: sitePath,
    allow_google_signals: false, allow_ad_personalization_signals: false,
    page_location: sanitizedUrl(location.href), page_referrer: sanitizedUrl(document.referrer),
  });
  const script = document.createElement('script');
  script.id = 'analytics-tag';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${services.measurementId}`;
  document.head.append(script);
  if (!pageViewSent) {
    pageViewSent = true;
    gtag('event', 'page_view', { page_location: sanitizedUrl(location.href), page_referrer: sanitizedUrl(document.referrer) });
  }
}

function stopAnalytics() {
  window[`ga-disable-${services.measurementId}`] = true;
  document.getElementById('analytics-tag')?.remove();
  if (window.dataLayer) window.dataLayer.length = 0;
  const paths = new Set(['/', sitePath]);
  const segments = location.pathname.split('/').filter(Boolean);
  for (let i = 1; i < segments.length; i++) paths.add(`/${segments.slice(0, i).join('/')}/`);
  for (const part of document.cookie.split(';')) {
    const name = part.trim().split('=')[0];
    if (!name.startsWith(cookiePrefix)) continue;
    for (const path of paths) document.cookie = `${name}=; Max-Age=0; path=${path}; SameSite=Lax`;
  }
}

function saveChoice(choice) {
  consent = choice;
  try { localStorage.setItem(storageKey, JSON.stringify({ choice, savedAt: Date.now() })); } catch { /* No storage: continue. */ }
  document.querySelector('[data-consent-panel]').hidden = true;
  settingsTrigger?.focus();
  if (choice === 'granted') {
    // A fresh document prevents duplicate GA listeners when consent is granted again after revocation.
    if (tagStarted && window[`ga-disable-${services.measurementId}`]) location.reload();
    else startAnalytics();
  } else stopAnalytics();
}

export function track(eventName, params = {}, callback) {
  if (consent !== 'granted' || !services.measurementId) return false;
  const safe = {};
  for (const key of ['source_page', 'cta_position']) {
    if (typeof params[key] === 'string') safe[key] = params[key];
  }
  gtag('event', eventName, { ...safe, ...(callback ? { event_callback: callback, event_timeout: 150 } : {}) });
  return true;
}

export function initAnalytics() {
  const panel = document.querySelector('[data-consent-panel]');
  panel.hidden = consent !== null;
  document.querySelector('[data-consent-allow]').addEventListener('click', () => saveChoice('granted'));
  document.querySelector('[data-consent-decline]').addEventListener('click', () => saveChoice('denied'));
  document.querySelector('[data-consent-settings]').addEventListener('click', (event) => {
    settingsTrigger = event.currentTarget;
    panel.hidden = false;
    panel.querySelector('[data-consent-decline]').focus();
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey) return;
    consent = readConsent();
    if (consent !== 'granted') stopAnalytics();
    else if (tagStarted && window[`ga-disable-${services.measurementId}`]) location.reload();
    else if (!tagStarted) startAnalytics();
    panel.hidden = consent !== null;
  });
  startAnalytics();

  document.querySelectorAll('[data-interest-cta]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const plainClick = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
      const params = { source_page: document.body.dataset.page, cta_position: link.dataset.ctaPosition };
      if (!plainClick || consent !== 'granted' || !services.measurementId) { track('interest_click', params); return; }
      event.preventDefault();
      let navigated = false;
      const navigate = () => { if (!navigated) { navigated = true; location.assign(link.href); } };
      track('interest_click', params, navigate);
      window.setTimeout(navigate, 150); // Navigation must still work if analytics is blocked.
    });
  });
}
