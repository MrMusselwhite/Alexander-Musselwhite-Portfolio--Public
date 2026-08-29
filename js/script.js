/* Phase 5 (early): collapse the primary nav into a menu button on narrow screens.

   Written as an enhancement rather than a requirement — the HTML and CSS alone
   give a plain wrapping list of links. Everything below only ever adds the
   collapsed behaviour on top, so a failed or blocked script leaves a nav that
   still works. */

const nav = document.querySelector('.site-nav');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('#nav-menu');
const header = document.querySelector('.site-header');
const headerSentinel = document.querySelector('.header-sentinel');

const gallery = document.querySelector('.gallery');
const gallerySlides = document.querySelectorAll('.gallery__slide');
const galleryStatus = document.querySelector('#gallery-status');

// Matches the single breakpoint used throughout style.css.
const wideScreen = window.matchMedia('(min-width: 48rem)');

// Someone who has asked their system to reduce motion should not be shown a
// slideshow that moves on its own.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* Works out how tall the open panel needs to be and hands that number to the CSS.

   Same reason the pill's width is measured further down: a browser can't animate
   towards `height: auto` because there's no number to count to, so the panel
   would snap open instead of unrolling. Measuring turns it into pixels, which do
   animate.

   scrollHeight reports how tall an element's contents are even while it's
   collapsed to zero height with the overflow hidden — so this is a single read
   with nothing to set up and nothing to put back afterwards. */
function measureMenuHeight() {
  navMenu.style.setProperty('--nav-menu-height', navMenu.scrollHeight + 'px');
}

function setMenuOpen(isOpen) {
  // Measured on the way open, every time, so the value always matches the
  // current text size and screen width rather than being stale from page load.
  if (isOpen) measureMenuHeight();

  navMenu.classList.toggle('is-open', isOpen);
  // Keeps the screen-reader state in step with what's visually on screen — and
  // since the CSS styles the button off this attribute, it's also what turns
  // the three bars into an X.
  navToggle.setAttribute('aria-expanded', String(isOpen));
}

function isMenuOpen() {
  return navToggle.getAttribute('aria-expanded') === 'true';
}

function initNav() {
  // Bail out rather than throw if the markup ever changes shape.
  if (!nav || !navToggle || !navMenu) return;

  // This class is the switch that activates the collapsed layout in CSS.
  nav.classList.add('has-js');
  setMenuOpen(false);

  navToggle.addEventListener('click', function () {
    setMenuOpen(!isMenuOpen());
  });

  // Close once a destination is chosen, or the open panel would sit on top of
  // the section the visitor just jumped to.
  navMenu.addEventListener('click', function (event) {
    if (event.target.closest('a')) setMenuOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isMenuOpen()) {
      setMenuOpen(false);
      navToggle.focus();
    }
  });

  // Reset on the way up to the desktop layout, so shrinking back down later
  // doesn't reveal a panel left open from before.
  wideScreen.addEventListener('change', function (event) {
    if (event.matches) setMenuOpen(false);
  });
}

/* Works out how narrow the floating pill can be without its text wrapping, and
   writes that number into --width-nav-pinned for the CSS to animate toward.

   Why measure at all: `width: max-content` already shrinks a box to exactly fit
   its contents, but a browser can't animate to or from it — there's no number to
   count toward, so the shrink would snap instead of gliding. Measuring turns that
   into a plain pixel value, which does animate.

   The measured width differs by layout: with the links showing it's the brand
   plus five links; below the breakpoint the links are hidden and it's just the
   brand plus the menu button, which is why this re-runs whenever that changes. */
function measurePinnedWidth() {
  if (!header || !nav) return;

  const wasPinned = header.classList.contains('is-pinned');

  header.classList.add('is-measuring', 'is-pinned');
  // The one layout read, taken while the measuring styles are applied.
  const width = nav.getBoundingClientRect().width;
  if (!wasPinned) header.classList.remove('is-pinned');

  // Rounded up: a fractional width can round down in flex layout and wrap the
  // last link, which is the exact thing this is meant to prevent.
  document.documentElement.style.setProperty('--width-nav-pinned', Math.ceil(width) + 'px');

  // Released a frame later, so putting the real styles back doesn't animate out
  // of the measured state.
  requestAnimationFrame(function () {
    header.classList.remove('is-measuring');
  });
}

function initPillWidth() {
  if (!header || !nav) return;

  measurePinnedWidth();

  // Text measured in the fallback font is a different width to text in Space
  // Grotesk, so the first measurement is stale the moment the real font lands.
  if (document.fonts) {
    document.fonts.ready.then(measurePinnedWidth);
  }

  // Crossing the breakpoint swaps five links for one menu button — a completely
  // different width, so it has to be measured again.
  wideScreen.addEventListener('change', measurePinnedWidth);
}

/* Switches the header between its full-width bar and its floating pill.

   This deliberately does NOT listen to the scroll event. A scroll handler runs
   on every single frame of scrolling and would have to measure the page each
   time, which is exactly the kind of work that makes a page feel sluggish.
   IntersectionObserver instead lets the browser tell us the one moment the
   sentinel crosses the edge of the screen, and stays silent otherwise. */
function initStickyHeader() {
  if (!header || !headerSentinel) return;

  const observer = new IntersectionObserver(function (entries) {
    // Sentinel out of view means the header has reached the top and stuck.
    header.classList.toggle('is-pinned', !entries[0].isIntersecting);
  });

  observer.observe(headerSentinel);
}

/* Photo slideshow above the About section.

   How long each photo is held before the next one. Long enough to actually look
   at a picture and read its caption without feeling hurried. */
const GALLERY_INTERVAL = 6000;

let galleryIndex = 0;
let galleryTimer = null;
// Once someone works the arrows themselves, the slideshow stops advancing on its
// own for good. Anything that moves by itself has to be stoppable, and taking
// manual control is the clearest possible signal that it should stop.
let galleryTakenOver = false;

function showSlide(nextIndex) {
  // Wraps around in both directions, so "previous" from the first photo lands on
  // the last one rather than doing nothing.
  galleryIndex = (nextIndex + gallerySlides.length) % gallerySlides.length;

  gallerySlides.forEach(function (slide, i) {
    slide.classList.toggle('is-active', i === galleryIndex);
  });

  if (galleryStatus) {
    const caption = gallerySlides[galleryIndex].querySelector('figcaption');
    galleryStatus.textContent =
      'Photo ' + (galleryIndex + 1) + ' of ' + gallerySlides.length +
      (caption ? ': ' + caption.textContent.trim() : '');
  }
}

function stopGalleryTimer() {
  clearInterval(galleryTimer);
  galleryTimer = null;
}

function startGalleryTimer() {
  // Guarded so hovering on and off repeatedly can't stack up several timers all
  // advancing the same slideshow at once.
  if (galleryTimer || galleryTakenOver || reducedMotion.matches) return;
  galleryTimer = setInterval(function () {
    showSlide(galleryIndex + 1);
  }, GALLERY_INTERVAL);
}

function goToSlide(step) {
  // Manual use wins: stop advancing and don't start again.
  galleryTakenOver = true;
  stopGalleryTimer();
  showSlide(galleryIndex + step);
}

function initGallery() {
  if (!gallery || gallerySlides.length < 2) return;

  // Reveals the arrows. Until this runs they're hidden, so they can never appear
  // as buttons that don't respond.
  gallery.classList.add('has-js');

  const prev = gallery.querySelector('.gallery__arrow--prev');
  const next = gallery.querySelector('.gallery__arrow--next');
  if (prev) prev.addEventListener('click', function () { goToSlide(-1); });
  if (next) next.addEventListener('click', function () { goToSlide(1); });

  // Pause while someone is actually looking at or tabbing through it, so a photo
  // can't slide away mid-read. focusin/focusout cover the keyboard equivalent of
  // hovering.
  gallery.addEventListener('mouseenter', stopGalleryTimer);
  gallery.addEventListener('mouseleave', startGalleryTimer);
  gallery.addEventListener('focusin', stopGalleryTimer);
  gallery.addEventListener('focusout', startGalleryTimer);

  // Stop when the tab is in the background — no point animating something nobody
  // is looking at, and it saves the battery.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopGalleryTimer();
    else startGalleryTimer();
  });

  // If the motion preference changes while the page is open, respect it at once.
  reducedMotion.addEventListener('change', function (event) {
    if (event.matches) stopGalleryTimer();
    else startGalleryTimer();
  });

  startGalleryTimer();
}

/* Starts one enhancement in isolation.

   Everything in this file is an independent extra on top of a page that already
   works. Without this wrapper they wouldn't be independent in practice: an
   unexpected error in any one of them would stop the script dead and every
   feature set up after it would silently never start, so a bug in the nav would
   also cost the visitor the slideshow.

   The error is still reported to the console rather than swallowed, so it stays
   findable while building. */
function enhance(name, setup) {
  try {
    setup();
  } catch (error) {
    console.error('Could not start the ' + name + ':', error);
  }
}

enhance('nav', initNav);
// Measured before the observer starts, so the pill already knows its width if
// the page happens to load part-way down (arriving on a #section link).
enhance('nav pill sizing', initPillWidth);
enhance('sticky header', initStickyHeader);
enhance('photo slideshow', initGallery);
