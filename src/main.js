import 'bootstrap/dist/css/bootstrap.min.css';
import Carousel from 'bootstrap/js/dist/carousel';
import './styles.css';
import { initAnalytics } from './analytics.js';
import { initForm } from './form.js';
import { initHero } from './hero.js';
import { initMedia } from './media.js';

initAnalytics();
initForm();
initHero();
initMedia();
const carousel = document.getElementById('worlds-carousel');
if (carousel) {
  new Carousel(carousel, { interval: false, touch: true });
  carousel.addEventListener('slid.bs.carousel', () => {
    carousel.querySelectorAll('.carousel-item').forEach((item) => item.setAttribute('aria-hidden', String(!item.classList.contains('active'))));
  });
  carousel.querySelectorAll('.carousel-item').forEach((item, index) => item.setAttribute('aria-hidden', String(index !== 0)));
}
