// The account page: create an account or sign in (email and password, or Google / GitHub / Apple), choose a leaderboard
// nickname, see what has been synced, change the nickname, download your data and delete the account.
// Everything is built with textContent and fixed structure; nothing here parses markup.

import * as shell from '../core/shell.js';
import * as settings from '../core/settings.js';
import { initNav, showNickname } from '../core/account-nav.js';
import { auth, enabled, myProfile, syncNow, syncState, localSummary, forgetSyncState, AuthError } from '../core/account.js';
import { messageFor, nicknameProblem, safeNext } from '../core/sync.js';

shell.init({ addButton: false });
settings.noteGame('levelup');
initNav();

const root = document.getElementById('acct');
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v !== null && v !== undefined) n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids) if (kid) n.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return n;
};
// Where to send the player once they are in: remembered across the sign-in redirect, and only ever a page of this site.
const NEXT_KEY = 'lixteam.rootline.next.v1';
const rememberNext = () => {
  try {
    const q = new URLSearchParams(location.search);
    const n = safeNext(q.get('next'));
    if (n) sessionStorage.setItem(NEXT_KEY, n);
    return { mode: q.get('mode') === 'create' ? 'create' : 'signin' };
  } catch {
    return { mode: 'signin' };
  }
};
const startParams = rememberNext();
const nextPath = () => {
  try {
    return safeNext(sessionStorage.getItem(NEXT_KEY));
  } catch {
    return '';
  }
};
let leaving = false; // this page is signing out itself, so "signed out in another tab" does not apply
const codeOf = (e) => (e instanceof AuthError ? e.code : 'unknown');
const when = (ms) => (ms ? new Date(ms).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');

function show(...nodes) {
  root.replaceChildren(...nodes);
  const h = root.querySelector('h1');
  if (h) {
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  }
}
function say(node, text, kind = '') {
  node.textContent = text;
  node.className = `ac-status${kind ? ' ' + kind : ''}`;
}
const status = () => el('p', { class: 'ac-status', role: 'status' });

function field(label, input, hint) {
  const id = input.id;
  return el('div', { class: 'ac-field' }, el('label', { for: id, text: label }), input, hint ? el('small', { id: id + '-hint', text: hint }) : null);
}
const input = (id, props = {}) => el('input', { id, class: 'ac-input', ...props });
function busy(button, text, fn) {
  const old = button.textContent;
  button.disabled = true;
  button.textContent = text;
  return fn().finally(() => {
    button.disabled = false;
    button.textContent = old;
  });
}

const card = (...kids) => el('section', { class: 'lv-bp-card ac-card' }, ...kids);
const heading = (kicker, title, lead) => [el('p', { class: 'lv-kicker', text: kicker }), el('h1', { text: title }), lead ? el('p', { class: 'lead', text: lead }) : null];

// ── Views ───────────────────────────────────────────────────────

function viewDisabled() {
  show(card(...heading('Account', 'Accounts are not switched on yet'), el('p', { class: 'lead', text: 'ROOTLINE works fully without an account. Your progress is saved in this browser. Accounts and the leaderboard will appear here when they are ready.' }), el('a', { class: 'btn primary big', href: '/games/levelup/' }, 'Back to Level Up')));
}

function viewSignedOut(banner) {
  let mode = 'signin';
  const note = status();
  if (banner) say(note, banner.text, banner.kind);

  const email = input('ac-email', { type: 'email', name: 'email', autocomplete: 'email', required: true, maxlength: 254, inputmode: 'email', spellcheck: 'false' });
  const pw = input('ac-pw', { type: 'password', name: 'password', autocomplete: 'current-password', required: true, maxlength: 200 });
  const pwHint = el('small', { id: 'ac-pw-hint', text: '' });
  const show1 = el('input', { type: 'checkbox', id: 'ac-showpw' });
  show1.addEventListener('change', () => { pw.type = show1.checked ? 'text' : 'password'; });
  const age = el('input', { type: 'checkbox', id: 'ac-age' });
  const ageRow = el('label', { class: 'ac-check', for: 'ac-age' }, age, el('span', {}, 'I am 16 or older, and I have read the ', el('a', { href: '/games/privacy/' }, 'privacy notice'), '.'));
  const submit = el('button', { class: 'btn primary big', type: 'submit', id: 'ac-submit' }, 'Sign in');
  const forgot = el('button', { class: 'ac-link', type: 'button', id: 'ac-forgot' }, 'Forgot your password?');
  const tabSign = el('button', { type: 'button', class: 'ac-tab', id: 'tab-signin', 'aria-pressed': 'true' }, 'Sign in');
  const tabNew = el('button', { type: 'button', class: 'ac-tab', id: 'tab-create', 'aria-pressed': 'false' }, 'Create account');
  const providerBox = el('div', { class: 'ac-providers', role: 'group', 'aria-label': 'Or continue with' });
  const NAMES = { google: 'Google', github: 'GitHub', apple: 'Apple' };

  function setMode(m, keepNote = false) {
    mode = m;
    tabSign.setAttribute('aria-pressed', String(m === 'signin'));
    tabNew.setAttribute('aria-pressed', String(m === 'create'));
    submit.textContent = m === 'signin' ? 'Sign in' : 'Create account';
    pw.autocomplete = m === 'signin' ? 'current-password' : 'new-password';
    pwHint.textContent = m === 'create' ? 'At least 10 characters. A few random words make a strong password.' : '';
    ageRow.hidden = m === 'signin';
    forgot.hidden = m !== 'signin';
    for (const b of providerBox.querySelectorAll('button')) b.disabled = m === 'create' && !age.checked;
    if (!keepNote) say(note, '');
  }
  age.addEventListener('change', () => setMode(mode, true));

  for (const p of auth.providers) {
    providerBox.append(
      el('button', {
        class: 'btn big ac-provider', type: 'button', 'data-provider': p,
        onclick: async (ev) => {
          try {
            location.assign(await auth.providerUrl(p));
          } catch (e) {
            say(note, messageFor(codeOf(e)), 'bad');
          }
        },
      }, `Continue with ${NAMES[p]}`)
    );
  }

  const form = el('form', { class: 'ac-form', novalidate: true }, field('Email', email), field('Password', pw, ''), pwHint, el('label', { class: 'ac-check small', for: 'ac-showpw' }, show1, el('span', { text: 'Show password' })), ageRow, el('div', { class: 'btn-row' }, submit, forgot), note);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const addr = email.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) return say(note, 'Please enter a valid email address.', 'bad');
    if (!pw.value) return say(note, 'Please enter your password.', 'bad');
    if (mode === 'create') {
      if (pw.value.length < 10) return say(note, messageFor('weak_password'), 'bad');
      if (!age.checked) return say(note, messageFor('age_required'), 'bad');
    }
    busy(submit, mode === 'create' ? 'Creating…' : 'Signing in…', async () => {
      try {
        if (mode === 'create') {
          const r = await auth.signUp({ email: addr, password: pw.value, ageConfirmed: true });
          if (r.status === 'confirm') return viewCheckEmail(addr);
        } else {
          await auth.signIn({ email: addr, password: pw.value });
        }
        pw.value = '';
        await viewSignedIn();
      } catch (e) {
        say(note, mode === 'create' && codeOf(e) === 'user_exists' ? messageFor('user_exists') : messageFor(codeOf(e)), 'bad');
      }
    });
  });
  forgot.addEventListener('click', () => viewForgot(email.value.trim()));
  tabSign.addEventListener('click', () => setMode('signin'));
  tabNew.addEventListener('click', () => setMode('create'));

  const copy = el('ul', { class: 'ac-why' },
    el('li', { text: 'An account is optional. Every mission, rank and medal works without one.' }),
    el('li', { text: 'It lets you appear on the leaderboard under a nickname you choose, and keep your result there.' }),
    el('li', { text: 'Your email and real name are never shown to other players.' }),
    el('li', { text: 'Without an account your progress is saved in this browser only. It does not follow you to another device.' }),
    el('li', { text: 'Accounts are for people aged 16 and over.' })
  );
  setMode(startParams.mode, true);
  show(card(...heading('Account', 'Join the leaderboard'), copy, el('div', { class: 'ac-tabs', role: 'group', 'aria-label': 'Sign in or create an account' }, tabSign, tabNew), form, auth.providers.length ? el('div', { class: 'ac-or' }, el('span', { text: 'or' })) : null, auth.providers.length ? providerBox : null));
}

function viewCheckEmail(addr) {
  show(card(...heading('Almost there', 'Check your email', `If that address can be used, we have sent it a link to confirm your account. Open the link on this device to finish signing in. It can take a few minutes to arrive, so check your spam folder too.`), el('p', { class: 'ac-fine', text: `Sent to ${addr}` }), el('button', { class: 'btn big', type: 'button', onclick: () => viewSignedOut() }, 'Back to sign in')));
}

function viewForgot(prefill) {
  const note = status();
  const email = input('ac-reset-email', { type: 'email', autocomplete: 'email', required: true, maxlength: 254, value: prefill || '' });
  const send = el('button', { class: 'btn primary big', type: 'submit' }, 'Send reset link');
  const form = el('form', { class: 'ac-form', novalidate: true }, field('Email', email), el('div', { class: 'btn-row' }, send, el('button', { class: 'btn big', type: 'button', onclick: () => viewSignedOut() }, 'Back')), note);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const addr = email.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) return say(note, 'Please enter a valid email address.', 'bad');
    busy(send, 'Sending…', async () => {
      try {
        await auth.requestReset(addr);
        say(note, 'If that address has an account, a reset link is on its way. Open it on this device.', 'good');
      } catch (e) {
        // The same answer for an unknown address, so this cannot be used to find out who has an account.
        if (['network', 'rate_limited', 'unavailable'].includes(codeOf(e))) say(note, messageFor(codeOf(e)), 'bad');
        else say(note, 'If that address has an account, a reset link is on its way. Open it on this device.', 'good');
      }
    });
  });
  show(card(...heading('Account', 'Reset your password', 'Enter your email address and we will send you a link.'), form));
}

function viewNewPassword() {
  const note = status();
  const pw = input('ac-newpw', { type: 'password', autocomplete: 'new-password', required: true, maxlength: 200 });
  const save = el('button', { class: 'btn primary big', type: 'submit' }, 'Save new password');
  const form = el('form', { class: 'ac-form', novalidate: true }, field('New password', pw, 'At least 10 characters.'), el('div', { class: 'btn-row' }, save), note);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (pw.value.length < 10) return say(note, messageFor('weak_password'), 'bad');
    busy(save, 'Saving…', async () => {
      try {
        await auth.setPassword(pw.value);
        pw.value = '';
        await viewSignedIn('Your password has been changed.');
      } catch (e) {
        say(note, messageFor(codeOf(e)), 'bad');
      }
    });
  });
  show(card(...heading('Account', 'Choose a new password'), form));
}

async function viewSignedIn(banner) {
  show(el('p', { class: 'empty', text: 'Loading your profile…' }));
  let profile;
  try {
    profile = await myProfile();
  } catch (e) {
    if (codeOf(e) === 'not_signed_in') return viewSignedOut();
    const again = el('button', { class: 'btn primary big', type: 'button', onclick: () => viewSignedIn() }, 'Try again');
    return show(card(...heading('Account', 'We could not load your profile', messageFor(codeOf(e))), again));
  }
  showNickname(profile ? profile.nickname : 'Account');
  if (!profile) return viewProfileSetup();
  viewDashboard(profile, banner);
}

function viewProfileSetup() {
  const s = auth.session();
  const note = status();
  const nick = input('ac-nick', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: 20, required: true, 'aria-describedby': 'ac-nick-hint ac-nick-state' });
  const nickState = el('p', { class: 'ac-status', id: 'ac-nick-state', role: 'status' });
  const age = el('input', { type: 'checkbox', id: 'ac-age2' });
  const needAge = !s.ageConfirmed;
  const ageRow = needAge ? el('label', { class: 'ac-check', for: 'ac-age2' }, age, el('span', {}, 'I am 16 or older, and I have read the ', el('a', { href: '/games/privacy/' }, 'privacy notice'), '.')) : el('p', { class: 'ac-fine', text: 'You confirmed you are 16 or older when you signed up.' });
  const vis = el('input', { type: 'checkbox', id: 'ac-vis', checked: true });
  const visRow = el('label', { class: 'ac-check', for: 'ac-vis' }, vis, el('span', { text: 'Show me on the public leaderboard under this nickname.' }));
  const go = el('button', { class: 'btn primary big', type: 'submit' }, 'Create my profile');
  const local = localSummary();

  let timer = null;
  let ticket = 0;
  nick.addEventListener('input', () => {
    clearTimeout(timer);
    const problem = nicknameProblem(nick.value);
    if (!nick.value) return say(nickState, '');
    if (problem) return say(nickState, problem, 'bad');
    say(nickState, 'Checking…');
    const mine = ++ticket;
    timer = setTimeout(async () => {
      try {
        const r = await auth.rpc('rl_check_nickname', { p_nickname: nick.value });
        if (mine !== ticket) return;
        if (r === 'ok') say(nickState, 'That nickname is available.', 'good');
        else say(nickState, messageFor(r === 'taken' ? 'nickname_taken' : r === 'blocked' ? 'nickname_blocked' : 'nickname_invalid'), 'bad');
      } catch {
        if (mine === ticket) say(nickState, '');
      }
    }, 400);
  });

  const form = el('form', { class: 'ac-form', novalidate: true },
    field('Leaderboard nickname', nick, 'This is the only name other players see. 3 to 20 letters, numbers, dots, dashes or underscores. Do not use your real name.'),
    nickState, ageRow, visRow,
    local.count ? el('p', { class: 'ac-fine', text: `This device has ${local.count} passed mission${local.count === 1 ? '' : 's'} worth ${local.xp} XP. They will be added to your leaderboard score once, when you create your profile.` }) : null,
    el('div', { class: 'btn-row' }, go, el('button', { class: 'btn big', type: 'button', onclick: async () => { leaving = true; await auth.signOut(); leaving = false; forgetSyncState(); viewSignedOut(); } }, 'Sign out')), note);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const problem = nicknameProblem(nick.value);
    if (problem) return say(note, problem, 'bad');
    if (needAge && !age.checked) return say(note, messageFor('age_required'), 'bad');
    busy(go, 'Creating…', async () => {
      try {
        await auth.rpc('rl_create_profile', { p_nickname: nick.value, p_age_confirmed: true, p_on_board: vis.checked });
        await syncNow({ force: true });
        await viewSignedIn('Your profile is ready.');
      } catch (e) {
        say(note, messageFor(codeOf(e)), 'bad');
      }
    });
  });
  show(card(...heading('Account', 'Choose your nickname', 'Signed in as ' + s.email), form));
}

function viewDashboard(profile, banner) {
  const s = auth.session();
  const note = status();
  if (banner) say(note, banner, 'good');
  const sync = syncState();
  const local = localSummary();
  const tile = (label, value) => el('div', { class: 'ac-tile' }, el('small', { text: label }), el('strong', { text: String(value) }));
  const tiles = el('div', { class: 'ac-tiles' }, tile('Board XP', profile.xp), tile('Missions passed', profile.passed), tile('Golds', profile.golds), tile('Last synced', profile.synced_at ? when(Date.parse(profile.synced_at)) : 'Not yet'));

  const syncNote = status();
  const syncBtn = el('button', { class: 'btn', type: 'button', id: 'ac-sync' }, 'Sync now');
  const explain = () => {
    if (!local.count) return 'Pass a mission and it will be added to the board.';
    if (local.xp === profile.xp) return 'Your board score matches the progress saved on this device.';
    if (local.xp > profile.xp) return `This device has ${local.xp} XP of mission results; the board has ${profile.xp}. ${sync.deferred ? 'Some results are waiting because of the hourly and daily limits. They are added on later syncs.' : 'Sync now to add the difference.'}`;
    return `The board has ${profile.xp} XP; this device has ${local.xp}. That is normal if you played on another device.`;
  };
  say(syncNote, explain());
  syncBtn.addEventListener('click', () => busy(syncBtn, 'Syncing…', async () => {
    const r = await syncNow({ force: true });
    if (r.status === 'synced' || r.status === 'up_to_date') {
      const p = await myProfile().catch(() => null);
      if (p) return viewDashboard(p, r.deferred ? `Synced. ${r.deferred} result${r.deferred === 1 ? ' is' : 's are'} waiting because of the hourly and daily limits.` : 'Synced.');
    }
    say(syncNote, r.status === 'wait' ? messageFor('too_fast') : r.status === 'nothing' ? 'Nothing to send yet: pass a mission first.' : r.status === 'error' ? messageFor(r.code) : explain(), r.status === 'error' ? 'bad' : '');
  }));

  // Nickname
  const nickNote = status();
  const nick = input('ac-nick', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: 20, value: profile.nickname, required: true });
  const nickBtn = el('button', { class: 'btn', type: 'submit' }, 'Change nickname');
  const nickForm = el('form', { class: 'ac-form inline', novalidate: true }, field('Nickname', nick, profile.nickname_can_change_at && Date.parse(profile.nickname_can_change_at) > Date.now() ? `You can change it again after ${when(Date.parse(profile.nickname_can_change_at))}.` : 'You can change it once a week.'), el('div', { class: 'btn-row' }, nickBtn), nickNote);
  nickForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const problem = nicknameProblem(nick.value);
    if (problem) return say(nickNote, problem, 'bad');
    busy(nickBtn, 'Saving…', async () => {
      try {
        await auth.rpc('rl_set_nickname', { p_nickname: nick.value });
        const p = await myProfile();
        showNickname(p.nickname);
        viewDashboard(p, 'Nickname changed.');
      } catch (e) {
        say(nickNote, messageFor(codeOf(e)), 'bad');
      }
    });
  });

  // Visibility
  const visNote = status();
  const vis = el('input', { type: 'checkbox', id: 'ac-vis', checked: !!profile.on_board });
  vis.addEventListener('change', async () => {
    vis.disabled = true;
    try {
      await auth.rpc('rl_set_visibility', { p_on_board: vis.checked });
      say(visNote, vis.checked ? 'You are on the public leaderboard.' : 'You are hidden from the public leaderboard.', 'good');
    } catch (e) {
      vis.checked = !vis.checked;
      say(visNote, messageFor(codeOf(e)), 'bad');
    } finally {
      vis.disabled = false;
    }
  });

  // Password (email accounts only)
  let pwSection = null;
  if (s.provider === 'email') {
    const pwNote = status();
    const pw = input('ac-changepw', { type: 'password', autocomplete: 'new-password', maxlength: 200 });
    const pwBtn = el('button', { class: 'btn', type: 'submit' }, 'Change password');
    const pwForm = el('form', { class: 'ac-form inline', novalidate: true }, field('New password', pw, 'At least 10 characters.'), el('div', { class: 'btn-row' }, pwBtn), pwNote);
    pwForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (pw.value.length < 10) return say(pwNote, messageFor('weak_password'), 'bad');
      busy(pwBtn, 'Saving…', async () => {
        try {
          await auth.setPassword(pw.value);
          pw.value = '';
          say(pwNote, 'Password changed.', 'good');
        } catch (e) {
          say(pwNote, messageFor(codeOf(e)), 'bad');
        }
      });
    });
    pwSection = el('section', { class: 'ac-sec' }, el('h2', { text: 'Password' }), pwForm);
  }

  // Your data
  const dataNote = status();
  const exportBtn = el('button', { class: 'btn', type: 'button', id: 'ac-export' }, 'Download my data');
  exportBtn.addEventListener('click', () => busy(exportBtn, 'Preparing…', async () => {
    try {
      const data = await auth.rpc('rl_export_my_data');
      data.email = s.email;
      data.sign_in_method = s.provider;
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = el('a', { href: url, download: 'rootline-my-data.json' });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      say(dataNote, 'Your data was downloaded.', 'good');
    } catch (e) {
      say(dataNote, messageFor(codeOf(e)), 'bad');
    }
  }));
  const outBtn = el('button', { class: 'btn', type: 'button', id: 'ac-signout' }, 'Sign out');
  outBtn.addEventListener('click', () => busy(outBtn, 'Signing out…', async () => {
    leaving = true;
    await auth.signOut();
    leaving = false;
    forgetSyncState();
    viewSignedOut({ text: 'You are signed out. Your progress is still saved in this browser.', kind: 'good' });
  }));

  // Delete
  const delNote = status();
  const confirmIn = input('ac-delete-confirm', { type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: 'DELETE', 'aria-label': 'Type DELETE to confirm' });
  const delBtn = el('button', { class: 'btn danger', type: 'button', id: 'ac-delete', disabled: true }, 'Delete my account');
  confirmIn.addEventListener('input', () => { delBtn.disabled = confirmIn.value.trim() !== 'DELETE'; });
  delBtn.addEventListener('click', () => busy(delBtn, 'Deleting…', async () => {
    try {
      const r = await auth.rpc('rl_delete_my_account');
      leaving = true;
      await auth.signOut().catch(() => {});
      auth.forget();
      leaving = false;
      forgetSyncState();
      show(card(...heading('Done', r === 'account_deleted' ? 'Your account has been deleted' : 'Your leaderboard data has been deleted', r === 'account_deleted' ? 'Your nickname, results and sign-in have been removed. Progress saved in this browser was not touched.' : 'Your nickname and results have been removed from the leaderboard and you are signed out. To remove the sign-in itself, email teamlix6@gmail.com from the address you signed up with. Progress saved in this browser was not touched.'), el('a', { class: 'btn primary big', href: '/games/levelup/' }, 'Back to Level Up')));
    } catch (e) {
      say(delNote, messageFor(codeOf(e)), 'bad');
    }
  }));

  show(
    card(
      ...heading('Account', profile.nickname, `Signed in as ${s.email || 'your account'}${s.provider && s.provider !== 'email' ? ' with ' + s.provider[0].toUpperCase() + s.provider.slice(1) : ''}.`),
      tiles,
      note,
      nextPath() ? el('div', { class: 'btn-row' }, el('a', { class: 'btn primary big', id: 'ac-back', href: nextPath() }, 'Back to your game')) : null,
      el('section', { class: 'ac-sec' }, el('h2', { text: 'Leaderboard score' }), el('p', { class: 'ac-fine', text: 'Your score is self-reported: it is worked out from the progress saved in this browser, and the server checks it is possible (real missions, medals that only go up, and limits on how fast a score can grow). It is labelled that way on the board.' }), syncNote, el('div', { class: 'btn-row' }, syncBtn, el('a', { class: 'btn', href: '/games/levelup/leaderboard.html' }, 'View the leaderboard'))),
      el('section', { class: 'ac-sec' }, el('h2', { text: 'Nickname' }), nickForm, el('label', { class: 'ac-check', for: 'ac-vis' }, vis, el('span', { text: 'Show me on the public leaderboard' })), visNote),
      pwSection,
      el('section', { class: 'ac-sec' }, el('h2', { text: 'Your data' }), el('p', { class: 'ac-fine', text: 'You can download everything held about you, or sign out of this device.' }), el('div', { class: 'btn-row' }, exportBtn, outBtn), dataNote),
      el('section', { class: 'ac-sec danger' }, el('h2', { text: 'Delete my account' }), el('p', { class: 'ac-fine', text: 'This removes your nickname, your leaderboard results and your sign-in. It cannot be undone. Progress saved in this browser stays on this device.' }), field('Type DELETE to confirm', confirmIn), el('div', { class: 'btn-row' }, delBtn), delNote)
    )
  );
}

// ── Start ───────────────────────────────────────────────────────

async function start() {
  if (!enabled) return viewDisabled();
  const search = location.search;
  const ret = await auth.handleReturn(search);
  if (ret.handled) history.replaceState(null, '', location.pathname); // the one-time code does not stay in the address bar
  if (ret.handled && !ret.ok) {
    const text = ret.code === 'other_device' ? (ret.flow === 'confirm' ? 'Your email address is confirmed. Sign in to continue.' : 'Open that link on the device where you asked for it, or ask for a new one.') : 'That link has expired or has already been used. Please try again.';
    return viewSignedOut({ text, kind: ret.code === 'other_device' && ret.flow === 'confirm' ? 'good' : 'bad' });
  }
  if (ret.ok && ret.flow === 'recover') return viewNewPassword();
  if (auth.session()) return viewSignedIn();
  viewSignedOut();
}

auth.onChange((s) => {
  // Signed out in another tab.
  if (!s && !leaving && root.querySelector('#ac-signout')) viewSignedOut({ text: 'You were signed out in another tab.', kind: '' });
});
start();
