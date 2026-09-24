# Alexander Musselwhite — Personal Website

Source for my portfolio site. Hand-written HTML, CSS and JavaScript.

**Live site:** https://mrmusselwhite.github.io/Alexander-Musselwhite-Portfolio--Public/

## About the build

- **Plain HTML/CSS/JS.** No Bootstrap, no Tailwind, no React. The layout is Flexbox and Grid, and
  the reusable colour/spacing/type values are CSS custom properties defined once at the top of
  `css/style.css`.
- **Mobile-first**, with one main breakpoint at `48rem` and a second at `68rem` that exists purely
  so the project card images stay large enough to read.
- **Self-hosted fonts** (Space Grotesk + JetBrains Mono, ~58 KB of WOFF2) rather than Google Fonts,
  so there's no third-party request and no visitor IP handed to anyone.
- **Accessibility as a baseline:** semantic landmarks, a skip link, visible focus rings on
  everything interactive, `role="list"` where bullets are styled off, real `alt` text, and every
  animation wrapped in `prefers-reduced-motion`.
- **Progressive enhancement.** JavaScript only ever adds behaviour. Each feature initialises inside
  a `try`/`catch` wrapper so one failure can't take the others down, the nav degrades to a plain
  list of links, and the photo slideshow degrades to a single photo. Nothing on the page requires
  JavaScript to reach the content.
- **No backend, deliberately** — nothing to run, patch or attack. Contact is via LinkedIn.

## Structure

```
index.html        The whole site — one page, anchor-linked sections
css/              Stylesheet
js/               Nav toggle, photo slideshow, sticky header
assets/           Images (WebP), self-hosted fonts, CV
```

## Running locally

No install step. Open `index.html`, or use VS Code's **Live Server** extension so the browser
refreshes as files change.

---

This repository is published from a private development repo, so its commit history starts at the
first publish rather than at the beginning of the project.
