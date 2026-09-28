import { media } from './config/media.js';

const localUrl = (path) => {
  if (!path || /^(?:[a-z]+:|\/\/)/i.test(path) || path.startsWith('/') || path.includes('..')) return null;
  return new URL(import.meta.env.BASE_URL + path, location.href).href;
};

export function initMedia() {
  document.querySelectorAll('[data-media]').forEach((figure) => {
    const entry = media[figure.dataset.media];
    if (!entry) return;
    const image = figure.querySelector('img');
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
    video.setAttribute('aria-label', entry.alt);
    video.poster = localUrl(entry.poster || entry.image) || image.src;
    video.width = 1200;
    video.height = 800;
    video.src = videoUrl;
    const captionsUrl = localUrl(entry.captions);
    if (captionsUrl) {
      const track = document.createElement('track');
      Object.assign(track, { kind: 'captions', src: captionsUrl, srclang: 'en', label: 'English', default: true });
      video.append(track);
    }
    video.append(document.createTextNode('Your browser cannot play this preview video.'));
    video.addEventListener('error', () => {
      video.replaceWith(image);
      if (caption) caption.textContent = originalCaption;
    }, { once: true });
    image.replaceWith(video);
    if (caption) caption.textContent = entry.caption || 'ITales preview';
  });
}
