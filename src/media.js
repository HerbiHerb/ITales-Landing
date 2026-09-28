import { media } from './config/media.js';

const localUrl = (path) => {
  if (!path || /^(?:[a-z]+:|\/\/)/i.test(path) || path.startsWith('/') || path.includes('..')) return null;
  return new URL(import.meta.env.BASE_URL + path, location.href).href;
};

function initHoverPreview(video, figure) {
  const card = figure.closest('.teaser-card') || figure;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hoverPointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
  let playRequest = 0;
  let hoverPlaying = false;

  const pause = () => {
    playRequest += 1;
    hoverPlaying = false;
    video.pause();
  };
  const enter = (event) => {
    if (event.pointerType !== 'mouse' || !hoverPointer.matches || reducedMotion.matches || document.hidden || !video.paused) return;
    const request = ++playRequest;
    hoverPlaying = true;
    video.muted = true;
    // Playback may be blocked or finish loading after the pointer has left.
    video.play().then(() => {
      if (request !== playRequest && !hoverPlaying) video.pause();
    }).catch(() => {
      if (request === playRequest) hoverPlaying = false;
    });
  };
  const leave = (event) => {
    if (event.pointerType === 'mouse') pause();
  };
  const visibilityChanged = () => {
    if (document.hidden) pause();
  };
  const motionChanged = () => {
    if (reducedMotion.matches && hoverPlaying) pause();
  };
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) pause();
  });
  observer.observe(video);
  card.addEventListener('pointerenter', enter);
  card.addEventListener('pointerleave', leave);
  document.addEventListener('visibilitychange', visibilityChanged);
  reducedMotion.addEventListener('change', motionChanged);

  return () => {
    pause();
    observer.disconnect();
    card.removeEventListener('pointerenter', enter);
    card.removeEventListener('pointerleave', leave);
    document.removeEventListener('visibilitychange', visibilityChanged);
    reducedMotion.removeEventListener('change', motionChanged);
  };
}

export function initMedia() {
  document.querySelectorAll('[data-media]').forEach((figure) => {
    const entry = media[figure.dataset.media];
    const image = figure.querySelector('img');
    if (!entry || !image) return;
    const imageUrl = localUrl(entry.image);
    if (imageUrl) image.src = imageUrl;
    image.alt = entry.alt;
    const caption = figure.querySelector('figcaption');
    if (caption && entry.caption) caption.textContent = entry.caption;
    if (!figure.matches('figure')) return; // The carousel uses configurable images only.
    const originalCaption = caption?.textContent;
    const videoUrl = localUrl(entry.video);
    if (!videoUrl) return;
    const video = document.createElement('video');
    video.controls = true;
    video.preload = 'none';
    video.playsInline = true;
    video.tabIndex = 0;
    video.setAttribute('aria-label', entry.alt);
    video.poster = localUrl(entry.poster || entry.image) || image.src;
    video.width = image.width || 1200;
    video.height = image.height || 800;
    video.src = videoUrl;
    if (entry.playOnHover) {
      video.defaultMuted = true;
      video.muted = true;
      video.loop = true;
    }
    const captionsUrl = localUrl(entry.captions);
    if (captionsUrl) {
      const track = document.createElement('track');
      Object.assign(track, { kind: 'captions', src: captionsUrl, srclang: 'en', label: 'English', default: true });
      video.append(track);
    }
    video.append(document.createTextNode('Your browser cannot play this preview video.'));
    let cleanupHover;
    video.addEventListener('error', () => {
      cleanupHover?.();
      video.replaceWith(image);
      if (caption) caption.textContent = originalCaption;
    }, { once: true });
    image.replaceWith(video);
    if (caption) caption.textContent = entry.caption || 'ITales preview';
    if (entry.playOnHover) cleanupHover = initHoverPreview(video, figure);
  });
}
