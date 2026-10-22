// ROOTLINE settings and the "last played" note. Everything lives in this browser's localStorage; nothing is sent
// anywhere. Every read and write is wrapped, because storage can be blocked (private windows, cleared site data).

const SETTINGS_KEY = 'lixteam.rootline.settings.v1';
const LAST_KEY = 'lixteam.rootline.last.v1';

export const DEFAULTS = { motion: 'auto', scanlines: true };

export const normalize = (raw) => ({
  motion: raw && raw.motion === 'reduce' ? 'reduce' : 'auto',
  scanlines: !(raw && raw.scanlines === false),
});

export function load() {
  try {
    return normalize(JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'));
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalize(s)));
  } catch {
    /* settings are a convenience */
  }
}

// Put the settings on <html> so stylesheets can react to them.
export function apply(s = load(), root = document.documentElement) {
  root.dataset.motion = s.motion;
  root.dataset.scanlines = s.scanlines ? 'on' : 'off';
}

// True when animation should be skipped: the player asked for it, or the device did.
export function reducedMotion(s = load()) {
  if (s.motion === 'reduce') return true;
  try {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

// ── The two games ───────────────────────────────────────────────
export const GAMES = {
  workspace: { id: 'workspace', name: 'Hands-on Cyber Workspace', short: 'Workspace', href: '/games/workspace/' },
  levelup: { id: 'levelup', name: 'Level Up in Cyber Security', short: 'Level Up', href: '/games/levelup/' },
};

export function noteGame(id, detail = '', now = Date.now()) {
  if (!GAMES[id]) return;
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ game: id, detail: String(detail).slice(0, 120), at: now }));
  } catch {
    /* optional */
  }
}

export function lastGame() {
  try {
    const raw = JSON.parse(localStorage.getItem(LAST_KEY) || 'null');
    return raw && GAMES[raw.game] ? { game: raw.game, detail: typeof raw.detail === 'string' ? raw.detail : '', at: Number(raw.at) || 0 } : null;
  } catch {
    return null;
  }
}
