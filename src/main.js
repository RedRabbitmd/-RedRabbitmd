import Swiper from 'swiper';
import { A11y, Keyboard, Navigation } from 'swiper/modules';

const gallery = document.querySelector('.gallery');
const controls = document.querySelector('.gallery-controls');
const position = document.querySelector('.gallery-position');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (gallery && controls && position) {
  const swiper = new Swiper(gallery, {
    modules: [A11y, Keyboard, Navigation],
    slidesPerView: 'auto',
    spaceBetween: 32,
    watchSlidesProgress: true,
    speed: reducedMotion.matches ? 0 : 300,
    grabCursor: true,
    autoplay: false,
    loop: false,
    // Enable arrows only while focus is within the gallery or its controls.
    keyboard: { enabled: false, onlyInViewport: true, pageUpDown: false },
    navigation: { prevEl: '.gallery-prev', nextEl: '.gallery-next' },
    a11y: {
      prevSlideMessage: 'Назад',
      nextSlideMessage: 'Вперёд',
      firstSlideMessage: 'Это первая фотография',
      lastSlideMessage: 'Это последняя фотография',
      slideLabelMessage: 'Фотография {{index}} из {{slidesLength}}',
      itemRoleDescriptionMessage: 'слайд',
    },
    on: {
      init: updatePosition,
      transitionEnd: updatePosition,
      resize: updatePosition,
    },
  });
  controls.hidden = false;
  document.addEventListener('focusin', () => {
    const focused = document.activeElement;
    if (gallery.contains(focused) || controls.contains(focused)) swiper.keyboard.enable();
    else swiper.keyboard.disable();
  });
  reducedMotion.addEventListener('change', ({ matches }) => {
    swiper.params.speed = matches ? 0 : 300;
  });
}

function updatePosition(swiper) {
  const visible = swiper.visibleSlidesIndexes;
  const first = (visible[0] ?? swiper.realIndex) + 1;
  const last = (visible.at(-1) ?? swiper.realIndex) + 1;
  position.textContent = `${first === last ? first : `${first}–${last}`} / ${swiper.slides.length}`;
}
