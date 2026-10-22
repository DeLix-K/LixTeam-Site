// Shared page chrome for the game modes: a mode icon in the top bar and a hero tile
// on intro screens. The mode comes from <body data-mode="...">. Only fixed SVG shapes
// from art.js are added; nothing here parses markup.

import { modeIcon, MODE_COLOUR } from './art.js';
import { init as initShell } from './shell.js';
import { mountHud } from './mission-link.js';

const mode = document.body.dataset.mode;

if (mode && MODE_COLOUR[mode]) {
  document.body.style.setProperty('--mode', MODE_COLOUR[mode]);

  const spacer = document.querySelector('.top .spacer');
  if (spacer) {
    spacer.classList.add('mode-chip');
    spacer.replaceChildren(modeIcon(mode, 20));
  }

  // Intro screens (the ones that explain how to play) get a hero tile above the eyebrow.
  for (const screen of document.querySelectorAll('.screen')) {
    if (!screen.querySelector('.howto')) continue;
    const eyebrow = screen.querySelector('.eyebrow');
    if (!eyebrow) continue;
    const hero = document.createElement('div');
    hero.className = 'mode-hero';
    hero.setAttribute('aria-hidden', 'true');
    hero.append(modeIcon(mode, 34));
    eyebrow.before(hero);
  }
}

initShell();
if (mode) mountHud(mode);
